import {
  Before,
  After,
  BeforeAll,
  AfterAll,
  Status,
  setDefaultTimeout,
} from "@cucumber/cucumber";
import {
  chromium,
  firefox,
  webkit,
  Browser,
  BrowserContext,
  Page,
  ConsoleMessage,
} from "@playwright/test";
import { TestLogger } from "../../services/TestLogger";
import * as path from "node:path";
import * as fs from "node:fs";
import { sanitizeForFilename } from "../../utils/stringUtils";
import { CustomWorld } from "./world";

// Disable colors in Playwright error messages for cleaner HTML reports
process.env.FORCE_COLOR = "0";

// Calculate timeout dynamically based on expected number of spins
const MAX_EXPECTED_SPINS = 1000;
const SPINS_PER_SECOND = 0.5;
const BUFFER_MULTIPLIER = 1.5;
const dynamicTimeout = Math.ceil(
  (MAX_EXPECTED_SPINS / SPINS_PER_SECOND) * BUFFER_MULTIPLIER * 1000
);

setDefaultTimeout(dynamicTimeout);

let browser: Browser;
let context: BrowserContext;

const BROWSER = process.env.BROWSER || "chromium";
const HEADED = process.env.HEADED === "true";

function getBrowserType() {
  if (BROWSER === "firefox") return firefox;
  if (BROWSER === "webkit") return webkit;
  return chromium;
}

function shouldLogConsoleMessage(text: string): boolean {
  return (
    !text.includes("React DevTools") &&
    !text.includes("Download the React DevTools")
  );
}

async function saveFailureScreenshot(
  page: Page,
  scenarioName: string,
  testRunFolder: string
): Promise<Buffer> {
  const screenshot = await page.screenshot({ fullPage: true });
  const screenshotsDir = path.join(testRunFolder, "screenshots");

  fs.mkdirSync(screenshotsDir, { recursive: true });

  await page.screenshot({
    path: path.join(screenshotsDir, `failed-${scenarioName}-${Date.now()}.png`),
    fullPage: true,
  });

  return screenshot;
}

BeforeAll(async function () {
  const testRunFolder = TestLogger.initializeTestRun();
  const browserType = getBrowserType();

  console.log(
    `🌐 Launching ${BROWSER} browser${HEADED ? " (HEADED mode)" : ""}`
  );
  console.log(`📁 Reports: ${testRunFolder}`);

  browser = await browserType.launch({
    headless: !HEADED,
    slowMo: HEADED ? 100 : 50,
  });
});

Before(async function (this: CustomWorld, scenario) {
  const featureName =
    scenario.pickle.uri?.split("/").pop()?.replace(".feature", "") || "unknown";
  TestLogger.setCurrentFeature(featureName);

  context = await browser.newContext({
    baseURL: "http://localhost:3000",
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: path.join(TestLogger.getTestRunFolder(), "videos") },
  });

  this.page = await context.newPage();

  this.page.on("console", (msg: ConsoleMessage) => {
    const text = msg.text();
    if (shouldLogConsoleMessage(text)) {
      console.log(`Browser [${msg.type()}]:`, text);
    }
  });

  this.page.on("pageerror", (error: Error) => {
    console.error("Browser Error:", error.message);
  });
});

After(async function (this: CustomWorld, scenario) {
  if (scenario.result?.status === Status.FAILED) {
    const scenarioName = sanitizeForFilename(scenario.pickle.name);
    const screenshot = await saveFailureScreenshot(
      this.page,
      scenarioName,
      TestLogger.getTestRunFolder()
    );
    this.attach(screenshot, "image/png");
  }

  await this.page.close();
  await context.close();
});

AfterAll(async function () {
  await browser.close();
});
