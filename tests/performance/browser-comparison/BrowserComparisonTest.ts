import { Page, Browser } from "@playwright/test";
import { PerformanceTestBase } from "../base/PerformanceTestBase";
import type { ILogger } from "../../../services/TestLogger";

interface SpinMetrics {
  spinNumber: number;
  duration: number;
  heapSize: number;
  timestamp: number;
}

interface BrowserPerformanceMetrics {
  browserName: string;
  browserVersion: string;
  totalSpins: number;
  averageSpinDuration: number;
  minSpinDuration: number;
  maxSpinDuration: number;
  spinDurationStdDev: number;
  averageHeapSize: number;
  initialHeapSize: number;
  finalHeapSize: number;
  heapGrowth: number;
  heapGrowthPerSpin: number;
  totalTestDuration: number;
  spins: SpinMetrics[];
}

/**
 * Configuration for browser comparison tests
 */
const COMPARISON_CONFIG = {
  SPIN_COUNT: 100,
  QUICK_SPIN_ENABLED: false,
  SPIN_TIMEOUT: 30000, // 30 seconds for full animation
} as const;

/**
 * Compares performance across different browsers
 * Runs identical tests on each browser to measure relative performance
 */
export class BrowserComparisonTest extends PerformanceTestBase {
  private readonly browser?: Browser;

  constructor(
    page: Page,
    browserName: string,
    logger: ILogger,
    browser?: Browser
  ) {
    super(page, browserName, logger);
    this.browser = browser;
  }

  /**
   * Measure JS heap size with browser compatibility check
   */
  private async measureHeap(): Promise<number> {
    const heap = await this.page.evaluate(() => {
      if (
        typeof performance !== "undefined" &&
        (performance as any).memory?.usedJSHeapSize
      ) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });
    return heap;
  }

  /**
   * Measure a single spin duration
   */
  private async measureSpin(): Promise<number> {
    const startTime = Date.now();

    // Click spin button and wait for completion with extended timeout
    await this.gamePage.spinAndWait(COMPARISON_CONFIG.SPIN_TIMEOUT);

    const duration = Date.now() - startTime;
    return duration;
  }

  /**
   * Run 30 spins and collect metrics
   */
  private async runSpinTest(): Promise<BrowserPerformanceMetrics> {
    const testStartTime = Date.now();
    const spins: SpinMetrics[] = [];

    // Get browser version
    const browserVersion = await this.page.evaluate(() => navigator.userAgent);

    // Measure initial heap
    const initialHeapSize = await this.measureHeap();

    console.log(
      `\n🔍 Running ${COMPARISON_CONFIG.SPIN_COUNT} spins on ${this.browserName}...`
    );

    // Enable quick spin for faster testing
    if (COMPARISON_CONFIG.QUICK_SPIN_ENABLED) {
      await this.gamePage.enableQuickSpin();
    }

    // Run spins and collect metrics
    for (let i = 1; i <= COMPARISON_CONFIG.SPIN_COUNT; i++) {
      const spinDuration = await this.measureSpin();
      const heapSize = await this.measureHeap();

      spins.push({
        spinNumber: i,
        duration: spinDuration,
        heapSize,
        timestamp: Date.now(),
      });

      // Log progress every 10 spins
      if (i % 10 === 0) {
        console.log(`   Completed ${i}/${COMPARISON_CONFIG.SPIN_COUNT} spins`);
      }
    }

    // Measure final heap
    const finalHeapSize = await this.measureHeap();
    const totalTestDuration = Date.now() - testStartTime;

    // Calculate statistics
    const durations = spins.map((s) => s.duration);
    const averageSpinDuration =
      durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const minSpinDuration = Math.min(...durations);
    const maxSpinDuration = Math.max(...durations);

    // Calculate standard deviation
    const variance =
      durations.reduce(
        (sum, d) => sum + Math.pow(d - averageSpinDuration, 2),
        0
      ) / durations.length;
    const spinDurationStdDev = Math.sqrt(variance);

    // Calculate heap statistics
    const heapSizes = spins.map((s) => s.heapSize).filter((h) => h > 0);
    const averageHeapSize =
      heapSizes.length > 0
        ? heapSizes.reduce((sum, h) => sum + h, 0) / heapSizes.length
        : 0;
    const heapGrowth = finalHeapSize - initialHeapSize;
    const heapGrowthPerSpin = heapGrowth / COMPARISON_CONFIG.SPIN_COUNT;

    return {
      browserName: this.browserName,
      browserVersion,
      totalSpins: COMPARISON_CONFIG.SPIN_COUNT,
      averageSpinDuration,
      minSpinDuration,
      maxSpinDuration,
      spinDurationStdDev,
      averageHeapSize,
      initialHeapSize,
      finalHeapSize,
      heapGrowth,
      heapGrowthPerSpin,
      totalTestDuration,
      spins,
    };
  }

  /**
   * Run the browser comparison test
   */
  async run(): Promise<void> {
    await this.setupGamePage();

    // Set initial game state using test hooks
    await this.page.evaluate(() => {
      (globalThis as any).setPlayerData({ balance: 10000, betAmount: 10 });
    });

    const metrics = await this.runSpinTest();

    this.displayMetrics(metrics);
    this.saveResults(`browser-comparison-${this.browserName}.json`, metrics);

    // Generate summary for this browser
    const summary = this.generateSummary(metrics);
    this.appendToSummary(summary);
  }

  /**
   * Display metrics to console
   */
  private displayMetrics(metrics: BrowserPerformanceMetrics): void {
    console.log(`\n📊 ${metrics.browserName} Performance Results:`);
    console.log(`   Total Spins: ${metrics.totalSpins}`);
    console.log(
      `   Average Spin Duration: ${metrics.averageSpinDuration.toFixed(0)}ms`
    );
    console.log(`   Min Spin Duration: ${metrics.minSpinDuration}ms`);
    console.log(`   Max Spin Duration: ${metrics.maxSpinDuration}ms`);
    console.log(`   Std Dev: ±${metrics.spinDurationStdDev.toFixed(0)}ms`);

    if (metrics.averageHeapSize > 0) {
      console.log(
        `   Average Heap: ${this.formatMB(metrics.averageHeapSize)} MB`
      );
      console.log(
        `   Heap Growth: ${this.formatKB(
          metrics.heapGrowth
        )} KB (${this.formatKB(metrics.heapGrowthPerSpin)} KB/spin)`
      );
    }

    console.log(
      `   Total Test Duration: ${(metrics.totalTestDuration / 1000).toFixed(
        1
      )}s`
    );
    console.log(
      `   ✓ Results saved to ./test-results/browser-comparison-${metrics.browserName}.json`
    );
  }

  /**
   * Generate human-readable summary
   */
  private generateSummary(metrics: BrowserPerformanceMetrics): string {
    const lines: string[] = [];

    lines.push(
      `### ${metrics.browserName} Performance (${metrics.totalSpins} spins)`
    );

    // Determine performance status
    let speedStatus = "✅ Excellent";
    if (metrics.averageSpinDuration > 2000) {
      speedStatus = "❌ Slow";
    } else if (metrics.averageSpinDuration > 1500) {
      speedStatus = "⚠️ Acceptable";
    }

    lines.push(
      `- **Average Spin Duration:** ${metrics.averageSpinDuration.toFixed(
        0
      )}ms (${speedStatus})`,
      `- **Fastest Spin:** ${metrics.minSpinDuration}ms`,
      `- **Slowest Spin:** ${metrics.maxSpinDuration}ms`,
      `- **Consistency:** ±${metrics.spinDurationStdDev.toFixed(0)}ms std dev`
    );

    if (metrics.averageHeapSize > 0) {
      const memoryStatus =
        metrics.heapGrowthPerSpin < 100000 ? "✅ Stable" : "⚠️ Growing";
      lines.push(
        `- **Memory Usage:** ${this.formatMB(
          metrics.averageHeapSize
        )} MB (${memoryStatus})`,
        `- **Memory Growth:** ${this.formatKB(
          metrics.heapGrowthPerSpin
        )} KB/spin`
      );
    } else {
      lines.push(`- **Memory Usage:** Not available (browser limitation)`);
    }

    lines.push(
      `- **Total Test Time:** ${(metrics.totalTestDuration / 1000).toFixed(1)}s`
    );

    return lines.join("\n");
  }
}
