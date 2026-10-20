#!/usr/bin/env node
// Design-example verification; no general selector/annotation/factory executor.
// Source: opencode://ses_ea538b494ffej4MXIdPDIIDTLU
// Generated 2026-10-20 by model:openai/gpt-6-astra#xhigh.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";

const root = new URL("../../", import.meta.url);
const graphRequire = createRequire(new URL("experiments/graphs/package.json", root));
const domRequire = createRequire(new URL("schema/package.json", root));
const { Store } = graphRequire("oxigraph");
const { JSDOM } = domRequire("jsdom");
const input = await readFile(
  new URL("design/observation-queries/example0.gpt6a.trig", root),
  "utf8",
);
const prefix = `
PREFIX ex: <urn:pageread:selection-example:>
PREFIX pr: <https://example.org/pageread/vocab/0#>
PREFIX oa: <http://www.w3.org/ns/oa#>
PREFIX sosa: <http://www.w3.org/ns/sosa/>
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX schema: <https://schema.org/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX fno: <https://w3id.org/function/ontology#>`;
const ex = "urn:pageread:selection-example:";
function rows(store, query) {
  return store
    .query(prefix + query)
    .map((row) => Object.fromEntries([...row].map(([name, term]) => [name, term.value])));
}
function value(store, graph, subject, property) {
  const found = rows(
    store,
    `SELECT ?value WHERE { GRAPH ${graph} { ${subject} ${property} ?value } }`,
  );
  assert.equal(found.length, 1);
  return found[0].value;
}
function inspect(store) {
  assert.deepEqual(
    rows(
      store,
      `SELECT ?entry ?entity ?position WHERE {
    GRAPH ex:results { ex:batch42 ^pr:inBatch ?entry .
      ?entry pr:entity ?entity; pr:position ?position }
    } ORDER BY ?position`,
    ),
    [
      { entry: `${ex}entry42-0`, entity: `${ex}m1`, position: "0" },
      { entry: `${ex}entry42-1`, entity: `${ex}m2`, position: "1" },
    ],
  );
  assert.equal(
    store.query(
      prefix +
        `ASK { GRAPH ex:results {
    ex:batch43 pr:status pr:Sealed; pr:distinctEntryCount 0 .
    FILTER NOT EXISTS { ?entry pr:inBatch ex:batch43 }
  } }`,
    ),
    true,
  );
  // An inverse declaration neither makes membership symmetric nor causes
  // automatic OWL materialization in the query engine.
  assert.equal(
    store.query(prefix + `ASK { GRAPH ex:results { ex:batch42 pr:inBatch ex:entry42-0 } }`),
    false,
  );
  assert.equal(
    store.query(prefix + `ASK { GRAPH ex:results { ex:batch42 pr:hasEntry ex:entry42-0 } }`),
    false,
  );
  assert.deepEqual(
    rows(
      store,
      `SELECT ?name ?node WHERE { GRAPH ex:structure {
    ex:messageItem pr:propertyOccurrence/pr:valueItem/pr:propertyOccurrence ?field .
    ?field pr:expandedPredicate schema:name; rdf:value ?name; pr:sourceNode ?node .
    ?node pr:domParent ex:mainElement
  } }`,
    ),
    [{ name: "Alice", node: `${ex}externalNameElement` }],
  );
  assert.deepEqual(
    rows(
      store,
      `SELECT ?procedure ?observation WHERE { GRAPH ex:results {
    ex:entry42-0 pr:inBatch ?batch . ?batch prov:wasGeneratedBy ?observation .
    ?observation sosa:usedProcedure ?procedure
  } }`,
    ),
    [{ procedure: `${ex}query-v1`, observation: `${ex}evaluation1` }],
  );
  assert.deepEqual(
    rows(
      store,
      `SELECT ?slot WHERE { GRAPH ex:processors {
    ?factory a fno:Function; pr:acceptsShape ex:QueryDefinitionShape; pr:requires ?requirement .
    ?requirement pr:slot ?slot
  } } ORDER BY ?slot`,
    ),
    [{ slot: "router" }, { slot: "selectorEngine" }],
  );
  assert.equal(
    value(store, "ex:processors", "ex:factoryArtifact", "pr:artifactRevision"),
    "illustrative-only-v1",
  );

  const html = value(store, "ex:captures", "ex:pageSnapshot1", "pr:bodyText");
  const dom = new JSDOM(html);
  try {
    const document = dom.window.document;
    const querySelector = value(store, "ex:definitions", "ex:allMessages", "rdf:value");
    assert.deepEqual(
      [...document.querySelectorAll(querySelector)].map((el) => el.dataset.messageId),
      ["m1", "m2"],
    );
    const targetSelector = value(store, "ex:annotations", "ex:messageSelector", "rdf:value");
    const targets = document.querySelectorAll(targetSelector);
    assert.equal(targets.length, 1);
    const text = targets[0].textContent;
    assert.equal(text, value(store, "ex:captures", "ex:m1-text-r1", "pr:bodyText"));
    const quote = value(store, "ex:annotations", "ex:quoteSelector", "oa:exact");
    const start = Number(value(store, "ex:annotations", "ex:positionSelector", "oa:start"));
    const end = Number(value(store, "ex:annotations", "ex:positionSelector", "oa:end"));
    assert.equal(Array.from(text).slice(start, end).join(""), quote);
    assert.notEqual(text.slice(start, end), quote);
    assert.equal(Array.from(text).slice(0, start).join("").length, 5);
    assert.equal(Array.from(text).slice(0, end).join("").length, 17);
    const author = document.querySelector("[itemprop='author']");
    const name = document.getElementById(author.getAttribute("itemref"));
    assert.equal(name.textContent, "Alice");
    assert.equal(author.contains(name), false);
  } finally {
    dom.window.close();
  }
}

const store = new Store();
store.load(input, { format: "application/trig" });
inspect(store);
const quads = (dataset) =>
  dataset
    .match()
    .map((quad) => quad.toString())
    .toSorted();
for (const format of ["application/trig", "application/n-quads"]) {
  const restored = new Store();
  restored.load(store.dump({ format }), { format });
  inspect(restored);
  // All nodes in this fixture have IRIs. This is not blank-node canonicalization.
  assert.deepEqual(quads(restored), quads(store));
  console.log(
    `PASS ${format}: ${restored.size} quads; batches, structure, selectors, annotations, factory declarations`,
  );
}
console.log("PASS CSS fixture matching and Unicode-code-point/UTF-16 conversion");
