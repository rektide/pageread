import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { fileRegistry } from "./src/files.ts";
import { httpAgent, readWithAgent } from "./src/index.ts";

const html = `<article data-message-id="m1" data-role="user">Explain named graphs.</article>
<article data-message-id="m2" data-role="assistant">A dataset can contain multiple named graphs.</article>`;
const code = `Array.from(document.querySelectorAll('[data-message-id]'), el => ({
  id: el.getAttribute('data-message-id'), role: el.getAttribute('data-role'), text: el.textContent
}))`;
const server = setupServer(http.post("https://agent.example/reader", async ({ request }) => {
  const body = await request.json() as { prompt: string };
  if (!body.prompt.includes("Explain named graphs")) return new HttpResponse(null, { status: 400 });
  return HttpResponse.json({ code });
}));
server.listen({ onUnhandledFrame: "error" });
const dom = new JSDOM(html, { runScripts: "outside-only" });
try {
  const registry = await fileRegistry(".data");
  const output = await readWithAgent({
    instruction: "Extract the displayed conversation messages.",
    page: { url: "https://chat.example/c/fixture", mimeType: "text/html", body: html, coverage: "partial" },
    matches: ["https://chat.example/*"],
  }, {
    registry,
    agent: httpAgent("https://agent.example/reader", "MSW fixture agent (not a live model)"),
    runtime: {
      async register(reader) { console.log(`Retained fixture reader: ${reader.id}`); },
      async execute(reader) { return dom.window.eval(reader.code) as unknown; },
    },
  }, 1);
  console.log(JSON.stringify({
    proof: "MSW HTTP dispatch -> generated artifact -> jsdom fixture execution -> file registry",
    operation: output.operation,
    result: output.result,
    artifact: pathToFileURL(resolve(".data", "artifacts", `${output.artifact.id}.json`)).href,
    retainedOperations: (await registry.operations()).length,
  }, null, 2));
} finally {
  dom.window.close();
  server.close();
}
