import init from "oxigraph/web.js";
import { Store } from "oxigraph";
import { exportBundle, freshStore, queryResult, restoreBundle } from "./engine.ts";
import { loadCheckpoint, saveCheckpoint } from "./checkpoint.ts";
import { documents, queries } from "./fixture.ts";
import "./style.css";

await init();
let store = freshStore();
document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <header><span>pageread / isolated experiments</span><h1>Graph laboratory</h1>
  <p>Trace content + conversation metadata + scoped observation graphs. Ask what changed, and what survived.</p></header>
  <main><section class="toolbar"><label>Iteration <select id="iteration"><option value="memory">01 · In-memory WASM</option><option value="checkpoint">02 · IndexedDB checkpoint / restart</option></select></label>
  <button id="reset">Reset fixtures</button><button id="save">Checkpoint</button><button id="restore">Restore into fresh store</button><button id="empty">Empty memory</button><button id="export">Export bundle</button><button id="trig">Export TriG</button></section>
  <p id="status" role="status"></p><div class="columns"><section><h2>SPARQL playground</h2><label>Preset <select id="preset"></select></label>
  <textarea id="query" aria-label="SPARQL query" spellcheck="false"></textarea>
  <label><input type="checkbox" id="union"> Query default graph as union (explicit opt-in)</label>
  <button id="run">Run query</button><h3>Result · RDF terms retain type / language</h3><pre id="result"></pre></section>
  <aside><h2>What to look for</h2><p>The R11 partial overlay replaces M1. M2 survives from R10. Late R9 does not roll back M1. Alternative-branch R99 cannot win.</p>
  <p>Iteration 02 stores one atomic record containing N-Quads, exact JSON strings and observation metadata. Checkpoint, empty memory, restore; or reload the page and restore.</p>
  <p>Default graph contains only the dataset catalog. Union mode intentionally mixes assertions: it is not resolution.</p>
  <p>Blank-node labels are local, datatypes may normalize lexical values, and language tags matter. Exact source bytes remain separate.</p>
  <details><summary>Exact source documents</summary><pre id="documents"></pre></details></aside></div></main>`;
const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const status = (message: string) => { el("status").textContent = `${store.size} quads · ${message}`; };
const preset = el<HTMLSelectElement>("preset");
for (const name of Object.keys(queries)) preset.add(new Option(name, name));
const query = el<HTMLTextAreaElement>("query");
const run = () => {
  try { el("result").textContent = JSON.stringify(queryResult(store, query.value, el<HTMLInputElement>("union").checked), null, 2); status("Query completed"); }
  catch (error) { el("result").textContent = String(error); status("Query failed"); }
};
preset.onchange = () => { query.value = queries[preset.value as keyof typeof queries]; run(); };
el("run").onclick = run;
el("reset").onclick = () => { store = freshStore(); run(); status("Fixtures reset; saved checkpoint unchanged"); };
el("empty").onclick = () => { store = new Store(); run(); status("Memory emptied; saved checkpoint unchanged"); };
function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
el("export").onclick = () => download("pageread-graphs.json", JSON.stringify(exportBundle(store), null, 2), "application/json");
el("trig").onclick = () => download("pageread-graphs.trig", store.dump({ format: "application/trig" }), "application/trig");
el("save").onclick = () => { void saveCheckpoint(exportBundle(store)).then(() => status("Checkpoint committed to IndexedDB"), (error) => status(`Checkpoint failed: ${error}`)); };
el("restore").onclick = () => { void loadCheckpoint().then((bundle) => {
  if (!bundle) { status("No checkpoint yet"); return; }
  store = restoreBundle(bundle); el("documents").textContent = JSON.stringify(bundle.documents, null, 2); run(); status("Restored checkpoint into a fresh WASM store");
}).catch((error) => status(`Restore failed: ${error}`)); };
const iteration = el<HTMLSelectElement>("iteration");
iteration.onchange = () => {
  const enabled = iteration.value === "checkpoint";
  el<HTMLButtonElement>("save").disabled = !enabled;
  el<HTMLButtonElement>("restore").disabled = !enabled;
  status(enabled ? "Checkpoint controls enabled" : "In-memory iteration; no automatic persistence");
};
el("documents").textContent = JSON.stringify(documents, null, 2);
query.value = queries["Resolved main branch"];
iteration.dispatchEvent(new Event("change")); run();
