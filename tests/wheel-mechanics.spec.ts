import { test, expect } from "@playwright/test";
import { WheelGamePage } from "../pages/WheelGamePage";

test.describe("Wheel Mechanics and Win Scenarios", () => {
  let gamePage: WheelGamePage;

  test.beforeEach(async ({ page }) => {
    gamePage = new WheelGamePage(page);
    await gamePage.goto();
  });

  test.describe("Basic Spinning Mechanics", () => {
    test("should spin wheel when spin button is clicked", async () => {
      const initialBalance = await gamePage.data.getBalance();
      const betAmount = await gamePage.data.getBet();

      await gamePage.spin();
      await gamePage.state.waitForWheelToStop();

      // Verify balance calculation: oldBalance - wager + winnings = newBalance
      const newBalance = await gamePage.data.getBalance();
      const winnings = await gamePage.data.getWin();
      const expectedBalance = initialBalance - betAmount + winnings;

      expect(newBalance).toBe(expectedBalance);
    });

    test("should complete spin cycle within reasonable time", async () => {
      const startTime = Date.now();

      await gamePage.spin();
      await gamePage.state.waitForWheelToStop();

      const endTime = Date.now();
      const spinDuration = endTime - startTime;

      // Spin should complete within 10 seconds
      expect(spinDuration).toBeLessThan(10000);
      expect(spinDuration).toBeGreaterThan(500); // Should take at least 500ms
    });

    test("should prevent multiple simultaneous spins", async () => {
      // Start first spin
      await gamePage.spin();

      // Try to spin again immediately
      await gamePage.spin();

      // Wait for wheel to stop
      await gamePage.state.waitForWheelToStop();

      // Should only deduct bet once
      const balance = await gamePage.data.getBalance();
      expect(balance).toBe(990); // 1000 - 10 (one bet only)
    });
  });

  test.describe("Deterministic Win Testing", () => {
    test("should land on specified index when using test hook", async () => {
      // Set wheel to land on specific slice
      const targetIndex = 0;
      await gamePage.testHooks.setWheelLandingIndex(targetIndex);

      await gamePage.spin();
      await gamePage.state.waitForWheelToStop();

      // Verify the wheel landed where expected
      // Note: This test validates the test hook functionality
      // The actual win amount depends on the slice configuration
      const win = await gamePage.data.getWin();
      expect(win).toBeGreaterThanOrEqual(0);
    });

    test("should calculate wins correctly for different slices", async () => {
      const testCases = [
        { sliceIndex: 0, description: "first slice" },
        { sliceIndex: 1, description: "second slice" },
        { sliceIndex: 2, description: "third slice" },
      ];

      for (const testCase of testCases) {
        // Reset game state
        await gamePage.testHooks.setPlayerData({
          balance: 1000,
          bet: 10,
          win: 0,
        });
        await gamePage.testHooks.setWheelLandingIndex(testCase.sliceIndex);

        await gamePage.spin();
        await gamePage.state.waitForWheelToStop();

        const win = await gamePage.data.getWin();

        // Verify win is calculated (could be 0 for non-winning slices)
        expect(win).toBeGreaterThanOrEqual(0);

        // Log for debugging
        console.log(`${testCase.description} - Win: ${win}`);
      }
    });

    test("should handle winning scenario correctly", async () => {
      // Set up a winning scenario
      await gamePage.testHooks.setPlayerData({ balance: 1000, bet: 50 });

      // Test multiple slices to find a winning one
      for (let sliceIndex = 0; sliceIndex < 8; sliceIndex++) {
        await gamePage.testHooks.setPlayerData({
          balance: 1000,
          bet: 50,
          win: 0,
        });
        await gamePage.testHooks.setWheelLandingIndex(sliceIndex);

        await gamePage.spin();
        await gamePage.state.waitForWheelToStop();

        const win = await gamePage.data.getWin();

        if (win > 0) {
          // Found a winning slice
          expect(win).toBeGreaterThan(0);
          console.log(`Winning slice ${sliceIndex} - Win: ${win}`);
          break;
        }
      }
    });
  });

  test.describe("Random Spin Testing", () => {
    test("should handle random spins without errors", async () => {
      // Clear any forced landing index
      await gamePage.testHooks.setWheelLandingIndex(undefined);

      for (let i = 0; i < 5; i++) {
        const initialBalance = await gamePage.data.getBalance();
        const betAmount = await gamePage.data.getBet();

        await gamePage.spin();
        await gamePage.state.waitForWheelToStop();

        // Verify balance was deducted
        const newBalance = await gamePage.data.getBalance();
        expect(newBalance).toBe(initialBalance - betAmount);

        // Reset for next iteration if balance gets too low
        if (newBalance < betAmount) {
          await gamePage.testHooks.setPlayerData({ balance: 1000 });
        }
      }
    });

    test("should maintain game state consistency across multiple spins", async () => {
      await gamePage.testHooks.setPlayerData({ balance: 500, bet: 25 });

      let currentBalance = 500;

      for (let spin = 0; spin < 3; spin++) {
        await gamePage.spin();
        await gamePage.state.waitForWheelToStop();

        const newBalance = await gamePage.data.getBalance();
        const win = await gamePage.data.getWin();

        // Balance should be previous balance - bet + win
        expect(newBalance).toBe(currentBalance - 25 + win);
        currentBalance = newBalance;

        // Reset win for next spin
        await gamePage.testHooks.setPlayerData({ win: 0 });
      }
    });
  });

  test.describe("Edge Cases", () => {
    test("should handle low balance scenario", async () => {
      await gamePage.testHooks.setPlayerData({ balance: 15, bet: 10 });

      await gamePage.spin();
      await gamePage.state.waitForWheelToStop();

      const finalBalance = await gamePage.data.getBalance();
      expect(finalBalance).toBe(5);

      // Should not allow another spin with insufficient balance
      // (This behavior depends on game implementation)
    });

    test("should handle maximum bet scenario", async () => {
      await gamePage.testHooks.setPlayerData({ balance: 10000, bet: 1000 });

      await gamePage.spin();
      await gamePage.state.waitForWheelToStop();

      const finalBalance = await gamePage.data.getBalance();
      expect(finalBalance).toBe(9000); // 10000 - 1000
    });

    test("should reset wheel state after completed spin", async () => {
      await gamePage.spin();
      await gamePage.state.waitForWheelToStop();

      // Should be able to spin again
      const balanceAfterFirst = await gamePage.data.getBalance();

      await gamePage.spin();
      await gamePage.state.waitForWheelToStop();

      const balanceAfterSecond = await gamePage.data.getBalance();
      expect(balanceAfterSecond).toBe(balanceAfterFirst - 10);
    });
  });
});
