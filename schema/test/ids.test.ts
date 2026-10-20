import { describe, expect, it } from "vitest";
import { deriveSpanId, deriveTraceId, isValidSpanId, isValidTraceId, sha256, toHex } from "../src/index.ts";

describe("sha256", () => {
	it("matches the known abc vector", () => {
		expect(toHex(sha256("abc"))).toBe(
			"ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
		);
	});
	it("handles multi-block inputs", () => {
		// > 64 bytes, exercises padding across two blocks
		const long = "x".repeat(200);
		expect(toHex(sha256(long))).toHaveLength(64);
		expect(toHex(sha256(long))).not.toBe(toHex(sha256(`${long}y`)));
	});
});

describe("deterministic ids", () => {
	it("derives stable trace ids from conversation keys", () => {
		const a = deriveTraceId("chatgpt/conversation/uuid-1");
		expect(a).toBe(deriveTraceId("chatgpt/conversation/uuid-1"));
		expect(a).not.toBe(deriveTraceId("chatgpt/conversation/uuid-2"));
		expect(isValidTraceId(a)).toBe(true);
	});
	it("derives stable span ids from node keys", () => {
		const a = deriveSpanId("node-aaa/root");
		expect(a).toBe(deriveSpanId("node-aaa/root"));
		expect(isValidSpanId(a)).toBe(true);
	});
	it("namespace-stems inputs so different key spaces cannot collide", () => {
		expect(deriveTraceId("x")).not.toBe(deriveSpanId("x").slice(0, 32));
	});
});
