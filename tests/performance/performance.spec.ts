import { test } from "@playwright/test";
import { LoadingPerformanceTest } from "./loading/LoadingPerformanceTest";
import { RuntimePerformanceTest } from "./runtime/RuntimePerformanceTest";
import { TestLogger } from "../../services/TestLogger";

test.describe("Performance Tests", () => {
  test("Loading Performance", async ({ page, browserName }) => {
    const logger = TestLogger.getDefault();
    const loadingTest = new LoadingPerformanceTest(page, browserName, logger);
    await loadingTest.run();
  });

  test("Runtime Performance and Memory Leaks", async ({
    page,
    browserName,
    browser,
  }) => {
    test.setTimeout(120000); // 2 minutes for all runtime tests

    // Skip non-Chromium browsers as CDP (Chrome DevTools Protocol) is Chromium-only
    test.skip(
      browserName !== "chromium",
      "Memory profiling requires Chromium browser with Chrome DevTools Protocol support"
    );

    const logger = TestLogger.getDefault();
    const runtimeTest = new RuntimePerformanceTest(
      page,
      browserName,
      logger,
      browser
    );
    await runtimeTest.run();
  });
});
