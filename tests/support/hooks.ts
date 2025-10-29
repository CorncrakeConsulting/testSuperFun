import {
  Before,
  After,
  BeforeAll,
  AfterAll,
  Status,
  setDefaultTimeout,
  World,
} from "@cucumber/cucumber";
import { chromium, firefox, webkit, Browser, BrowserContext } from "@playwright/test";

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
const BROWSER = process.env.BROWSER || 'chromium';

BeforeAll(async function () {
  // Launch browser once before all tests
  const browserType = BROWSER === 'firefox' ? firefox : BROWSER === 'webkit' ? webkit : chromium;
  
  console.log(`🌐 Launching ${BROWSER} browser for Cucumber tests`);
  
  browser = await browserType.launch({
    headless: true, // Set to false to see the browser
    slowMo: 50, // Slow down actions for better visibility
  });
});

Before(async function (this: World) {
  // Create new context and page for each scenario
  context = await browser.newContext({
    baseURL: "http://localhost:3000",
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: "./test-results/videos/",
    },
  });

  this.page = await context.newPage();

  // Set up console log capture
  this.page.on("console", (msg: { type: () => string; text: () => string }) => {
    console.log(`Browser Console [${msg.type()}]:`, msg.text());
  });

  // Set up error capture
  this.page.on("pageerror", (error: Error) => {
    console.error("Browser Error:", error.message);
  });
});

After(async function (this: World, scenario) {
  if (scenario.result?.status === Status.FAILED) {
    // Capture and attach screenshot to report for all failures
    const screenshot = await this.page.screenshot({ fullPage: true });
    this.attach(screenshot, "image/png");

    // Also save to disk for external review
    const scenarioName = scenario.pickle.name.replaceAll(" ", "-");
    await this.page.screenshot({
      path: `./test-results/screenshots/failed-${scenarioName}-${Date.now()}.png`,
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
