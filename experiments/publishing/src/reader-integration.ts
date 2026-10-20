#!/usr/bin/env node
import { readFile, realpath } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { exampleNames, prepareReader, publish, readback } from './publish.ts';
import { mockPds, mockRepo } from './mock-pds.ts';

async function main() {
  const path = process.argv[2];
  if (!path) throw new Error('Pass the retained JSON artifact printed by experiments/reader-loop pnpm demo');
  const artifact: unknown = JSON.parse(await readFile(path, 'utf8'));
  assert.ok(artifact && typeof artifact === 'object');
  for (const field of ['id', 'code', 'runtime', 'mimeType', 'generatedBy', 'operationId']) {
    assert.equal(typeof Reflect.get(artifact, field), 'string', `Missing reader ${field}`);
  }
  const { id, code, runtime, mimeType, generatedBy, operationId, matches } = artifact as {
    id: string; code: string; runtime: string; mimeType: string;
    generatedBy: string; operationId: string; matches: unknown;
  };
  assert.equal(mimeType, 'text/javascript');
  assert.equal(runtime, 'chrome-user-script');
  assert.ok(Array.isArray(matches) && matches.every((match) => typeof match === 'string'));
  const prepared = await prepareReader(exampleNames, new TextEncoder().encode(code), mimeType, {
    createdAt: new Date().toISOString(),
    sourceUri: `urn:pageread:reader:${encodeURIComponent(id)}`,
    evidence: JSON.stringify({ id, matches, generatedBy, operationId, integration: 'retained reader-loop artifact' }),
  }, { version: '0.0.0', entrypoint: 'script-body', runtime, artifactKind: 'script' });
  const mock = mockPds(exampleNames);
  mock.server.listen({ onUnhandledFrame: 'error' });
  try {
    const written = await publish(mock.agent, mockRepo, 'reader-integration', prepared);
    const fetched = await readback(mock.agent, mockRepo, 'reader-integration', prepared);
    assert.equal(new TextDecoder().decode(fetched.bytes), code);
    assert.equal(fetched.record.runtime, runtime);
    assert.deepEqual(JSON.parse(fetched.record.evidence as string).matches, matches);
    console.log(JSON.stringify({
      mode: 'MSW mock PDS only; retained reader artifact; no downloaded-code execution',
      path, readerId: id, runtime, bytes: fetched.bytes.byteLength,
      exactCodeBytes: true, uri: written.uri, cid: written.cid, trace: mock.trace,
    }, null, 2));
  } finally { mock.server.close(); }
}

if (process.argv[1]) realpath(process.argv[1]).then((path) => {
  if (path === fileURLToPath(import.meta.url)) return main();
});
