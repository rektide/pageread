import { Agent } from '@atproto/api';
import { isDeepStrictEqual } from 'node:util';
import { BlobRef, jsonToLex, lexToJson } from '@atproto/lexicon';
import { asMultiformatsCID, cidForRawBytes } from '@atproto/lex-data';
import { Store } from 'oxigraph';
import { catalog, limits, type Names } from './schemas.ts';
export { schemaPlans, schemas, exampleNames, limits } from './schemas.ts';

export interface Provenance { createdAt: string; sourceUri: string; evidence: string }
export interface Prepared {
  names: Names;
  record: Record<string, unknown> & { $type: string; payload: BlobRef };
  bytes: Uint8Array;
}
export type DatasetMime = 'application/n-quads' | 'application/trig';
function bounded(bytes: Uint8Array) {
  if (bytes.byteLength > limits.bytes) throw new Error(`Payload exceeds ${limits.bytes} bytes`);
}
export function validate(prepared: Prepared) {
  bounded(prepared.bytes);
  catalog(prepared.names).assertValidRecord(prepared.record.$type, prepared.record);
  if (Buffer.byteLength(JSON.stringify(lexToJson(prepared.record))) > limits.recordBytes) {
    throw new Error('Record exceeds local metadata budget');
  }
}
async function prepare(names: Names, bytes: Uint8Array, mime: string, fields: Record<string, unknown> & { $type: string }): Promise<Prepared> {
  bounded(bytes);
  const payload = new BlobRef(asMultiformatsCID(await cidForRawBytes(bytes)), mime, bytes.byteLength);
  const result = { names, bytes, record: { ...fields, payload } };
  validate(result);
  return result;
}
export async function prepareDataset(names: Names, input: string, mime: DatasetMime, provenance: Provenance, mappingVersion: string): Promise<Prepared> {
  bounded(new TextEncoder().encode(input));
  if (!['application/n-quads', 'application/trig'].includes(mime)) throw new Error('Dataset MIME must preserve named graphs');
  const store = new Store();
  store.load(input, { format: mime });
  if (store.size > limits.quads) throw new Error('Too many quads');
  const graphs = new Map<string, { kind: string; value: string }>();
  for (const q of store.match()) {
    graphs.set(`${q.graph.termType}:${q.graph.value}`, { kind: q.graph.termType, value: q.graph.value });
  }
  if (graphs.size > limits.graphs) throw new Error('Too many graphs');
  // Store serialization retains the RDF dataset, not just the default graph.
  const bytes = new TextEncoder().encode(store.dump({ format: mime }));
  return prepare(names, bytes, mime, {
    $type: names.dataset, ...provenance, mappingVersion,
    quadCount: store.size, graphs: [...graphs.values()],
  });
}
export async function prepareReader(names: Names, bytes: Uint8Array, mime: 'text/javascript' | 'application/zip', provenance: Provenance,
  declaration: { version: string; entrypoint: string; runtime: string; artifactKind: 'script' | 'package' }): Promise<Prepared> {
  if ((mime === 'text/javascript') !== (declaration.artifactKind === 'script')) throw new Error('Artifact kind/MIME mismatch');
  // Runtime is a declaration, not eligibility or permission to execute.
  return prepare(names, bytes, mime, { $type: names.reader, ...provenance, ...declaration });
}

/** Inject an authenticated Agent (e.g. Agent(oauthSession)); this module owns no credentials. */
export async function publish(agent: Agent, repo: string, rkey: string, prepared: Prepared, swapRecord: string | null = null) {
  validate(prepared);
  const expected = await cidForRawBytes(prepared.bytes);
  if (!expected.equals(prepared.record.payload.ref)) throw new Error('Prepared payload was modified');
  const uploaded = (await agent.com.atproto.repo.uploadBlob(prepared.bytes, { encoding: prepared.record.payload.mimeType })).data.blob;
  if (!uploaded.ref.equals(expected) || uploaded.size !== prepared.bytes.byteLength || uploaded.mimeType !== prepared.record.payload.mimeType) {
    throw new Error('PDS upload metadata/content mismatch');
  }
  const record = { ...prepared.record, payload: uploaded };
  catalog(prepared.names).assertValidRecord(record.$type, record);
  // Require server-side validation. A real PDS must know/resolve these provisional schemas first.
  return (await agent.com.atproto.repo.putRecord({ repo, collection: record.$type, rkey, record, validate: true, swapRecord })).data;
}

/** Readback stays data. No eval/import/registration of downloaded readers. */
export async function readback(agent: Agent, repo: string, rkey: string, prepared: Prepared) {
  const result = (await agent.com.atproto.repo.getRecord({ repo, collection: prepared.record.$type, rkey })).data;
  const record = jsonToLex(lexToJson(result.value)) as Prepared['record'];
  catalog(prepared.names).assertValidRecord(prepared.record.$type, record);
  if (!isDeepStrictEqual(lexToJson(record), lexToJson(prepared.record))) throw new Error('Record readback differs');
  // The generated SDK decodes text/javascript as text despite getBlob's Uint8Array
  // type. Use the same authenticated transport, retaining the exact bytes instead.
  const query = new URLSearchParams({ did: repo, cid: record.payload.ref.toString() });
  const response = await agent.fetchHandler(`/xrpc/com.atproto.sync.getBlob?${query}`, { method: 'GET' });
  if (!response.ok) throw new Error(`Blob read failed: HTTP ${response.status}`);
  if (!response.body) throw new Error('Missing blob body');
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limits.bytes || size > record.payload.size) {
        await reader.cancel();
        throw new Error('Downloaded blob exceeds byte limit');
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  if (!(await cidForRawBytes(bytes)).equals(record.payload.ref) || bytes.byteLength !== record.payload.size) throw new Error('Blob readback differs');
  return { ...result, record, bytes };
}
