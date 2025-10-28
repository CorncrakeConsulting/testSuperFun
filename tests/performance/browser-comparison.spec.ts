import { test } from "@playwright/test";
import { BrowserComparisonTest } from "./browser-comparison/BrowserComparisonTest";
import { TestLogger } from "../../services/TestLogger";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

interface BrowserResults {
  browserName: string;
  averageSpinDuration: number;
  minSpinDuration: number;
  maxSpinDuration: number;
  spinDurationStdDev: number;
  averageHeapSize: number;
  heapGrowthPerSpin: number;
  totalTestDuration: number;
}

// Store results from each browser
const browserResults: BrowserResults[] = [];

test.describe("Browser Performance Comparison", () => {
  test("Compare performance across browsers", async ({
    page,
    browserName,
    browser,
  }) => {
    test.setTimeout(1200000); // 20 minutes for 100 spins without quick spin

    const logger = TestLogger.getDefault();
    const comparisonTest = new BrowserComparisonTest(
      page,
      browserName,
      logger,
      browser
    );

    await comparisonTest.run();

    // Load the results that were just saved
    const resultsPath = join(
      process.cwd(),
      "test-results",
      `browser-comparison-${browserName}.json`
    );

    try {
      const resultsData = require(resultsPath);
      browserResults.push({
        browserName: resultsData.browserName,
        averageSpinDuration: resultsData.averageSpinDuration,
        minSpinDuration: resultsData.minSpinDuration,
        maxSpinDuration: resultsData.maxSpinDuration,
        spinDurationStdDev: resultsData.spinDurationStdDev,
        averageHeapSize: resultsData.averageHeapSize,
        heapGrowthPerSpin: resultsData.heapGrowthPerSpin,
        totalTestDuration: resultsData.totalTestDuration,
      });
    } catch (error) {
      console.warn(`Could not load results for ${browserName}:`, error);
    }
  });

  // Generate comparative report after all browsers complete
  test.afterAll(() => {
    if (browserResults.length === 0) {
      console.log("⚠️  No browser results to compare");
      return;
    }

    generateComparisonReport(browserResults);
  });
});

/**
 * Generate a comprehensive comparison report
 */
function generateComparisonReport(results: BrowserResults[]): void {
  console.log("\n" + "=".repeat(80));
  console.log("📊 BROWSER PERFORMANCE COMPARISON REPORT");
  console.log("=".repeat(80));

  // Find fastest browser
  const fastestBrowser = results.reduce((prev, current) =>
    current.averageSpinDuration < prev.averageSpinDuration ? current : prev
  );

  const slowestBrowser = results.reduce((prev, current) =>
    current.averageSpinDuration > prev.averageSpinDuration ? current : prev
  );

  // Console output
  console.log("\n🏆 WINNER: " + fastestBrowser.browserName.toUpperCase());
  console.log(
    `   Average: ${fastestBrowser.averageSpinDuration.toFixed(0)}ms per spin`
  );

  console.log("\n📈 DETAILED COMPARISON:");
  console.log("-".repeat(80));

  const sortedResults = results.sort(
    (a, b) => a.averageSpinDuration - b.averageSpinDuration
  );

  for (const [index, result] of sortedResults.entries()) {
    const medals = ["🥇", "🥈", "🥉"];
    const position = medals[index] || "🏅";
    const percentSlower =
      index === 0
        ? ""
        : ` (+${(
            ((result.averageSpinDuration - fastestBrowser.averageSpinDuration) /
              fastestBrowser.averageSpinDuration) *
            100
          ).toFixed(1)}% slower)`;

    console.log(`\n${position} ${result.browserName.toUpperCase()}`);
    console.log(
      `   Average Spin: ${result.averageSpinDuration.toFixed(
        0
      )}ms${percentSlower}`
    );
    console.log(
      `   Range: ${result.minSpinDuration}ms - ${result.maxSpinDuration}ms`
    );
    console.log(`   Consistency: ±${result.spinDurationStdDev.toFixed(0)}ms`);

    if (result.averageHeapSize > 0) {
      console.log(
        `   Memory: ${(result.averageHeapSize / (1024 * 1024)).toFixed(
          2
        )} MB (${(result.heapGrowthPerSpin / 1024).toFixed(2)} KB/spin)`
      );
    }

    console.log(
      `   Total Time: ${(result.totalTestDuration / 1000).toFixed(1)}s`
    );
  }

  console.log("\n" + "=".repeat(80));

  // Generate Markdown report
  generateMarkdownReport(results, fastestBrowser, slowestBrowser);
}

/**
 * Generate a detailed Markdown comparison report
 */
function generateMarkdownReport(
  results: BrowserResults[],
  fastest: BrowserResults,
  slowest: BrowserResults
): void {
  const lines: string[] = [
    "# Browser Performance Comparison Report",
    "",
    `**Date:** ${new Date().toLocaleString()}`,
    `**Test:** 100 spins per browser with Quick Spin DISABLED`,
    "",
    "---",
    "",
  ];

  // Executive Summary
  lines.push(
    "## Executive Summary",
    "",
    `🏆 **Fastest Browser:** ${fastest.browserName}`,
    `- Average spin duration: ${fastest.averageSpinDuration.toFixed(0)}ms`,
    "",
    `🐌 **Slowest Browser:** ${slowest.browserName}`,
    `- Average spin duration: ${slowest.averageSpinDuration.toFixed(0)}ms`,
    `- ${(
      ((slowest.averageSpinDuration - fastest.averageSpinDuration) /
        fastest.averageSpinDuration) *
      100
    ).toFixed(1)}% slower than fastest`,
    ""
  );

  // Detailed Results Table
  lines.push(
    "## Detailed Results",
    "",
    "| Rank | Browser | Avg Spin (ms) | Min (ms) | Max (ms) | Std Dev (±ms) | Memory (MB) | Growth (KB/spin) |",
    "|------|---------|---------------|----------|----------|---------------|-------------|------------------|"
  );

  results
    .sort((a, b) => a.averageSpinDuration - b.averageSpinDuration)
    .forEach((result, index) => {
      const medals = ["🥇", "🥈", "�"];
      const rank = medals[index] || "🏅";
      const memory =
        result.averageHeapSize > 0
          ? (result.averageHeapSize / (1024 * 1024)).toFixed(2)
          : "N/A";
      const growth =
        result.heapGrowthPerSpin !== undefined
          ? (result.heapGrowthPerSpin / 1024).toFixed(2)
          : "N/A";

      lines.push(
        `| ${rank} | **${
          result.browserName
        }** | ${result.averageSpinDuration.toFixed(0)} | ${
          result.minSpinDuration
        } | ${result.maxSpinDuration} | ${result.spinDurationStdDev.toFixed(
          0
        )} | ${memory} | ${growth} |`
      );
    });

  lines.push("", "");
  // Performance Analysis
  lines.push("## Performance Analysis", "");

  results
    .sort((a, b) => a.averageSpinDuration - b.averageSpinDuration)
    .forEach((result, index) => {
      lines.push(`### ${index + 1}. ${result.browserName}`, "");

      // Speed assessment
      const percentSlower =
        index === 0
          ? "Fastest browser tested"
          : `${(
              ((result.averageSpinDuration - fastest.averageSpinDuration) /
                fastest.averageSpinDuration) *
              100
            ).toFixed(1)}% slower than ${fastest.browserName}`;

      lines.push(`**Speed:** ${percentSlower}`, "");

      // Consistency assessment
      let consistencyRating = "Excellent";
      if (result.spinDurationStdDev >= 300) {
        consistencyRating = "Variable";
      } else if (result.spinDurationStdDev >= 200) {
        consistencyRating = "Fair";
      } else if (result.spinDurationStdDev >= 100) {
        consistencyRating = "Good";
      }

      lines.push(
        `**Consistency:** ${consistencyRating} (±${result.spinDurationStdDev.toFixed(
          0
        )}ms standard deviation)`,
        ""
      );

      // Memory assessment
      if (result.averageHeapSize > 0) {
        let memoryEfficiency = "Excellent";
        if (result.heapGrowthPerSpin >= 100000) {
          memoryEfficiency = "Concerning";
        } else if (result.heapGrowthPerSpin >= 50000) {
          memoryEfficiency = "Good";
        }

        lines.push(
          `**Memory:** ${memoryEfficiency} (${(
            result.heapGrowthPerSpin / 1024
          ).toFixed(2)} KB growth per spin)`,
          ""
        );
      } else {
        lines.push(
          "**Memory:** Measurement not available (browser API limitation)",
          ""
        );
      }

      // Overall duration
      lines.push(
        `**Total Test Duration:** ${(result.totalTestDuration / 1000).toFixed(
          1
        )} seconds for 100 spins`,
        ""
      );
    });

  // Recommendations
  lines.push(
    "## Recommendations",
    "",
    `✅ **Best Performance:** Use **${fastest.browserName}** for optimal game experience`,
    ""
  );

  if (slowest.averageSpinDuration > fastest.averageSpinDuration * 1.2) {
    lines.push(
      `⚠️ **Performance Gap:** ${
        slowest.browserName
      } is significantly slower (${(
        ((slowest.averageSpinDuration - fastest.averageSpinDuration) /
          fastest.averageSpinDuration) *
        100
      ).toFixed(1)}% difference)`,
      `   - Consider optimizing animations for ${slowest.browserName}`,
      "   - Or recommend users switch to a faster browser",
      ""
    );
  }

  // Check for memory concerns
  const memoryIssues = results.filter((r) => r.heapGrowthPerSpin > 100000);
  if (memoryIssues.length > 0) {
    lines.push("⚠️ **Memory Concerns:**");
    for (const r of memoryIssues) {
      lines.push(
        `   - ${r.browserName}: ${(r.heapGrowthPerSpin / 1024).toFixed(
          2
        )} KB/spin growth detected`
      );
    }
    lines.push("");
  }

  // Test Configuration
  lines.push(
    "---",
    "",
    "## Test Configuration",
    "",
    "- **Spins per browser:** 100",
    "- **Quick Spin:** DISABLED",
    "- **Initial Balance:** $10,000",
    "- **Bet Amount:** $10",
    "- **Test Date:** " + new Date().toLocaleDateString(),
    ""
  );

  // Save report
  const reportPath = join(
    process.cwd(),
    "test-results",
    "browser-comparison-report.md"
  );
  writeFileSync(reportPath, lines.join("\n"));

  console.log(
    `\n✅ Detailed report saved to: ./test-results/browser-comparison-report.md`
  );
}
