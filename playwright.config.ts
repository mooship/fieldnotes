import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 8788);
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "e2e",
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : "list",
  use: { baseURL: `http://127.0.0.1:${PORT}`, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run preview -- --port ${PORT} --ip 127.0.0.1`,
    url: `http://127.0.0.1:${PORT}/`,
    // A built server can be stale or belong to another run, so one already on the port is an error.
    reuseExistingServer: false,
    timeout: 240_000,
  },
});
