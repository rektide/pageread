export const PR = "https://pageread.dev/experimental/graph/";
export const conversation = "urn:pageread:conversation:fixture/account-a/c1";
export const prefix = `PREFIX pr: <${PR}>\nPREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\n`;

export interface ExactDocument { uri: string; mimeType: string; body: string }
export interface Observation {
  graph: string; documentUri: string; conversation: string; branch: string;
  domain: "messages" | "title"; coverage: "complete" | "partial";
  revision: number; captureUri: string;
}
// Numeric revisions are fixture-provider semantics, never a generic revision comparator.
export const observations: Observation[] = [
  { graph: "urn:graph:baseline", documentUri: "urn:doc:trace:r10", conversation, branch: "main", domain: "messages", coverage: "complete", revision: 10, captureUri: "urn:capture:r10" },
  { graph: "urn:graph:overlay", documentUri: "urn:doc:trace:r11", conversation, branch: "main", domain: "messages", coverage: "partial", revision: 11, captureUri: "urn:capture:r11" },
  { graph: "urn:graph:late", documentUri: "urn:doc:trace:r9", conversation, branch: "main", domain: "messages", coverage: "partial", revision: 9, captureUri: "urn:capture:r9" },
  { graph: "urn:graph:other", documentUri: "urn:doc:trace:other", conversation, branch: "alternative", domain: "messages", coverage: "complete", revision: 99, captureUri: "urn:capture:other" },
  { graph: "urn:graph:metadata", documentUri: "urn:doc:conversation", conversation, branch: "main", domain: "title", coverage: "complete", revision: 11, captureUri: "urn:capture:metadata" },
];
const trace = (messages: Array<[string, string]>) => JSON.stringify({
  "@type": "https://opentelemetry.io/semconv/trace",
  resource: { attributes: { "pageread.conversation.id": "c1", "pageread.account.id": "account-a" } },
  spans: messages.map(([id, text], index) => ({ span_id: id, trace_id: "fixture-trace", name: "message", start_time_unix_nano: "1760000000000000001", attributes: { "gen_ai.prompt": text, "pageread.order": index } })),
}, null, 2);
export const documents: ExactDocument[] = [
  { uri: "urn:doc:trace:r10", mimeType: "application/vnd.pageread.trace+json", body: trace([["m1", "Baseline hello"], ["m2", "Preserved second message 🌍"]]) },
  { uri: "urn:doc:trace:r11", mimeType: "application/vnd.pageread.trace+json", body: trace([["m1", "Updated hello"]]) },
  { uri: "urn:doc:trace:r9", mimeType: "application/vnd.pageread.trace+json", body: trace([["m1", "Older late hello"]]) },
  { uri: "urn:doc:trace:other", mimeType: "application/vnd.pageread.trace+json", body: trace([["m1", "Other branch must not win"]]) },
  { uri: "urn:doc:conversation", mimeType: "application/vnd.pageread.conversation+json", body: '{\n  "title": "Graph laboratory", "language": "en", "branch": "main"\n}\n' },
];

const iri = (value: string) => `<${value}>`;
const literal = (value: string) => JSON.stringify(value);
export function fixtureTrig(): string {
  const graphs = observations.map((o) => {
    const doc = documents.find((d) => d.uri === o.documentUri)!;
    const parsed = JSON.parse(doc.body);
    const facts = o.domain === "title"
      ? `${iri(conversation)} pr:title ${literal(parsed.title)}@en .`
      : parsed.spans.map((s: { span_id: string; start_time_unix_nano: string; attributes: Record<string, string> }) =>
        `${iri(`urn:message:${s.span_id}`)} pr:text ${literal(s.attributes["gen_ai.prompt"])}; pr:timestamp ${literal(s.start_time_unix_nano)}^^xsd:integer .`).join("\n");
    return `${iri(o.graph)} { ${facts} }`;
  });
  const provenance = observations.map((o) => `${iri(o.graph)} pr:conversation ${iri(o.conversation)}; pr:branch ${literal(o.branch)}; pr:domain ${literal(o.domain)}; pr:coverage ${literal(o.coverage)}; pr:revision ${o.revision}; pr:document ${iri(o.documentUri)}; pr:capture ${iri(o.captureUri)} .`).join("\n");
  return `${prefix}\n<urn:dataset:fixture> pr:label "Default graph contains catalog only" .\n<urn:graph:provenance> { ${provenance} }\n${graphs.join("\n")}\n<urn:graph:caveats> { _:note pr:label "bonjour"@fr; pr:count "0007"^^xsd:integer . }`;
}

export const queries = {
  "Resolved main branch": `${prefix}SELECT ?message ?text ?revision ?graph WHERE {
    GRAPH <urn:graph:provenance> { ?graph pr:conversation <${conversation}>; pr:branch "main"; pr:domain "messages"; pr:revision ?revision }
    GRAPH ?graph { ?message pr:text ?text }
    FILTER NOT EXISTS {
      GRAPH <urn:graph:provenance> { ?newGraph pr:conversation <${conversation}>; pr:branch "main"; pr:domain "messages"; pr:revision ?newRevision }
      GRAPH ?newGraph { ?message pr:text ?newText }
      FILTER (?newRevision > ?revision)
    }
  } ORDER BY ?message`,
  "All observations and provenance": `${prefix}SELECT ?graph ?branch ?coverage ?revision ?document ?capture WHERE { GRAPH <urn:graph:provenance> { ?graph pr:branch ?branch; pr:coverage ?coverage; pr:revision ?revision; pr:document ?document; pr:capture ?capture } } ORDER BY ?revision`,
  "Conversation title": `${prefix}SELECT ?title WHERE { GRAPH <urn:graph:metadata> { <${conversation}> pr:title ?title } }`,
  "Default graph only": "SELECT ?s ?p ?o WHERE { ?s ?p ?o }",
  "Language, datatype, blank node": `${prefix}SELECT ?node ?label ?count WHERE { GRAPH <urn:graph:caveats> { ?node pr:label ?label; pr:count ?count } }`,
  "Export messages as graph": `${prefix}CONSTRUCT { ?s pr:text ?text } WHERE { GRAPH ?g { ?s pr:text ?text } }`,
  "Any baseline message?": `${prefix}ASK { GRAPH <urn:graph:baseline> { ?s pr:text ?text } }`,
};
