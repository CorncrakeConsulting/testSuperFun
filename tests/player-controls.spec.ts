import { test, expect } from "./fixtures/gameFixtures";
import { setupDeterministicSpin } from "../utils/testUtils";

test.describe("Player Controls", () => {
  test.describe("Bet Management", () => {
    test("should increase bet when increment button is clicked", async ({
      gamePage,
    }) => {
      const initialBet = await gamePage.data.getBet();
      await gamePage.increaseBet();

      const newBet = await gamePage.data.getBet();
      expect(newBet).toBe(initialBet + 10);
    });

    test("should decrease bet when decrement button is clicked", async ({
      gamePage,
    }) => {
      // First increase bet so we can decrease it
      await gamePage.increaseBet();
      const currentBet = await gamePage.data.getBet();

      await gamePage.decreaseBet();
      const newBet = await gamePage.data.getBet();
      expect(newBet).toBe(currentBet - 10);
    });

    test("should not allow bet to go below minimum", async ({ gamePage }) => {
      // Try to decrease bet below minimum
      await gamePage.decreaseBet();
      const bet = await gamePage.data.getBet();
      expect(bet).toBe(10); // Should remain at minimum
    });

    test("should maintain bet changes across multiple operations", async ({
      gamePage,
    }) => {
      // Increase bet multiple times
      await gamePage.increaseBet();
      await gamePage.increaseBet();
      await gamePage.increaseBet();

      const finalBet = await gamePage.data.getBet();
      expect(finalBet).toBe(40); // 10 + 30
    });
  });

  test.describe("Balance Management", () => {
    test("should deduct bet amount from balance after spin", async ({
      gamePage,
    }) => {
      const { balance: initialBalance, bet: betAmount } =
        await gamePage.data.getCoreData();

      // Force wheel to land on slice 2 (0x multiplier - losing spin)
      await gamePage.testHooks.setWheelLandingIndex(2);

      await gamePage.spinAndWait();

      const newBalance = await gamePage.data.getBalance();
      expect(newBalance).toBe(initialBalance - betAmount);
    });

    test("should handle custom balance using test hooks", async ({
      gamePage,
    }) => {
      await gamePage.testHooks.setPlayerData({ balance: 5000 });

      const balance = await gamePage.data.getBalance();
      expect(balance).toBe(5000);
    });
  });

  test.describe("Autoplay Functionality", () => {
    test("should toggle autoplay mode", async ({ gamePage }) => {
      const initialAutoplay = await gamePage.data.isAutoplayEnabled();
      await gamePage.toggleAutoplay();

      const newAutoplay = await gamePage.data.isAutoplayEnabled();
      expect(newAutoplay).toBe(!initialAutoplay);
    });

    test("should start multiple rounds when autoplay is enabled", async ({
      gamePage,
    }) => {
      // Force wheel to land on slice 2 (0x multiplier - losing spin)
      await gamePage.testHooks.setWheelLandingIndex(2);

      // Enable autoplay
      await gamePage.toggleAutoplay();
      expect(await gamePage.data.isAutoplayEnabled()).toBe(true);

      const initialBalance = await gamePage.data.getBalance();

      // Trigger first spin
      await gamePage.spin();

      // Wait for multiple rounds (autoplay should continue)
      await gamePage.page.waitForTimeout(3000);

      const finalBalance = await gamePage.data.getBalance();
      expect(finalBalance).toBeLessThan(initialBalance);
    });
  });

  test.describe("Quick Spin Mode", () => {
    test("should toggle quick spin mode", async ({ gamePage }) => {
      await gamePage.toggleQuickSpin();

      // Verify the checkbox is visible
      await expect(gamePage.locators.quickSpinCheckbox).toBeVisible();
    });
  });

  test.describe("Data-Driven Testing", () => {
    const betScenarios = [
      { description: "minimum bet with low balance", balance: 100, bet: 10 },
      { description: "medium bet with medium balance", balance: 500, bet: 50 },
      { description: "high bet with high balance", balance: 10000, bet: 500 },
      { description: "minimum bet with minimum balance", balance: 10, bet: 10 },
    ];

    for (const scenario of betScenarios) {
      test(`should handle ${scenario.description}`, async ({ gamePage }) => {
        await setupDeterministicSpin(gamePage, 2, {
          balance: scenario.balance,
          bet: scenario.bet,
        });

        // Small wait to ensure data is applied (especially in webkit)
        await gamePage.page.waitForTimeout(100);

        const { balance, bet } = await gamePage.data.getCoreData();

        expect(balance).toBe(scenario.balance);
        expect(bet).toBe(scenario.bet);

        // Test that spinning works with this configuration
        await gamePage.spinAndWait();

        const newBalance = await gamePage.data.getBalance();
        expect(newBalance).toBe(scenario.balance - scenario.bet);
      });
    }
  });
});
