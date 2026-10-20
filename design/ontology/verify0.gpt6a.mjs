#!/usr/bin/env node
// Worked-design verification, not a resolver implementation.
// Generated 2026-10-20 by model:openai/gpt-6-astra#xhigh.
// Source: opencode://ses_ea538b494ffej4MXIdPDIIDTLU
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";

const root = new URL("../../", import.meta.url);
const require = createRequire(new URL("experiments/graphs/package.json", root));
const { Store } = require("oxigraph");
const { version } = require("oxigraph/package.json");
const [design, trig] = await Promise.all([
  readFile(new URL("design/ontology/design0.gpt6a.md", root), "utf8"),
  readFile(new URL("design/ontology/observations0.gpt6a.trig", root), "utf8"),
]);
const queries = [...design.matchAll(/```sparql\n([\s\S]*?)\n```/g)].map((m) => m[1]);
assert.equal(queries.length, 2);

const pr = "https://example.org/pageread/vocab/0#";
const ex = "urn:pageread:example:";
const schema = "https://schema.org/";
const prefixes = `PREFIX pr: <${pr}> PREFIX ex: <${ex}> PREFIX schema: <${schema}>`;
function rows(store, query) {
  return store
    .query(query)
    .map((row) => Object.fromEntries([...row].map(([name, term]) => [name, term.value])));
}
function inspect(store) {
  assert.deepEqual(rows(store, queries[0]), [
    { message: `${ex}m1`, position: "1", text: "Hello, revised" },
    { message: `${ex}m2`, position: "2", text: "Keep this message 🌍" },
  ]);
  assert.deepEqual(rows(store, queries[1]), [
    {
      value: "Hello, revised",
      evidence: `${ex}overlay`,
      observation: `${ex}observation-2`,
      procedure: `${ex}reader-v1`,
      capture: `${ex}capture-2`,
    },
  ]);
  assert.equal(store.query(`${prefixes} ASK { ?message schema:text ?text }`), false);
  assert.deepEqual(
    rows(
      store,
      `${prefixes}
    SELECT ?text WHERE {
      VALUES ?g { ex:baseline ex:overlay }
      GRAPH ?g { ex:m1 schema:text ?text }
    } ORDER BY ?text`,
    ),
    [{ text: "Hello" }, { text: "Hello, revised" }],
  );
  assert.deepEqual(
    rows(
      store,
      `${prefixes}
    SELECT ?body WHERE { GRAPH ex:metadata { ex:capture-1 pr:bodyText ?body } }`,
    ),
    [
      {
        body: '{"revision":10,"messages":[{"id":"m1","text":"Hello"},{"id":"m2","text":"Keep this message 🌍"}]}',
      },
    ],
  );
  assert.equal(
    store.query(`${prefixes}
    ASK { GRAPH ex:metadata {
      ex:attempt-3 a pr:ReadAttempt; pr:state pr:Running; pr:ownerEpoch "fixture-runtime-1" .
      FILTER NOT EXISTS { ?observation pr:partOfAttempt ex:attempt-3 }
    } }`),
    true,
  );
}

const original = new Store();
original.load(trig, { format: "application/trig" });
inspect(original);
// This fixture deliberately uses IRIs throughout, so exact term-set comparison
// is appropriate; it is not a generic RDF blank-node canonicalization test.
const quads = (store) =>
  store
    .match()
    .map((quad) => quad.toString())
    .toSorted();
for (const format of ["application/trig", "application/n-quads"]) {
  const restored = new Store();
  restored.load(original.dump({ format }), { format });
  inspect(restored);
  assert.deepEqual(quads(restored), quads(original));
  console.log(
    `PASS ${format}: ${restored.size} quads; query, provenance, scope, body, lifecycle checks`,
  );
}
console.log(`PASS worked design examples with oxigraph@${version}`);
