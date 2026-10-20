import { defineConfig } from "tsdown";

export default defineConfig({
	// unbundled: one output file per source module — the extension is packaged
	// from real files, not a deep bundle.
	unbundle: true,
	dts: true,
});
