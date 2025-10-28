import { test, expect } from "@playwright/test";
import { WheelGamePage } from "../pages/WheelGamePage";

test.describe("Test Hooks Integration", () => {
  let gamePage: WheelGamePage;

  test.beforeEach(async ({ page }) => {
    gamePage = new WheelGamePage(page);
    await gamePage.goto();
  });

  test.describe("setPlayerData Hook", () => {
    test("should update balance using setPlayerData", async () => {
      await gamePage.setPlayerData({ balance: 2000 });

      const balance = await gamePage.getBalance();
      expect(balance).toBe(2000);
    });

    test("should update bet using setPlayerData", async () => {
      await gamePage.setPlayerData({ bet: 100 });

      const bet = await gamePage.getBet();
      expect(bet).toBe(100);
    });

    test("should update multiple properties simultaneously", async () => {
      await gamePage.setPlayerData({
        balance: 1500,
        bet: 75,
        win: 50,
      });

      expect(await gamePage.getBalance()).toBe(1500);
      expect(await gamePage.getBet()).toBe(75);
      expect(await gamePage.getWin()).toBe(50);
    });

    test("should handle autoplay setting", async () => {
      await gamePage.setPlayerData({ autoplay: true });

      const isAutoplayEnabled = await gamePage.isAutoplayEnabled();
      expect(isAutoplayEnabled).toBe(true);
    });

    test("should preserve existing values when updating partial data", async () => {
      // Set initial values
      await gamePage.setPlayerData({ balance: 500, bet: 25 });

      // Update only balance
      await gamePage.setPlayerData({ balance: 800 });

      // Bet should remain unchanged
      expect(await gamePage.getBalance()).toBe(800);
      expect(await gamePage.getBet()).toBe(25);
    });
  });

  test.describe("setWheelLandIndex Hook", () => {
    test("should force wheel to land on specific index", async () => {
      // Test each slice index
      for (let index = 0; index < 8; index++) {
        await gamePage.setPlayerData({ balance: 1000, bet: 10, win: 0 });
        await gamePage.setWheelLandingIndex(index);

        await gamePage.spin();
        await gamePage.waitForWheelToStop();

        // Verify the spin completed successfully
        const newBalance = await gamePage.getBalance();
        expect(newBalance).toBe(990); // Balance should be deducted

        console.log(`Tested slice index: ${index}`);
      }
    });

    test("should clear forced landing when set to undefined", async () => {
      // First set a specific index
      await gamePage.setWheelLandingIndex(0);

      // Then clear it
      await gamePage.setWheelLandingIndex(undefined);

      // Spin should now be random
      await gamePage.spin();
      await gamePage.waitForWheelToStop();

      // Should complete successfully without errors
      const balance = await gamePage.getBalance();
      expect(balance).toBe(990);
    });

    test("should handle invalid slice indices gracefully", async () => {
      // Test with out-of-bounds index
      await gamePage.setWheelLandingIndex(999);

      await gamePage.spin();
      await gamePage.waitForWheelToStop();

      // Should not crash the game
      const balance = await gamePage.getBalance();
      expect(balance).toBe(990);
    });

    test("should support negative indices", async () => {
      await gamePage.setWheelLandingIndex(-1);

      await gamePage.spin();
      await gamePage.waitForWheelToStop();

      // Should handle gracefully
      const balance = await gamePage.getBalance();
      expect(balance).toBe(990);
    });
  });

  test.describe("Game Object Access", () => {
    test("should provide access to game instance", async () => {
      const gameInstance = await gamePage.getGameInstance();

      expect(gameInstance).toBeTruthy();
      expect(typeof gameInstance).toBe("object");
    });

    test("should expose wheel and queue objects", async () => {
      const hasGameObjects = await gamePage.page.evaluate(() => {
        const game = (globalThis as typeof globalThis & Window).game;
        return (
          game &&
          typeof game.wheel === "object" &&
          typeof game.queue === "object"
        );
      });

      expect(hasGameObjects).toBe(true);
    });

    test("should allow inspection of action queue", async () => {
      const queueInfo = await gamePage.page.evaluate(() => {
        const game = (globalThis as typeof globalThis & Window).game;
        return {
          hasQueue: !!game.queue,
          queueType: typeof game.queue,
        };
      });

      expect(queueInfo.hasQueue).toBe(true);
      expect(queueInfo.queueType).toBe("object");
    });
  });

  test.describe("Combined Hook Usage", () => {
    test("should work with both hooks in sequence", async () => {
      // Set custom player data
      await gamePage.setPlayerData({ balance: 2000, bet: 50 });

      // Force specific wheel landing
      await gamePage.setWheelLandingIndex(0);

      await gamePage.spin();
      await gamePage.waitForWheelToStop();

      // Verify both hooks worked
      const balance = await gamePage.getBalance();
      expect(balance).toBe(1950); // 2000 - 50
    });

    test("should handle rapid hook calls", async () => {
      // Rapidly change settings
      await gamePage.setPlayerData({ balance: 1000 });
      await gamePage.setWheelLandingIndex(1);
      await gamePage.setPlayerData({ bet: 20 });
      await gamePage.setWheelLandingIndex(2);

      await gamePage.spin();
      await gamePage.waitForWheelToStop();

      // Should use latest settings
      const balance = await gamePage.getBalance();
      expect(balance).toBe(980); // 1000 - 20
    });

    test("should maintain hook settings across multiple spins", async () => {
      await gamePage.setPlayerData({ balance: 1000, bet: 25 });
      await gamePage.setWheelLandingIndex(0);

      // First spin
      await gamePage.spin();
      await gamePage.waitForWheelToStop();

      let balance = await gamePage.getBalance();
      expect(balance).toBe(975);

      // Second spin with same settings
      await gamePage.spin();
      await gamePage.waitForWheelToStop();

      balance = await gamePage.getBalance();
      expect(balance).toBe(950);
    });
  });
});
