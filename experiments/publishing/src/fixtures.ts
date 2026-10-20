export const dataset = `<urn:page:1> <urn:title> "Bonjour"@fr .
<urn:page:1> <urn:count> "7"^^<http://www.w3.org/2001/XMLSchema#integer> <urn:graph:extraction> .
_:item <urn:source> <urn:page:1> <urn:graph:extraction> .
<urn:page:1> <urn:note> "blank graph" _:provenance .
`;
export const source = 'export function read(document) { return { title: document.title }; }\n';
export const provenance = {
  createdAt: '2026-10-20T00:00:00.000Z', sourceUri: 'https://example.com/fixture',
  evidence: 'Synthetic public fixture; no captured page or private conversation.',
};
