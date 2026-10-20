import { describe, expect, it } from "vitest";
import { MEDIA_TYPES, URN_STEMS } from "@pageread/schema";
import { contentIndexOver, memoryContentStore } from "../src/index.ts";

describe("content index facade", () => {
	it("adds, lists, upserts, and deletes entries, persisting the directory in the store", async () => {
		const store = memoryContentStore();
		const index = contentIndexOver(store);
		await index.add({
			id: "chatgpt/c-1",
			url: `${URN_STEMS.trace}chatgpt/c-1`,
			title: "Traces and horizons",
			category: "chat-transcript",
		});
		expect((await index.getAll()).map((e) => e.id)).toEqual(["chatgpt/c-1"]);
		const dir = await store.match(URN_STEMS.directory);
		expect(dir?.mimeType).toBe(MEDIA_TYPES.directory);

		await index.add({
			id: "chatgpt/c-2",
			url: `${URN_STEMS.trace}chatgpt/c-2`,
			title: "Second chat",
			category: "chat-transcript",
		});
		expect((await index.getAll()).length).toBe(2);

		await index.add({
			id: "chatgpt/c-1",
			url: `${URN_STEMS.trace}chatgpt/c-1`,
			title: "Traces and horizons (renamed)",
			category: "chat-transcript",
		});
		const all = await index.getAll();
		expect(all.length).toBe(2);
		expect(all.find((e) => e.id === "chatgpt/c-1")?.title).toBe("Traces and horizons (renamed)");

		expect(await index.delete("chatgpt/c-1")).toBe(true);
		expect(await index.delete("chatgpt/c-1")).toBe(false);
		expect((await index.getAll()).map((e) => e.id)).toEqual(["chatgpt/c-2"]);
	});

	it("is an event source", async () => {
		const store = memoryContentStore();
		const index = contentIndexOver(store);
		const seen: string[] = [];
		index.events.subscribe((e) => seen.push(e.type === "add" ? `+${e.entry.id}` : `-${e.id}`));
		await index.add({
			id: "chatgpt/c-9",
			url: "urn:pageread:trace:chatgpt/c-9",
			title: "events",
			category: "chat-transcript",
		});
		await index.delete("chatgpt/c-9");
		expect(seen).toEqual(["+chatgpt/c-9", "-chatgpt/c-9"]);
	});
});
