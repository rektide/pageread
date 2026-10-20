import { defineConfig } from "tsdown";

export default defineConfig({
	unbundle: true,
	dts: true,
	entry: ["src/index.ts", "src/bridge/index.ts", "src/sw/index.ts"],
});
