import { sha256, toHex } from "@pageread/schema";
import type { Body } from "./types.ts";

export function etagOf(body: Body): string {
	return toHex(sha256(typeof body === "string" ? new TextEncoder().encode(body) : body));
}
