import { defineConfig } from "vitest/config";
import wasm from "vite-plugin-wasm";

export default defineConfig({
  plugins: [wasm()],
  build: { target: "esnext" },
  optimizeDeps: { exclude: ["oxigraph"] },
  test: { environment: "node" },
});
