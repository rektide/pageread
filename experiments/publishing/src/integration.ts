#!/usr/bin/env node
import { readFile, realpath } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { Store } from 'oxigraph';
import { exampleNames, prepareDataset, publish, readback } from './publish.ts';
import { mockPds, mockRepo } from './mock-pds.ts';

// Read-only file seam: run from this package after the graph experiment's export.
async function main() {
const path = process.argv[2] ?? '../graphs/exports/dataset.nq';
const input = await readFile(path, 'utf8');
const prepared = await prepareDataset(exampleNames, input, 'application/n-quads', {
  createdAt: '2026-10-20T00:00:00.000Z',
  sourceUri: 'urn:pageread:experiment:graphs:fixture-export',
  evidence: 'Read-only integration of experiments/graphs fixture dataset export; source documents remain in its bundle.json and are not uploaded.',
}, 'fixture-projection/1');
const mock = mockPds(exampleNames);
mock.server.listen({ onUnhandledFrame: 'error' });
try {
  const written = await publish(mock.agent, mockRepo, 'graphs-integration', prepared);
  const result = await readback(mock.agent, mockRepo, 'graphs-integration', prepared);
  assert.equal(new TextDecoder().decode(result.bytes), input);
  const imported = new Store();
  imported.load(result.bytes, { format: 'application/n-quads' });
  const graphKinds = new Set(imported.match().map((q) => q.graph.termType));
  assert.ok(graphKinds.has('DefaultGraph'));
  assert.ok(graphKinds.has('NamedNode'));
  console.log(JSON.stringify({
    mode: 'MSW mock PDS only; adjacent graph export', path,
    quads: imported.size, graphs: prepared.record.graphs,
    bytes: result.bytes.byteLength, exactInputBytes: true,
    cid: written.cid, trace: mock.trace,
  }, null, 2));
} finally { mock.server.close(); }
}
if (process.argv[1]) realpath(process.argv[1]).then((path) => {
  if (path === fileURLToPath(import.meta.url)) return main();
});
