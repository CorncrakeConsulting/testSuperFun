import { test, expect } from "@playwright/test";
import { WheelGamePage } from "../pages/WheelGamePage";
import { TestLogger } from "../services/TestLogger";

test.describe("Balance Calculation Bugs", () => {
  let gamePage: WheelGamePage;

  test.beforeEach(async ({ page }) => {
    gamePage = WheelGamePage.create(page);
    await gamePage.goto();
  });

  test("should correctly update balance when landing on 2X multiplier", async () => {
    // Set up test scenario
    const initialBalance = 1000;
    const betAmount = 50;

    await gamePage.testHooks.setPlayerData({
      balance: initialBalance,
      bet: betAmount,
      win: 0,
    });

    // Find the 2X slice - test each slice to identify which one has 2X multiplier
    let twoXSliceIndex: number | undefined;

    for (let sliceIndex = 0; sliceIndex < 8; sliceIndex++) {
      // Reset state for each test
      await gamePage.testHooks.setPlayerData({
        balance: initialBalance,
        bet: betAmount,
        win: 0,
      });

      // Force wheel to land on this slice
      await gamePage.testHooks.setWheelLandingIndex(sliceIndex);

      await gamePage.spin();
      await gamePage.state.waitForWheelToStop();

      const win = await gamePage.data.getWin();

      // Check if this is the 2X slice (win should be 2 * bet)
      if (win === betAmount * 2) {
        twoXSliceIndex = sliceIndex;
        TestLogger.info(`Found 2X multiplier at slice index: ${sliceIndex}`);
        break;
      }
    }

    // If no 2X found, skip this test (or fail if we know 2X exists)
    if (twoXSliceIndex === undefined) {
      test.skip();
      return;
    }

    // Now test the actual bug: balance calculation with 2X
    await gamePage.testHooks.setPlayerData({
      balance: initialBalance,
      bet: betAmount,
      win: 0,
    });

    await gamePage.testHooks.setWheelLandingIndex(twoXSliceIndex);

    const balanceBeforeSpin = await gamePage.data.getBalance();
    const betBeforeSpin = await gamePage.getBet();

    await gamePage.spin();
    await gamePage.state.waitForWheelToStop();

    const balanceAfterSpin = await gamePage.data.getBalance();
    const winAmount = await gamePage.data.getWin();

    // Expected calculation:
    // New Balance = Initial Balance - Bet + Win
    // With 2X: New Balance = 1000 - 50 + 100 = 1050
    const expectedBalance = balanceBeforeSpin - betBeforeSpin + winAmount;

    TestLogger.info("=== 2X Balance Bug Test ===");
    TestLogger.info(`Initial Balance: ${balanceBeforeSpin}`);
    TestLogger.info(`Bet Amount: ${betBeforeSpin}`);
    TestLogger.info(`Win Amount: ${winAmount}`);
    TestLogger.info(
      `Expected Balance: ${expectedBalance} (${balanceBeforeSpin} - ${betBeforeSpin} + ${winAmount})`
    );
    TestLogger.info(`Actual Balance: ${balanceAfterSpin}`);
    TestLogger.info(`Difference: ${balanceAfterSpin - expectedBalance}`);

    // This test SHOULD expose the bug
    expect(balanceAfterSpin).toBe(expectedBalance);
  });

  test("should correctly update balance for all multipliers", async () => {
    // Test all slices to see which ones have incorrect balance calculations
    const initialBalance = 1000;
    const betAmount = 50;
    const results: Array<{
      sliceIndex: number;
      multiplier: number;
      expectedBalance: number;
      actualBalance: number;
      isCorrect: boolean;
    }> = [];

    for (let sliceIndex = 0; sliceIndex < 8; sliceIndex++) {
      // Reset for each spin
      await gamePage.testHooks.setPlayerData({
        balance: initialBalance,
        bet: betAmount,
        win: 0,
      });

      await gamePage.testHooks.setWheelLandingIndex(sliceIndex);

      await gamePage.spin();
      await gamePage.state.waitForWheelToStop();

      const actualBalance = await gamePage.data.getBalance();
      const winAmount = await gamePage.data.getWin();
      const multiplier = winAmount / betAmount;
      const expectedBalance = initialBalance - betAmount + winAmount;

      results.push({
        sliceIndex,
        multiplier,
        expectedBalance,
        actualBalance,
        isCorrect: actualBalance === expectedBalance,
      });
    }

    // Log all results
    TestLogger.info("\n=== Balance Calculation Test Results ===");
    results.forEach((result) => {
      const status = result.isCorrect ? "✅" : "❌";
      TestLogger.info(
        `${status} Slice ${result.sliceIndex} (${result.multiplier}X): Expected ${result.expectedBalance}, Got ${result.actualBalance}`
      );
    });

    // Find bugs
    const bugs = results.filter((r) => !r.isCorrect);
    if (bugs.length > 0) {
      TestLogger.info("\n🐛 BUGS FOUND:");
      bugs.forEach((bug) => {
        TestLogger.info(
          `   Slice ${bug.sliceIndex} (${bug.multiplier}X): Off by ${
            bug.actualBalance - bug.expectedBalance
          }`
        );
      });
    }

    // Fail if any balance calculations are wrong
    expect(bugs.length).toBe(0);
  });

  test("BUG REPORT: 2X multiplier balance calculation", async () => {
    // This test documents the specific 2X bug
    // Remove test.skip() when you want to run it

    const initialBalance = 1000;
    const betAmount = 50;

    // Find 2X slice
    let twoXSlice: number | undefined;
    for (let i = 0; i < 8; i++) {
      await gamePage.testHooks.setPlayerData({
        balance: initialBalance,
        bet: betAmount,
        win: 0,
      });
      await gamePage.testHooks.setWheelLandingIndex(i);
      await gamePage.spin();
      await gamePage.state.waitForWheelToStop();

      const win = await gamePage.data.getWin();
      if (win === betAmount * 2) {
        twoXSlice = i;
        break;
      }
    }

    if (twoXSlice === undefined) {
      TestLogger.info("⚠️  No 2X slice found in wheel configuration");
      test.skip();
      return;
    }

    // Reproduce the bug
    await gamePage.testHooks.setPlayerData({ balance: 1000, bet: 50, win: 0 });
    await gamePage.testHooks.setWheelLandingIndex(twoXSlice);
    await gamePage.spin();
    await gamePage.state.waitForWheelToStop();

    const finalBalance = await gamePage.data.getBalance();
    const winAmount = await gamePage.data.getWin();

    TestLogger.info("\n🐛 BUG REPORT: 2X Balance Calculation");
    TestLogger.info("=====================================");
    TestLogger.info(`Starting Balance: 1000`);
    TestLogger.info(`Bet: 50`);
    TestLogger.info(`Win (2X): ${winAmount}`);
    TestLogger.info(`Expected Final Balance: ${1000 - 50 + winAmount} = 1050`);
    TestLogger.info(`Actual Final Balance: ${finalBalance}`);
    TestLogger.info(
      `Bug: Balance is ${
        finalBalance === 1050
          ? "CORRECT"
          : `INCORRECT (off by ${finalBalance - 1050})`
      }`
    );

    // This will fail if the bug exists
    expect(finalBalance).toBe(1050);
  });
});
