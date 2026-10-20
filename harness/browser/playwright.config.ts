import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "*.spec.ts",
  workers: 1,
  webServer: { command: "pnpm dev", url: "http://127.0.0.1:4173", reuseExistingServer: false },
});
