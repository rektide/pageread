/**
 * Captures: what a reader consumes. Network captures come from the
 * MAIN-world hooks (http request/response pairs, SSE events off
 * event-stream responses); DOM captures come from live-query sources.
 */
import { sha256, toHex } from "@pageread/schema";

export interface HttpCapture {
  kind: "http";
  id: string;
  url: string;
  method: string;
  requestHeaders?: Record<string, string>;
  requestBody?: string;
  status?: number;
  responseHeaders?: Record<string, string>;
  responseBody?: string;
  startedAt: number;
  endedAt?: number;
  via: "fetch" | "xhr";
}

export interface SseCapture {
  kind: "sse";
  /** id of the initiating http capture */
  requestId: string;
  url: string;
  method: string;
  event?: string;
  data: string;
  receivedAt: number;
}

export interface DomCapture {
  kind: "dom";
  selector: string;
  html: string;
  /** microdata items extracted from the entity, when it carries any */
  items?: unknown[];
  at: number;
}

export type Capture = HttpCapture | SseCapture | DomCapture;

/** Glob URL match: `*` spans any characters. Matched against the full URL. */
export function globMatch(pattern: string, url: string): boolean {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`).test(url);
}

function hash8(input: string): string {
  return toHex(sha256(input)).slice(0, 8);
}

/** Stable URI for a raw http capture (durable evidence for derived items). */
export function captureUri(capture: HttpCapture): string {
  let host = "local";
  try {
    host = new URL(capture.url).host.replace(/:/g, "-");
  } catch {
    // keep local
  }
  return `urn:pageread:raw:${host}/${hash8(`${capture.method} ${capture.url}`)}/${capture.startedAt}`;
}

/** Capture id linking http captures to their SSE chunks. */
export function captureId(url: string, startedAt: number): string {
  return `${hash8(url)}-${startedAt}`;
}
