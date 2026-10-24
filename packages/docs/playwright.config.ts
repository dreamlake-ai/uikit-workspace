import { defineConfig, devices } from "@playwright/test";

// Device checks against the docs specimens — real layout in a real engine,
// which jsdom cannot give. Touch devices run on WebKit with their own
// descriptor, so `(hover: none)` and the device width are what Safari sees.
//
//   pnpm --filter docs exec playwright install webkit   (once)
//   pnpm --filter docs test:e2e
const PORT = Number(process.env.DOCS_E2E_PORT) || 3290;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  use: { baseURL: `http://localhost:${PORT}` },
  webServer: {
    command: "vite",
    env: { DOCS_PORT: String(PORT) },
    url: `http://localhost:${PORT}/components/profile-card`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    {
      name: "iPad Pro 11",
      use: { ...devices["iPad Pro 11"], browserName: "webkit" },
    },
    {
      name: "iPhone 15",
      use: { ...devices["iPhone 15"], browserName: "webkit" },
    },
  ],
});
