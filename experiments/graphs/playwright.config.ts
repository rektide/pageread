import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./browser",
  use: { baseURL: "http://localhost:4318", headless: true },
  webServer: { command: "pnpm dev --port 4318 --strictPort", url: "http://localhost:4318", reuseExistingServer: false },
});
