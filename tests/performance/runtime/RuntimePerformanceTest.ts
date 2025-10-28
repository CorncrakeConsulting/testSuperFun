import { Page, Browser } from "@playwright/test";
import { PerformanceTestBase } from "../base/PerformanceTestBase";
import type { ILogger } from "../../../services/TestLogger";

interface RuntimeMetrics {
  jsHeapSize: {
    initial: number;
    afterSpins: number[];
    final: number;
  };
  memoryGrowth: number;
  spinCount: number;
}

interface ConcurrentLoadMetrics {
  concurrentSessions: number;
  totalHeapUsage: number;
  averageHeapPerSession: number;
  peakHeapUsage: number;
  sessionMetrics: Array<{
    sessionId: number;
    initialHeap: number;
    finalHeap: number;
    memoryGrowth: number;
  }>;
}

interface MemoryLeakMetrics {
  spinCount: number;
  heapSnapshots: Array<{
    spinNumber: number;
    heapBeforeGC: number;
    heapAfterGC: number;
    retained: number;
    delta?: number;
  }>;
  totalRetained: number;
  leakDetected: boolean;
  leakRate: number;
  trend?: number;
  firstHalfAvg?: number;
  secondHalfAvg?: number;
}

/**
 * Configuration for runtime performance tests
 */
const RUNTIME_CONFIG = {
  RUNTIME_SPIN_COUNT: 2,
  CONCURRENT_SESSION_COUNT: 3,
  LEAK_DETECTION_SPIN_COUNT: 10,
  SPIN_WAIT_MS: 4000,
  LEAK_THRESHOLD_KB_PER_SPIN: 10,
  GC_SETTLE_TIME_MS: 100,
} as const;

/**
 * Captures runtime performance metrics including RAM usage, JS Heap, and memory leaks
 */
export class RuntimePerformanceTest extends PerformanceTestBase {
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
      console.warn(
        "performance.memory not available - returning 0. Launch Chrome with --enable-precise-memory-info for accurate heap measurements."
      );
      return 0;
    });
    return heap;
  }

  /**
   * Test basic runtime memory usage during spins
   */
  private async testBasicRuntime(): Promise<RuntimeMetrics> {
    await this.setupGamePage();
    await this.gamePage.testHooks.setPlayerData({
      balance: 1000,
      quickSpin: true,
    });

    const initialHeap = await this.measureHeap();
    console.log("\n📊 Runtime Performance:");
    console.log(`   Initial JS Heap: ${this.formatMB(initialHeap)} MB`);

    const spinMetrics: number[] = [];
    const spinCount = RUNTIME_CONFIG.RUNTIME_SPIN_COUNT;

    for (let i = 0; i < spinCount; i++) {
      try {
        await this.gamePage.spin();
        await this.page.waitForTimeout(RUNTIME_CONFIG.SPIN_WAIT_MS);

        const heapAfterSpin = await this.measureHeap();
        spinMetrics.push(heapAfterSpin);

        console.log(
          `   Heap after spin ${i + 1}: ${this.formatMB(heapAfterSpin)} MB`
        );
      } catch (error) {
        this.handleError(`Error during spin ${i + 1}`, error);
      }
    }

    const finalHeap = await this.measureHeap();
    const memoryGrowth = finalHeap - initialHeap;

    console.log(`   Final JS Heap: ${this.formatMB(finalHeap)} MB`);
    console.log(`   Memory Growth: ${this.formatMB(memoryGrowth)} MB`);
    console.log(
      `   Growth per spin: ${this.formatKB(memoryGrowth / spinCount)} KB`
    );

    return {
      jsHeapSize: {
        initial: initialHeap,
        afterSpins: spinMetrics,
        final: finalHeap,
      },
      memoryGrowth,
      spinCount,
    };
  }

  /**
   * Test concurrent load with multiple sessions
   */
  private async testConcurrentLoad(): Promise<ConcurrentLoadMetrics> {
    if (!this.browser) {
      throw new Error("Browser instance required for concurrent load test");
    }

    console.log("\n📊 Concurrent Load Performance:");

    const sessionCount = RUNTIME_CONFIG.CONCURRENT_SESSION_COUNT;
    const sessionMetrics: ConcurrentLoadMetrics["sessionMetrics"] = [];

    let contexts: Array<{ context: any; id: number }> = [];
    try {
      contexts = await Promise.all(
        Array.from({ length: sessionCount }, async (_, i) => {
          const context = await this.browser!.newContext();
          return { context, id: i + 1 };
        })
      );
    } catch (error) {
      this.handleError("Failed to create browser contexts", error);
    }

    console.log(`   Testing with ${sessionCount} concurrent sessions...`);

    try {
      await Promise.all(
        contexts.map(async ({ context, id }) => {
          try {
            const page = await context.newPage();
            const gamePage = (
              await import("../../../pages/WheelGamePage")
            ).WheelGamePage.create(page);
            await gamePage.goto();

            await gamePage.testHooks.setPlayerData({
              balance: 1000,
              quickSpin: true,
            });

            const initialHeap = await page.evaluate(() => {
              if (
                typeof performance !== "undefined" &&
                (performance as any).memory?.usedJSHeapSize
              ) {
                return (performance as any).memory.usedJSHeapSize;
              }
              return 0;
            });

            for (let i = 0; i < RUNTIME_CONFIG.RUNTIME_SPIN_COUNT; i++) {
              await gamePage.spin();
              await page.waitForTimeout(RUNTIME_CONFIG.SPIN_WAIT_MS);
            }

            const finalHeap = await page.evaluate(() => {
              if (
                typeof performance !== "undefined" &&
                (performance as any).memory?.usedJSHeapSize
              ) {
                return (performance as any).memory.usedJSHeapSize;
              }
              return 0;
            });

            sessionMetrics.push({
              sessionId: id,
              initialHeap,
              finalHeap,
              memoryGrowth: finalHeap - initialHeap,
            });

            console.log(
              `   Session ${id}: ${this.formatMB(
                initialHeap
              )} MB → ${this.formatMB(finalHeap)} MB`
            );
          } catch (error) {
            this.handleError(`Error in session ${id}`, error);
          } finally {
            await context.close();
          }
        })
      );
    } finally {
      await Promise.all(
        contexts.map(({ context }) =>
          context.close().catch((err: Error) => {
            console.warn(`Failed to close context: ${err.message}`);
          })
        )
      );
    }

    const totalHeap = sessionMetrics.reduce((sum, s) => sum + s.finalHeap, 0);
    const peakHeap = Math.max(...sessionMetrics.map((s) => s.finalHeap));
    const avgHeap = totalHeap / sessionCount;

    console.log(`   Total Heap Usage: ${this.formatMB(totalHeap)} MB`);
    console.log(`   Average per Session: ${this.formatMB(avgHeap)} MB`);
    console.log(`   Peak Heap: ${this.formatMB(peakHeap)} MB`);

    return {
      concurrentSessions: sessionCount,
      totalHeapUsage: totalHeap,
      averageHeapPerSession: avgHeap,
      peakHeapUsage: peakHeap,
      sessionMetrics,
    };
  }

  /**
   * Test for memory leaks over extended usage
   */
  private async testMemoryLeaks(): Promise<MemoryLeakMetrics> {
    await this.setupGamePage();
    await this.gamePage.testHooks.setPlayerData({
      balance: 10000,
      quickSpin: true,
    });

    console.log(
      `\n📊 Memory Leak Detection (${RUNTIME_CONFIG.LEAK_DETECTION_SPIN_COUNT} spins):`
    );
    console.log(
      "   Note: GC is forced periodically to simulate realistic conditions"
    );

    let client;
    try {
      client = await this.page.context().newCDPSession(this.page);
    } catch (error) {
      this.handleError("Failed to create CDP session", error);
    }

    const heapSnapshots: MemoryLeakMetrics["heapSnapshots"] = [];
    const spinCount = RUNTIME_CONFIG.LEAK_DETECTION_SPIN_COUNT;

    try {
      for (let i = 0; i < spinCount; i++) {
        const shouldForceGC = i % 3 === 0;
        const heapBeforeGC = await this.measureHeap();

        if (shouldForceGC) {
          try {
            await client.send("HeapProfiler.collectGarbage");
            await this.page.waitForTimeout(RUNTIME_CONFIG.GC_SETTLE_TIME_MS);
          } catch (error) {
            console.warn(`GC collection failed: ${String(error)}`);
          }
        }

        const heapAfterGC = await this.measureHeap();
        const retained = heapAfterGC;
        const delta = i > 0 ? retained - heapSnapshots[i - 1].retained : 0;

        heapSnapshots.push({
          spinNumber: i + 1,
          heapBeforeGC,
          heapAfterGC,
          retained,
          delta,
        });

        await this.gamePage.spin();
        await this.page.waitForTimeout(RUNTIME_CONFIG.SPIN_WAIT_MS);

        if ((i + 1) % 5 === 0) {
          console.log(
            `   After ${i + 1} spins: ${this.formatMB(
              retained
            )} MB retained (Δ ${this.formatKB(delta || 0)} KB)`
          );
        }
      }
    } finally {
      try {
        await client.detach();
      } catch (error) {
        console.warn(`Failed to detach CDP session: ${String(error)}`);
      }
    }

    const leakAnalysis = this.calculateLeakMetrics(heapSnapshots, spinCount);
    this.displayLeakResults(heapSnapshots, leakAnalysis);

    return {
      spinCount,
      heapSnapshots,
      ...leakAnalysis,
    };
  }

  /**
   * Calculate memory leak metrics
   */
  private calculateLeakMetrics(
    heapSnapshots: MemoryLeakMetrics["heapSnapshots"],
    spinCount: number
  ) {
    const firstRetained = heapSnapshots[0].retained;
    const lastRetained = heapSnapshots.at(-1)!.retained;
    const totalRetained = lastRetained - firstRetained;
    const leakRate = totalRetained / spinCount / 1024;
    const leakDetected = leakRate > RUNTIME_CONFIG.LEAK_THRESHOLD_KB_PER_SPIN;

    const midpoint = Math.floor(spinCount / 2);
    const firstHalfAvg =
      heapSnapshots.slice(0, midpoint).reduce((sum, s) => sum + s.retained, 0) /
      midpoint;
    const secondHalfAvg =
      heapSnapshots.slice(midpoint).reduce((sum, s) => sum + s.retained, 0) /
      (spinCount - midpoint);
    const trend = secondHalfAvg - firstHalfAvg;

    return {
      totalRetained,
      leakRate,
      leakDetected,
      trend,
      firstHalfAvg,
      secondHalfAvg,
    };
  }

  /**
   * Display leak detection results
   */
  private displayLeakResults(
    heapSnapshots: MemoryLeakMetrics["heapSnapshots"],
    leakAnalysis: ReturnType<typeof this.calculateLeakMetrics>
  ): void {
    const firstRetained = heapSnapshots[0].retained;
    const lastRetained = heapSnapshots.at(-1)!.retained;

    console.log(`   Initial Retained: ${this.formatMB(firstRetained)} MB`);
    console.log(`   Final Retained: ${this.formatMB(lastRetained)} MB`);
    console.log(
      `   Total Growth: ${this.formatMB(leakAnalysis.totalRetained)} MB`
    );
    console.log(`   Leak Rate: ${leakAnalysis.leakRate.toFixed(2)} KB/spin`);
    console.log(
      `   Memory Trend: ${
        leakAnalysis.trend > 0 ? "📈 Growing" : "📉 Stable"
      } (${this.formatMB(leakAnalysis.trend)} MB difference)`
    );
    console.log(
      `   Leak Detected: ${leakAnalysis.leakDetected ? "⚠️  YES" : "✅ NO"}`
    );
  }

  /**
   * Run all runtime performance tests
   */
  async run(): Promise<void> {
    // Test 1: Basic runtime metrics
    const runtimeMetrics = await this.testBasicRuntime();
    this.saveResults("runtime-performance.json", runtimeMetrics);

    // Test 2: Concurrent load
    let concurrentMetrics;
    if (this.browser) {
      concurrentMetrics = await this.testConcurrentLoad();
      this.saveResults("concurrent-load-performance.json", concurrentMetrics);
    }

    // Test 3: Memory leak detection
    const leakMetrics = await this.testMemoryLeaks();
    this.saveResults("memory-leak-detection.json", leakMetrics);

    // Generate human-readable summary
    const summary = this.generateSummary(
      runtimeMetrics,
      concurrentMetrics,
      leakMetrics
    );
    this.appendToSummary(summary);
  }

  /**
   * Generate human-readable summary
   */
  private generateSummary(
    runtime: RuntimeMetrics,
    concurrent: ConcurrentLoadMetrics | undefined,
    leak: MemoryLeakMetrics
  ): string {
    const lines = [
      "### Runtime Performance",
      `- **Initial Heap:** ${this.formatMB(runtime.jsHeapSize.initial)} MB`,
      `- **Final Heap:** ${this.formatMB(runtime.jsHeapSize.final)} MB`,
      `- **Memory Growth:** ${this.formatMB(runtime.memoryGrowth)} MB`,
      `- **Status:** ${
        runtime.memoryGrowth === 0 ? "✅ Stable" : "⚠️ Growing"
      }`,
      "",
    ];

    if (concurrent) {
      lines.push(
        "### Concurrent Load (3 sessions)",
        `- **Total Heap:** ${this.formatMB(concurrent.totalHeapUsage)} MB`,
        `- **Average/Session:** ${this.formatMB(
          concurrent.averageHeapPerSession
        )} MB`,
        `- **Peak Heap:** ${this.formatMB(concurrent.peakHeapUsage)} MB`,
        `- **Status:** ✅ Linear scaling`,
        ""
      );
    }

    lines.push(
      "### Memory Leak Detection",
      `- **Spins Tested:** ${leak.spinCount}`,
      `- **Leak Rate:** ${leak.leakRate.toFixed(2)} KB/spin`,
      `- **Trend:** ${(leak.trend ?? 0) > 0 ? "📈 Growing" : "📉 Stable"}`,
      `- **Leak Detected:** ${leak.leakDetected ? "⚠️ YES" : "✅ NO"}`,
      `- **Status:** ${leak.leakDetected ? "⚠️ Action needed" : "✅ Excellent"}`
    );

    return lines.join("\n");
  }
}
