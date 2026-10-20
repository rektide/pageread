import { test, expect, chromium } from "@playwright/test";
import { mkdtemp, rm, readdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

test("packaged MAIN capture crosses isolated relay and persists readable named index", async () => {
	const profile = await mkdtemp("/tmp/opencode/pageread-browser-");
	const extension = fileURLToPath(new URL("../../extensions/fixture/.output/chrome-mv3", import.meta.url));
	const cache = process.env.PLAYWRIGHT_BROWSERS_PATH ?? join(homedir(), ".cache/ms-playwright");
	const installed = (await readdir(cache)).filter((name) => /^chromium-\d+$/.test(name)).sort((a, b) => Number(b.split("-")[1]) - Number(a.split("-")[1]));
	const executablePath = process.env.PAGEREAD_CHROMIUM ?? (installed[0] ? join(cache, installed[0], "chrome-linux64/chrome") : undefined);
	const options = {
		headless: true,
		executablePath,
		channel: "chromium",
		args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
	};
	let context = await chromium.launchPersistentContext(profile, options);
	context.on("console", (message) => { if (message.type() === "error") console.error(message.text()); });
	context.on("weberror", (error) => console.error(error.error()));
	try {
		const background = context.serviceWorkers().find((worker) => worker.url().startsWith("chrome-extension:")) ?? await context.waitForEvent("serviceworker", { predicate: (worker) => worker.url().startsWith("chrome-extension:") });
		const id = new URL(background.url()).host;
		const fixture = await context.newPage();
		await fixture.goto("http://127.0.0.1:4173");
		await fixture.getByRole("button", { name: "Load conversation" }).click();
		await expect(fixture.locator("#response")).toContainText("orchid reader");
		const popup = await context.newPage();
		await popup.goto(`chrome-extension://${id}/popup.html`);
		await expect.poll(async () => {
			await popup.getByRole("button", { name: "Refresh" }).click();
			return popup.locator("#result").textContent();
		}).toContain("Local captured conversation");
		await popup.locator("#query").fill("orchid");
		await popup.getByRole("button", { name: "Refresh" }).click();
		await expect(popup.locator("#result")).toContainText('"field": "message:');
		const saved = JSON.parse((await popup.locator("#result").textContent())!);
		const observation = saved.entries.find((entry: { mimeType: string }) => entry.mimeType === "application/vnd.pageread.observation+json");
		const input = JSON.parse(observation.body);
		expect(input.capture.url).toBe("http://127.0.0.1:4173/api/conversation");
		expect(input.capture.responseHeaders["x-fixture"]).toBe("msw");
		expect(input.observation.scope.domain).toBe("conversation");
		expect(input.puts).toHaveLength(2);
		expect(saved.entries.some((entry: { uri: string }) => entry.uri === "urn:pageread:index:transcripts")).toBe(true);
		await context.close();
		context = await chromium.launchPersistentContext(profile, options);
		const reopened = await context.newPage();
		await reopened.goto(`chrome-extension://${id}/popup.html`);
		await expect(reopened.locator("#result")).toContainText("Local captured conversation");
	} finally {
		await context.close();
		await rm(profile, { recursive: true, force: true });
	}
});
