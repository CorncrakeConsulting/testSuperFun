import { test, expect } from "./fixtures/gameFixtures";
import { TestLogger } from "../services/TestLogger";
import {
  findSliceByMultiplier,
  setupDeterministicSpin,
} from "../utils/testUtils";

test.describe("Balance Calculation Bugs", () => {
  test("should correctly update balance when landing on 2X multiplier", async ({
    gamePage,
  }) => {
    // Set up test scenario
    const initialBalance = 1000;
    const betAmount = 50;

    // Find the 2X slice using helper
    const twoXSliceIndex = await findSliceByMultiplier(
      gamePage,
      2,
      initialBalance,
      betAmount
    );

    // If no 2X found, skip this test (or fail if we know 2X exists)
    if (twoXSliceIndex === undefined) {
      test.skip();
      return;
    }

    TestLogger.info(`Found 2X multiplier at slice index: ${twoXSliceIndex}`);

    // Now test the actual bug: balance calculation with 2X
    await setupDeterministicSpin(gamePage, twoXSliceIndex, {
      balance: initialBalance,
      bet: betAmount,
    });

    const { balance: balanceBeforeSpin, bet: betBeforeSpin } =
      await gamePage.data.getCoreData();

    await gamePage.spinAndWait();

    const { balance: balanceAfterSpin, win: winAmount } =
      await gamePage.data.getCoreData();

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

  test("should correctly update balance for all multipliers", async ({
    gamePage,
  }) => {
    // Set timeout for 12 spins (with quick spin: ~2s each = 24s, with buffer = 60s)
    test.setTimeout(60000);

    // Enable quick spin to speed up this test (12 spins total)
    await gamePage.enableQuickSpin();

    // Get the actual number of slices from the game
    const sliceCount = await gamePage.state.getSliceCount();

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

    for (let sliceIndex = 0; sliceIndex < sliceCount; sliceIndex++) {
      // Reset for each spin
      await setupDeterministicSpin(gamePage, sliceIndex, {
        balance: initialBalance,
        bet: betAmount,
      });

      await gamePage.spinAndWait();

      const { balance: actualBalance, win: winAmount } =
        await gamePage.data.getCoreData();
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
    for (const result of results) {
      const status = result.isCorrect ? "✅" : "❌";
      TestLogger.info(
        `${status} Slice ${result.sliceIndex} (${result.multiplier}X): Expected ${result.expectedBalance}, Got ${result.actualBalance}`
      );
    }

    // Find bugs
    const bugs = results.filter((r) => !r.isCorrect);
    if (bugs.length > 0) {
      TestLogger.info("\n🐛 BUGS FOUND:");
      for (const bug of bugs) {
        TestLogger.info(
          `   Slice ${bug.sliceIndex} (${bug.multiplier}X): Off by ${
            bug.actualBalance - bug.expectedBalance
          }`
        );
      }
    }

    // Fail if any balance calculations are wrong
    expect(bugs.length).toBe(0);
  });

  test("BUG REPORT: 2X multiplier balance calculation", async ({
    gamePage,
  }) => {
    // This test documents the specific 2X bug
    // Remove test.skip() when you want to run it

    const initialBalance = 1000;
    const betAmount = 50;

    // Find 2X slice using helper
    const twoXSlice = await findSliceByMultiplier(
      gamePage,
      2,
      initialBalance,
      betAmount
    );

    if (twoXSlice === undefined) {
      TestLogger.info("⚠️  No 2X slice found in wheel configuration");
      test.skip();
      return;
    }

    // Reproduce the bug
    await setupDeterministicSpin(gamePage, twoXSlice, {
      balance: 1000,
      bet: 50,
    });
    await gamePage.spinAndWait();

    const { balance: finalBalance, win: winAmount } =
      await gamePage.data.getCoreData();

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
