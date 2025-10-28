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

setDefaultTimeout(300000); // 5 minutes for distribution tests

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
  // Take screenshot on failure
  if (scenario.result?.status === Status.FAILED) {
    const scenarioName = scenario.pickle.name.replaceAll(" ", "-");
    const screenshot = await this.page.screenshot({
      path: `./test-results/screenshots/failed-${scenarioName}-${Date.now()}.png`,
      fullPage: true,
    });

    // Attach screenshot to Cucumber report
    this.attach(screenshot, "image/png");
  }

  // Close page and context after each scenario
  await this.page.close();
  await context.close();
});

AfterAll(async function () {
  // Close browser after all tests
  await browser.close();
});
