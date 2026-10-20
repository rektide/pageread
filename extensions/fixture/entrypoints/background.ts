import { defineBackground } from "wxt/utils/define-background";
import { browser } from "wxt/browser";
import { openIdbContentStore } from "@pageread/store";
import { createIndexer, transcriptsIndex } from "@pageread/indexer";
import { ingest, captureUri, type HttpCapture } from "@pageread/extension-kit";
import { reader } from "../reader.ts";

export default defineBackground(() => {
	const store = openIdbContentStore("pageread-fixture");
	const index = store.then((value) => createIndexer(value, transcriptsIndex()));
	let queue = Promise.resolve();
	browser.runtime.onMessage.addListener((message, sender) => {
		if (message?.type === "capture") {
			if (!sender.tab || !sender.url || new URL(sender.url).hostname !== "127.0.0.1") throw new Error("Unexpected capture sender");
			const capture = message.capture as HttpCapture;
			if (capture?.kind !== "http" || typeof capture.url !== "string" || typeof capture.responseBody !== "string" || capture.responseBody.length > 1024 * 1024 || !reader.match(capture)) throw new Error("Invalid fixture capture");
			const task = queue.then(async () => {
				const result = await reader.read(capture, { captureUri: (c) => c.kind === "http" ? captureUri(c) : "urn:unused", nowMs: Date.now });
				const receipt = await ingest(await store, result, { reader: reader.name, version: reader.version, provider: "fixture", account: "local" }, capture);
				await (await index).refresh();
				return receipt;
			});
			queue = task.then(() => undefined, (error) => console.error("pageread ingestion failed", error));
			return task;
		}
		if (message?.type === "read") {
			if (!sender.url?.startsWith(browser.runtime.getURL("/"))) throw new Error("Read requires extension page");
			return queue.then(async () => {
				const view = await (await index).refresh();
				return { view, hits: (await index).find(message.query ?? ""), entries: await (await store).matchAll() };
			});
		}
		return undefined;
	});
});
