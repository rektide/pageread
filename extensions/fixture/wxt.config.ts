import { defineConfig } from "wxt";

export default defineConfig({
  manifest: {
    name: "Pageread local fixture",
    permissions: ["storage"],
    host_permissions: ["http://127.0.0.1/*"],
    action: { default_title: "Read captured transcripts" },
  },
  vite: () => ({ build: { minify: false, sourcemap: true } }),
  hooks: {
    "vite:build:extendConfig"(entrypoints, config) {
      if (!entrypoints.some((entry) => entry.type === "background")) return;
      config.build ??= {};
      if (config.build.lib) config.build.lib.formats = ["es"];
      config.build.rollupOptions = {
        ...config.build.rollupOptions,
        preserveEntrySignatures: "strict",
        output: {
          format: "es",
          preserveModules: true,
          entryFileNames: (chunk) => (chunk.isEntry ? "[name].js" : "modules/[name].js"),
        },
      };
    },
  },
});
