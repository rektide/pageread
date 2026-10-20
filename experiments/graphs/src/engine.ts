import { Store } from "oxigraph";
import { documents, fixtureTrig, observations, type ExactDocument, type Observation } from "./fixture.ts";

export interface Bundle {
  format: "pageread-graph-experiment/1";
  mapping: "fixture-projection/1";
  nquads: string;
  documents: ExactDocument[];
  observations: Observation[];
}
export function freshStore(): Store {
  const store = new Store();
  store.load(fixtureTrig(), { format: "application/trig" });
  return store;
}
export function exportBundle(store: Store): Bundle {
  return { format: "pageread-graph-experiment/1", mapping: "fixture-projection/1", nquads: store.dump({ format: "application/n-quads" }), documents: structuredClone(documents), observations: structuredClone(observations) };
}
export function restoreBundle(bundle: Bundle): Store {
  if (bundle.format !== "pageread-graph-experiment/1" || bundle.mapping !== "fixture-projection/1") throw new Error("Unsupported checkpoint format/mapping");
  const store = new Store();
  store.load(bundle.nquads, { format: "application/n-quads" });
  return store;
}
export function queryResult(store: Store, query: string, union = false): unknown {
  const result = store.query(query, { use_default_graph_as_union: union });
  if (!Array.isArray(result)) return result;
  return result.map((row) => row instanceof Map
    ? Object.fromEntries([...row].map(([key, term]) => [key, term.toString()]))
    : row.toString());
}
