import { Page } from "@playwright/test";
import { PerformanceTestBase } from "../base/PerformanceTestBase";
import type { ILogger } from "../../../services/TestLogger";

interface LoadingMetrics {
  loadTime: number;
  domContentLoaded: number;
  resourceCount: number;
  totalSize: number;
  averageResourceSize: number;
  trimmedAverageSize: number; // Average excluding top/bottom 10%
  resources: Array<{
    name: string;
    size: number;
    type: string;
  }>;
}

/**
 * Configuration for loading performance tests
 */
const LOADING_CONFIG = {
  MAX_RESOURCES_TO_TRACK: 100,
  TOP_RESOURCES_TO_SAVE: 10,
  TRIM_PERCENTAGE: 0.1, // 10% trim for trimmed average
} as const;

/**
 * Captures load time metrics including file sizes and timing
 */
export class LoadingPerformanceTest extends PerformanceTestBase {
  private readonly resources: Array<{
    name: string;
    size: number;
    type: string;
  }> = [];
  private totalSize = 0;
  private readonly resourcesFinalized: Promise<void>[] = [];

  constructor(page: Page, browserName: string, logger: ILogger) {
    super(page, browserName, logger);
  }

  /**
   * Set up network request monitoring
   */
  private setupNetworkMonitoring(): void {
    this.page.on("response", (response) => {
      if (this.resources.length >= LOADING_CONFIG.MAX_RESOURCES_TO_TRACK) {
        return;
      }

      const promise = (async () => {
        try {
          const url = response.url();
          const request = response.request();
          const type = request.resourceType();

          if (url.startsWith("data:")) {
            return;
          }

          // Only track resources that impact load performance
          const trackableTypes = ["script", "document", "stylesheet", "font"];
          if (!trackableTypes.includes(type)) {
            return;
          }

          const body = await response.body();
          const size = body.length;

          this.resources.push({
            name: url.split("/").pop() || url,
            size,
            type,
          });
          this.totalSize += size;
        } catch (error) {
          console.error(
            `Error processing response: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }
      })();
      this.resourcesFinalized.push(promise);
    });
  }

  /**
   * Calculate trimmed average by excluding top and bottom 10% of values
   */
  private calculateTrimmedAverage(sizes: number[]): number {
    if (sizes.length === 0) return 0;

    const sorted = [...sizes].sort((a, b) => a - b);
    const trimCount = Math.floor(
      sorted.length * LOADING_CONFIG.TRIM_PERCENTAGE
    );
    const trimmed = sorted.slice(trimCount, sorted.length - trimCount);

    return trimmed.length > 0
      ? trimmed.reduce((sum, val) => sum + val, 0) / trimmed.length
      : 0;
  }

  /**
   * Navigate to the application and capture timing data
   */
  private async captureLoadingMetrics(): Promise<LoadingMetrics> {
    const startTime = Date.now();

    try {
      await this.page.goto("http://localhost:3000");
      await this.page.waitForSelector("#preloader", { state: "detached" });
    } catch (error) {
      this.handleError("Failed to load application", error);
    }

    await Promise.all(this.resourcesFinalized);
    const loadTime = Date.now() - startTime;

    const perfData = await this.page.evaluate(() => {
      const navTiming = performance.getEntriesByType(
        "navigation"
      )[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navTiming.domContentLoadedEventEnd,
        loadComplete: navTiming.loadEventEnd,
      };
    });

    const resourceSizes = this.resources.map((r) => r.size);
    const averageResourceSize =
      this.resources.length > 0 ? this.totalSize / this.resources.length : 0;
    const trimmedAverageSize = this.calculateTrimmedAverage(resourceSizes);

    return {
      loadTime,
      domContentLoaded: perfData.domContentLoaded,
      resourceCount: this.resources.length,
      totalSize: this.totalSize,
      averageResourceSize,
      trimmedAverageSize,
      resources: this.resources.slice(0, LOADING_CONFIG.TOP_RESOURCES_TO_SAVE),
    };
  }

  /**
   * Display loading metrics to console
   */
  private displayMetrics(metrics: LoadingMetrics): void {
    console.log("\n📊 Loading Performance:");
    console.log(`   Load Time: ${metrics.loadTime}ms`);
    console.log(`   DOM Content Loaded: ${metrics.domContentLoaded}ms`);
    console.log(`   Resources Loaded: ${metrics.resourceCount}`);
    console.log(`   Total Size: ${this.formatMB(metrics.totalSize)} MB`);
    console.log(
      `   Average Resource Size: ${this.formatKB(
        metrics.averageResourceSize
      )} KB`
    );
    console.log(
      `   Trimmed Average Size: ${this.formatKB(
        metrics.trimmedAverageSize
      )} KB (±10% outliers removed)`
    );
  }

  /**
   * Run the loading performance test
   */
  async run(): Promise<void> {
    this.setupNetworkMonitoring();
    const metrics = await this.captureLoadingMetrics();
    this.displayMetrics(metrics);
    this.saveResults("loading-performance.json", metrics);

    // Generate human-readable summary
    const summary = this.generateSummary(metrics);
    this.appendToSummary(summary);
  }

  /**
   * Generate human-readable summary
   */
  private generateSummary(metrics: LoadingMetrics): string {
    let loadStatus = "✅ Fast";
    if (metrics.loadTime >= 5000) {
      loadStatus = "❌ Slow";
    } else if (metrics.loadTime >= 3000) {
      loadStatus = "⚠️ Acceptable";
    }

    const bundleSize =
      metrics.resources.find((r) => r.name === "bundle.js")?.size || 0;
    let bundleStatus = "✅ Good";
    if (bundleSize >= 5 * 1024 * 1024) {
      bundleStatus = "❌ Too Large";
    } else if (bundleSize >= 3 * 1024 * 1024) {
      bundleStatus = "⚠️ Large";
    }

    const overallStatus =
      loadStatus === "✅ Fast" && bundleStatus !== "❌ Too Large"
        ? "✅ Excellent"
        : "⚠️ Needs optimization";

    return [
      "### Loading Performance",
      `- **Load Time:** ${metrics.loadTime}ms (${loadStatus})`,
      `- **DOM Ready:** ${metrics.domContentLoaded.toFixed(0)}ms`,
      `- **Resources:** ${metrics.resourceCount} files`,
      `- **Total Size:** ${this.formatMB(metrics.totalSize)} MB`,
      `- **Bundle Size:** ${this.formatMB(bundleSize)} MB (${bundleStatus})`,
      `- **Status:** ${overallStatus}`,
    ].join("\n");
  }
}
