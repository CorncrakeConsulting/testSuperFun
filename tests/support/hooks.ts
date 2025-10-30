import {
  Before,
  After,
  BeforeAll,
  AfterAll,
  Status,
  setDefaultTimeout,
  World,
} from "@cucumber/cucumber";
import {
  chromium,
  firefox,
  webkit,
  Browser,
  BrowserContext,
} from "@playwright/test";
import { TestLogger } from "../../services/TestLogger";
import * as path from "path";
import { sanitizeForFilename } from "../../utils/stringUtils";

// Calculate timeout dynamically based on expected number of spins
// Maximum expected spins is 1000 (for distribution testing), at ~0.5 spins/sec with quick spin, plus 50% buffer
const MAX_EXPECTED_SPINS = 1000;
const SPINS_PER_SECOND = 0.5;
const BUFFER_MULTIPLIER = 1.5;
const dynamicTimeout = Math.ceil(
  (MAX_EXPECTED_SPINS / SPINS_PER_SECOND) * BUFFER_MULTIPLIER * 1000
);

setDefaultTimeout(dynamicTimeout);

let browser: Browser;
let context: BrowserContext;

// Get browser type from environment variable (default: chromium)
const BROWSER = process.env.BROWSER || "chromium";
const HEADED = process.env.HEADED === "true";

BeforeAll(async function () {
  // Initialize test run folder with timestamp
  // Reads from .test-run-folder file created by cucumber.cjs
  const testRunFolder = TestLogger.initializeTestRun();

  // Launch browser once before all tests
  const browserType =
    BROWSER === "firefox" ? firefox : BROWSER === "webkit" ? webkit : chromium;

  console.log(
    `🌐 Launching ${BROWSER} browser for Cucumber tests${
      HEADED ? " (HEADED mode)" : ""
    }`
  );
  console.log(`📁 Reports will be saved to: ${testRunFolder}`);

  browser = await browserType.launch({
    headless: !HEADED, // Use environment variable
    slowMo: HEADED ? 100 : 50, // Slower when visible for better observation
  });
});

Before(async function (this: World, scenario) {
  // Extract feature name from scenario
  const featureName =
    scenario.pickle.uri?.split("/").pop()?.replace(".feature", "") || "unknown";
  TestLogger.setCurrentFeature(featureName);

  // Create new context and page for each scenario
  const testRunFolder = TestLogger.getTestRunFolder();

  context = await browser.newContext({
    baseURL: "http://localhost:3000",
    viewport: { width: 1280, height: 720 }, // Match Desktop Chrome viewport for proper UI rendering
    recordVideo: {
      dir: path.join(testRunFolder, "videos"),
    },
  });

  this.page = await context.newPage();

  // Set up console log capture (filter out noise)
  this.page.on("console", (msg: { type: () => string; text: () => string }) => {
    const text = msg.text();
    // Filter out React DevTools and other noise
    if (
      text.includes("React DevTools") ||
      text.includes("Download the React DevTools")
    ) {
      return; // Skip these messages
    }
    console.log(`Browser Console [${msg.type()}]:`, text);
  });

  // Set up error capture
  this.page.on("pageerror", (error: Error) => {
    console.error("Browser Error:", error.message);
  });
});

After(async function (this: World, scenario) {
  const testRunFolder = TestLogger.getTestRunFolder();

  if (scenario.result?.status === Status.FAILED) {
    // Capture and attach screenshot to report for all failures
    const screenshot = await this.page.screenshot({ fullPage: true });
    this.attach(screenshot, "image/png");

    // Also save to disk in the test run folder
    const scenarioName = sanitizeForFilename(scenario.pickle.name);
    const screenshotsDir = path.join(testRunFolder, "screenshots");

    // Ensure screenshots directory exists
    const fs = require("fs");
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    await this.page.screenshot({
      path: path.join(
        screenshotsDir,
        `failed-${scenarioName}-${Date.now()}.png`
      ),
      fullPage: true,
    });
  }
  await this.page.close();
  await context.close();
});

//always run cleanup
AfterAll(async function () {
  await browser.close();
});
