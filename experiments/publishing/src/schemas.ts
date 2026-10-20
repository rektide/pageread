import { Lexicons, type LexiconDoc } from '@atproto/lexicon';
import { NSID } from '@atproto/syntax';

export const limits = { bytes: 1_048_576, quads: 10_000, graphs: 128, recordBytes: 32_768 };
export interface Names { dataset: string; reader: string }
// Reserved example domain: provisional vocabulary, no authority claim.
export const exampleNames: Names = {
  dataset: 'com.example.pageread.experimental.dataset',
  reader: 'com.example.pageread.experimental.reader',
};
export function schemas(names: Names): LexiconDoc[] {
  if (names.dataset === names.reader) throw new Error('Collections must differ');
  Object.values(names).forEach((id) => NSID.parse(id));
  const string = { type: 'string', minLength: 1, maxLength: 1024 } as const;
  const common = {
    createdAt: { type: 'string', format: 'datetime' },
    sourceUri: { type: 'string', format: 'uri', maxLength: 2048 },
    evidence: { type: 'string', maxLength: 4096 },
  } as const;
  return [
    {
      lexicon: 1, id: NSID.parse(names.dataset).toString(),
      defs: { main: { type: 'record', key: 'any', record: {
        type: 'object', required: ['createdAt', 'sourceUri', 'evidence', 'payload', 'mappingVersion', 'graphs', 'quadCount'],
        properties: {
          ...common,
          payload: { type: 'blob', accept: ['application/n-quads', 'application/trig'], maxSize: limits.bytes },
          mappingVersion: string,
          quadCount: { type: 'integer', minimum: 0, maximum: limits.quads },
          graphs: { type: 'array', maxLength: limits.graphs, items: { type: 'ref', ref: '#graph' } },
        },
      } }, graph: {
        type: 'object', required: ['kind', 'value'], properties: {
          kind: { type: 'string', enum: ['DefaultGraph', 'NamedNode', 'BlankNode'] },
          value: { type: 'string', maxLength: 2048 },
        },
      } },
    },
    {
      lexicon: 1, id: NSID.parse(names.reader).toString(),
      defs: { main: { type: 'record', key: 'any', record: {
        type: 'object', required: ['createdAt', 'sourceUri', 'evidence', 'payload', 'version', 'entrypoint', 'runtime', 'artifactKind'],
        properties: {
          ...common,
          payload: { type: 'blob', accept: ['text/javascript', 'application/zip'], maxSize: limits.bytes },
          artifactKind: { type: 'string', enum: ['script', 'package'] },
          version: string, entrypoint: string, runtime: string,
        },
      } } },
    },
  ];
}
export function catalog(names: Names): Lexicons { return new Lexicons(schemas(names)); }

/** A schema publication plan, NOT an RDF/reader data publication. No DNS/network side effects. */
export function schemaPlans(names: Names, repo: string) {
  return schemas(names).map((doc) => ({
    authorityTxt: `_lexicon.${NSID.parse(doc.id).authority}`,
    expectedTxt: `did=${repo}`,
    request: {
      repo, collection: 'com.atproto.lexicon.schema', rkey: doc.id,
      record: { $type: 'com.atproto.lexicon.schema', ...doc }, validate: true,
    },
  }));
}
