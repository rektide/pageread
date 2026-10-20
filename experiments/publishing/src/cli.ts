#!/usr/bin/env node
import { readFile, realpath } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { lexToJson } from '@atproto/lexicon';
import { prepareDataset, prepareReader, publish, readback, schemaPlans, exampleNames, type DatasetMime } from './publish.ts';
import { dataset, source, provenance } from './fixtures.ts';

async function main() {
  const [command = 'dry-run', kind = 'dataset', path, mimeArg] = process.argv.slice(2);
  if (!['dry-run', 'smoke', 'schemas'].includes(command)) throw new Error('Use dry-run [dataset|reader] [file] [MIME], smoke, or schemas');
  if (!['dataset', 'reader'].includes(kind)) throw new Error('Use dataset or reader');
  if (command === 'schemas') {
    console.log(JSON.stringify(schemaPlans(exampleNames, 'did:plc:abcdefghijklmnopqrstuvwx'), null, 2));
    return;
  }
  const prepared = kind === 'dataset'
    ? await prepareDataset(exampleNames, path ? await readFile(path, 'utf8') : dataset, (mimeArg ?? 'application/n-quads') as DatasetMime, provenance, 'rdf-dataset-identity-v1')
    : await prepareReader(exampleNames, path ? await readFile(path) : new TextEncoder().encode(source), 'text/javascript', provenance,
      { version: '0.0.0', entrypoint: 'read', runtime: 'javascript-esm-dom', artifactKind: 'script' });
  if (command === 'dry-run') {
    console.log(JSON.stringify({ mode: 'dry-run; no upload', record: lexToJson(prepared.record), payloadUtf8: new TextDecoder().decode(prepared.bytes) }, null, 2));
    return;
  }
  const { mockPds, mockRepo } = await import('./mock-pds.ts');
  const mock = mockPds(exampleNames);
  mock.server.listen({ onUnhandledFrame: 'error' });
  try {
    const written = await publish(mock.agent, mockRepo, 'fixture', prepared);
    const fetched = await readback(mock.agent, mockRepo, 'fixture', prepared);
    if (fetched.cid !== written.cid) throw new Error('CID changed on readback');
    console.log(JSON.stringify({ mode: 'MSW mock PDS only', ...written, bytes: fetched.bytes.byteLength, trace: mock.trace }, null, 2));
  } finally { mock.server.close(); }
}
if (process.argv[1]) realpath(process.argv[1]).then((path) => {
  if (path === fileURLToPath(import.meta.url)) return main();
});
