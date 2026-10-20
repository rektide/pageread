import { defineConfig } from "wxt";

export default defineConfig({
	manifest: {
		name: "Pageread local fixture",
		permissions: ["storage"],
		host_permissions: ["http://127.0.0.1/*"],
		action: { default_title: "Read captured transcripts" },
	},
	vite: () => ({ build: { minify: false, sourcemap: true } }),
});
