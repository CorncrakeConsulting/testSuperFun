import {
  Before,
  After,
  BeforeAll,
  AfterAll,
  Status,
  setDefaultTimeout,
  World,
} from "@cucumber/cucumber";
import { chromium, Browser, BrowserContext } from "@playwright/test";

// Calculate timeout dynamically based on expected number of spins
// Maximum expected spins is 1000, at ~0.5 spins/sec with quick spin, plus 50% buffer
const MAX_EXPECTED_SPINS = 1000;
const SPINS_PER_SECOND = 0.5;
const BUFFER_MULTIPLIER = 1.5;
const dynamicTimeout = Math.ceil((MAX_EXPECTED_SPINS / SPINS_PER_SECOND) * BUFFER_MULTIPLIER * 1000);

console.log(`⏱️  Setting global timeout to ${Math.ceil(dynamicTimeout/1000/60)} minutes for up to ${MAX_EXPECTED_SPINS} spins`);
setDefaultTimeout(dynamicTimeout);

let browser: Browser;
let context: BrowserContext;

BeforeAll(async function () {
  // Launch browser once before all tests
  browser = await chromium.launch({
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

  // Close page and context after each scenario
  await this.page.close();
  await context.close();
});

AfterAll(async function () {
  // Close browser after all tests
  await browser.close();
});
