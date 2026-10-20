import test from 'node:test';
import assert from 'node:assert/strict';
import { Agent } from '@atproto/api';
import { HttpResponse, http } from 'msw';
import { Store } from 'oxigraph';
import { lexToJson } from '@atproto/lexicon';
import { prepareDataset, prepareReader, publish, readback, exampleNames, schemaPlans, limits } from './publish.ts';
import { catalog } from './schemas.ts';
import { mockPds, mockRepo, mockOrigin } from './mock-pds.ts';
import { dataset, source, provenance } from './fixtures.ts';

test('dataset and reader publication through official Agent and MSW XRPC', async (t) => {
  const mock = mockPds(exampleNames);
  mock.server.listen({ onUnhandledFrame: 'error' });
  t.after(() => mock.server.close());
  for (const mime of ['application/n-quads', 'application/trig'] as const) {
    await t.test(`${mime} keeps default/named/blank graphs and literal types`, async () => {
      const input = new Store();
      input.load(dataset, { format: 'application/n-quads' });
      const prepared = await prepareDataset(exampleNames, input.dump({ format: mime }), mime, provenance, 'rdf-dataset-identity-v1');
      const written = await publish(mock.agent, mockRepo, mime.endsWith('trig') ? 'trig' : 'nquads', prepared);
      const result = await readback(mock.agent, mockRepo, mime.endsWith('trig') ? 'trig' : 'nquads', prepared);
      assert.equal(result.cid, written.cid);
      assert.deepEqual(mock.trace.slice(-4), ['uploadBlob', 'putRecord', 'getRecord', 'getBlob']);
      const imported = new Store();
      imported.load(result.bytes, { format: mime });
      assert.equal(imported.size, 4);
      assert.equal(imported.query('ASK { <urn:page:1> <urn:title> "Bonjour"@fr }'), true);
      assert.equal(imported.query('ASK { GRAPH <urn:graph:extraction> { <urn:page:1> <urn:count> "7"^^<http://www.w3.org/2001/XMLSchema#integer> . ?item <urn:source> <urn:page:1> } }'), true);
      assert.equal(imported.match().filter((q) => q.graph.termType === 'BlankNode').length, 1);
      assert.deepEqual(new Set((prepared.record.graphs as { kind: string }[]).map((g) => g.kind)), new Set(['DefaultGraph', 'NamedNode', 'BlankNode']));
    });
  }
  await t.test('reader source is retrieved byte-for-byte without executing it; CAS protects existing records', async () => {
    const prepared = await prepareReader(exampleNames, new TextEncoder().encode(source), 'text/javascript', provenance,
      { version: '0.1.0', entrypoint: 'read', runtime: 'javascript-esm-dom', artifactKind: 'script' });
    const written = await publish(mock.agent, mockRepo, 'reader', prepared);
    const fetched = await readback(mock.agent, mockRepo, 'reader', prepared);
    assert.equal(new TextDecoder().decode(fetched.bytes), source);
    await assert.rejects(publish(mock.agent, mockRepo, 'reader', prepared), /swap/i);
    assert.equal((await publish(mock.agent, mockRepo, 'reader', prepared, written.cid)).cid, written.cid);
  });
  await t.test('authentication errors surface', async () => {
    const unauthenticated = new Agent(mockOrigin);
    const prepared = await prepareDataset(exampleNames, dataset, 'application/n-quads', provenance, 'v1');
    await assert.rejects(publish(unauthenticated, mockRepo, 'unauth', prepared), /AuthRequired/);
  });
  await t.test('modified local payload fails before upload', async () => {
    const prepared = await prepareDataset(exampleNames, dataset, 'application/n-quads', provenance, 'v1');
    const count = mock.trace.length;
    prepared.bytes[0] ^= 1;
    await assert.rejects(publish(mock.agent, mockRepo, 'modified', prepared), /modified/);
    assert.equal(mock.trace.length, count);
  });
  await t.test('wrong upload metadata fails before putRecord', async () => {
    const prepared = await prepareDataset(exampleNames, dataset, 'application/n-quads', provenance, 'v1');
    const blob = lexToJson(prepared.record.payload) as Record<string, unknown>;
    mock.server.use(http.post(`${mockOrigin}/xrpc/com.atproto.repo.uploadBlob`, () => HttpResponse.json({ blob: { ...blob, size: 1 } })));
    await assert.rejects(publish(mock.agent, mockRepo, 'badblob', prepared), /mismatch/);
    assert.equal(mock.records.has(`${exampleNames.dataset}/badblob`), false);
    mock.server.resetHandlers();
  });
  await t.test('tampered downloaded bytes are rejected', async () => {
    const prepared = await prepareDataset(exampleNames, dataset, 'application/n-quads', provenance, 'v1');
    await publish(mock.agent, mockRepo, 'corrupt', prepared);
    mock.blobs.get(prepared.record.payload.ref.toString())!.bytes[0] ^= 1;
    await assert.rejects(readback(mock.agent, mockRepo, 'corrupt', prepared), /differs/);
  });
});

test('limits and schema validation reject bad input', async () => {
  await assert.rejects(prepareDataset(exampleNames, 'not rdf', 'application/n-quads', provenance, 'v1'));
  await assert.rejects(prepareDataset(exampleNames, ' '.repeat(limits.bytes + 1), 'application/n-quads', provenance, 'v1'), /bytes/);
  const tooManyGraphs = Array.from({ length: limits.graphs + 1 }, (_, i) => `<urn:s> <urn:p> <urn:o> <urn:g:${i}> .`).join('\n');
  await assert.rejects(prepareDataset(exampleNames, tooManyGraphs, 'application/n-quads', provenance, 'v1'), /graphs/);
  const tooManyQuads = Array.from({ length: limits.quads + 1 }, (_, i) => `<urn:s:${i}> <urn:p> <urn:o> .`).join('\n');
  await assert.rejects(prepareDataset(exampleNames, tooManyQuads, 'application/n-quads', provenance, 'v1'), /quads/);
  const prepared = await prepareDataset(exampleNames, dataset, 'application/n-quads', provenance, 'v1');
  assert.throws(() => catalog(exampleNames).assertValidRecord(exampleNames.dataset, { ...prepared.record, mappingVersion: '' }));
  assert.throws(() => catalog(exampleNames).assertValidRecord(exampleNames.dataset, { ...prepared.record, quadCount: 0.5 }));
  assert.throws(() => catalog(exampleNames).assertValidRecord(exampleNames.dataset, { ...prepared.record, createdAt: 'yesterday' }));
});

test('schema plans are distinct publications with full authority and NSID keys', () => {
  const plans = schemaPlans(exampleNames, mockRepo);
  assert.equal(plans[0].authorityTxt, '_lexicon.experimental.pageread.example.com');
  for (const plan of plans) {
    assert.equal(plan.request.collection, 'com.atproto.lexicon.schema');
    assert.equal(plan.request.rkey, plan.request.record.id);
    assert.equal(plan.request.record.$type, 'com.atproto.lexicon.schema');
    assert.equal('payload' in plan.request.record, false);
  }
});
