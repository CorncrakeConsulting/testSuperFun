import { defineConfig } from "@playwright/test";

/**
 * Playwright configuration for unit tests (no browser required)
 * Unit tests are in __tests__/ directory
 */
export default defineConfig({
  testDir: "./__tests__",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: undefined,
  reporter: "list",

  // Unit tests don't need browser context
  use: {
    trace: "off",
    screenshot: "off",
    video: "off",
  },

  // Single project for unit tests (no browser needed)
  projects: [
    {
      name: "unit",
    },
  ],
});
