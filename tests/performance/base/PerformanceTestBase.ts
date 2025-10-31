import { Page } from "@playwright/test";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { WheelGamePage } from "../../../pages/WheelGamePage";
import type { ILogger } from "../../../services/TestLogger";

/**
 * Base class for all performance tests
 * Provides common functionality for test setup, teardown, and result storage
 */
export abstract class PerformanceTestBase {
  protected page!: Page;
  protected gamePage!: WheelGamePage;
  protected browserName: string;
  protected logger: ILogger;

  constructor(page: Page, browserName: string, logger: ILogger) {
    this.page = page;
    this.browserName = browserName;
    this.logger = logger;
  }

  /**
   * Initialize the game page - common setup for all tests
   */
  protected async setupGamePage(): Promise<void> {
    this.gamePage = WheelGamePage.create(this.page);
    await this.gamePage.goto();
  }

  /**
   * Save test results to JSON file with error handling
   */
  protected saveResults(filename: string, data: any): void {
    try {
      const dataPath = join(process.cwd(), "test-results", filename);
      writeFileSync(dataPath, JSON.stringify(data, null, 2));
      console.log(
        `   ✓ Results saved to ${dataPath.replace(process.cwd(), ".")}`
      );
    } catch (error) {
      console.error(
        `Failed to write results: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw error;
    }
  }

  /**
   * Append results to a human-readable summary file using logger
   */
  protected appendToSummary(content: string): void {
    const summaryPath = join(
      process.cwd(),
      "test-results",
      "performance-summary.md"
    );
    const timestamp = new Date().toLocaleString();
    const header = `\n---\n## Test Run: ${timestamp}\n\n`;
    const fullContent = header + content;

    this.logger.logToFile(summaryPath, fullContent);
    console.log(
      `   ✓ Summary updated: ${summaryPath.replace(process.cwd(), ".")}`
    );
  }

  /**
   * Format bytes to MB for display
   */
  protected formatMB(bytes: number): string {
    return (bytes / 1024 / 1024).toFixed(2);
  }

  /**
   * Format bytes to KB for display
   */
  protected formatKB(bytes: number): string {
    return (bytes / 1024).toFixed(2);
  }

  /**
   * Handle async errors with formatted message
   */
  protected handleError(context: string, error: unknown): never {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${context}: ${message}`);
  }

  /**
   * Abstract method that each test class must implement
   */
  abstract run(): Promise<void>;
}
