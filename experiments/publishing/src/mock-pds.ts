import { Agent } from '@atproto/api';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { cidForRawBytes, type LexValue } from '@atproto/lex-data';
import { cidForLex } from '@atproto/lex-cbor';
import { jsonToLex, lexToIpld } from '@atproto/lexicon';
import { catalog, type Names } from './schemas.ts';

export const mockRepo = 'did:plc:abcdefghijklmnopqrstuvwx';
export const mockOrigin = 'https://pds.example.invalid';
/** In-memory XRPC boundary test, not an implementation of a repository/PDS. */
export function mockPds(names: Names) {
  const lex = catalog(names);
  const blobs = new Map<string, { bytes: Uint8Array; mime: string }>();
  const records = new Map<string, { uri: string; cid: string; value: Record<string, unknown> }>();
  const trace: string[] = [];
  const server = setupServer(
    http.post(`${mockOrigin}/xrpc/com.atproto.repo.uploadBlob`, async ({ request }) => {
      if (request.headers.get('authorization') !== 'Bearer mock-only') return HttpResponse.json({ error: 'AuthRequired' }, { status: 401 });
      trace.push('uploadBlob');
      const bytes = new Uint8Array(await request.arrayBuffer());
      const cid = (await cidForRawBytes(bytes)).toString();
      const mime = request.headers.get('content-type')!;
      blobs.set(cid, { bytes, mime });
      return HttpResponse.json({ blob: { $type: 'blob', ref: { $link: cid }, mimeType: mime, size: bytes.byteLength } });
    }),
    http.post(`${mockOrigin}/xrpc/com.atproto.repo.putRecord`, async ({ request }) => {
      if (request.headers.get('authorization') !== 'Bearer mock-only') return HttpResponse.json({ error: 'AuthRequired' }, { status: 401 });
      trace.push('putRecord');
      const body = await request.json() as { repo: string; collection: string; rkey: string; validate: boolean; swapRecord?: string | null; record: Record<string, unknown> };
      if (body.repo !== mockRepo || !body.validate || body.record.$type !== body.collection) return HttpResponse.json({ error: 'InvalidRequest' }, { status: 400 });
      const value = jsonToLex(body.record as Parameters<typeof jsonToLex>[0]);
      lex.assertValidRecord(body.collection, value);
      const payload = body.record.payload as { ref: { $link: string }; size: number; mimeType: string };
      const blob = blobs.get(payload.ref.$link);
      if (!blob || blob.bytes.byteLength !== payload.size || blob.mime !== payload.mimeType) return HttpResponse.json({ error: 'BlobNotFound' }, { status: 400 });
      const key = `${body.collection}/${body.rkey}`;
      if (body.swapRecord !== undefined && (records.get(key)?.cid ?? null) !== body.swapRecord) return HttpResponse.json({ error: 'InvalidSwap' }, { status: 400 });
      const cid = (await cidForLex(lexToIpld(value) as LexValue)).toString();
      const uri = `at://${mockRepo}/${key}`;
      records.set(key, { uri, cid, value: body.record });
      return HttpResponse.json({ uri, cid, validationStatus: 'valid' });
    }),
    http.get(`${mockOrigin}/xrpc/com.atproto.repo.getRecord`, ({ request }) => {
      trace.push('getRecord');
      const q = new URL(request.url).searchParams;
      const result = q.get('repo') === mockRepo && records.get(`${q.get('collection')}/${q.get('rkey')}`);
      return result ? HttpResponse.json(result) : HttpResponse.json({ error: 'RecordNotFound' }, { status: 404 });
    }),
    http.get(`${mockOrigin}/xrpc/com.atproto.sync.getBlob`, ({ request }) => {
      trace.push('getBlob');
      const q = new URL(request.url).searchParams;
      const blob = q.get('did') === mockRepo && blobs.get(q.get('cid')!);
      return blob ? new HttpResponse(blob.bytes.slice().buffer, { headers: { 'content-type': blob.mime } }) : new HttpResponse(null, { status: 404 });
    }),
  );
  const transport = (url: string, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    headers.set('authorization', 'Bearer mock-only');
    return fetch(new URL(url, mockOrigin), { ...init, headers });
  };
  return { server, agent: new Agent(transport), trace, blobs, records };
}
