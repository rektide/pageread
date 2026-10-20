import { describe, expect, it } from "vitest";
import "fake-indexeddb/auto";
import { MEDIA_TYPES, URN_STEMS } from "@pageread/schema";
import { memoryContentStore, openIdbContentStore, type ContentStore } from "../src/index.ts";

const stores: Array<[string, () => Promise<ContentStore>]> = [
	["memory", async () => memoryContentStore()],
	// fresh db each time: fake-indexeddb persists otherwise
	["idb", () => openIdbContentStore(`pageread-test-${Math.random().toString(36).slice(2)}`)],
];

describe.each(stores)("content store (%s)", (_name, make) => {
	it("puts, matches, and keys with MIME types", async () => {
		const store = await make();
		await store.put({
			uri: `${URN_STEMS.trace}chatgpt/c-1`,
			mimeType: MEDIA_TYPES.trace,
			body: '{"spans":[]}',
		});
		const got = await store.match(`${URN_STEMS.trace}chatgpt/c-1`);
		expect(got?.mimeType).toBe(MEDIA_TYPES.trace);
		expect(got?.etag).toHaveLength(64);
		expect(await store.keys()).toEqual([`${URN_STEMS.trace}chatgpt/c-1`]);
	});

	it("filters by uri prefix and mime type", async () => {
		const store = await make();
		await store.put({ uri: "urn:pageread:trace:a", mimeType: MEDIA_TYPES.trace, body: "1" });
		await store.put({ uri: "urn:pageread:trace:b", mimeType: MEDIA_TYPES.trace, body: "2" });
		await store.put({ uri: "urn:pageread:raw:a", mimeType: MEDIA_TYPES.capture, body: "3" });
		expect(await store.keys({ uriPrefix: "urn:pageread:trace:" })).toEqual([
			"urn:pageread:trace:a",
			"urn:pageread:trace:b",
		]);
		expect((await store.matchAll({ mimeType: MEDIA_TYPES.capture })).length).toBe(1);
	});

	it("is idempotent: same body re-put emits noop, keeps storedAt", async () => {
		const store = await make();
		const seen: string[] = [];
		store.events.subscribe((e) => seen.push(e.type));
		await store.put({ uri: "urn:pageread:trace:a", mimeType: MEDIA_TYPES.trace, body: "x" });
		const first = await store.match("urn:pageread:trace:a");
		await new Promise((r) => setTimeout(r, 5));
		await store.put({ uri: "urn:pageread:trace:a", mimeType: MEDIA_TYPES.trace, body: "x" });
		const second = await store.match("urn:pageread:trace:a");
		expect(seen).toEqual(["put", "noop"]);
		expect(second?.storedAt).toBe(first?.storedAt);
	});

	it("emits delete events and reports absence", async () => {
		const store = await make();
		await store.put({ uri: "urn:pageread:trace:a", mimeType: MEDIA_TYPES.trace, body: "x" });
		expect(await store.delete("urn:pageread:trace:a")).toBe(true);
		expect(await store.delete("urn:pageread:trace:a")).toBe(false);
		expect(await store.match("urn:pageread:trace:a")).toBeUndefined();
	});
});
