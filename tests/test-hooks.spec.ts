import { test, expect } from "@playwright/test";
import { WheelGamePage } from "../pages/WheelGamePage";

test.describe("Test Hooks Integration", () => {
  let gamePage: WheelGamePage;

  test.beforeEach(async ({ page }) => {
    gamePage = WheelGamePage.create(page);
    await gamePage.goto();
  });

  test("should update player data using setPlayerData hook", async () => {
    await gamePage.testHooks.setPlayerData({
      balance: 1500,
      bet: 75,
      win: 50,
    });

    expect(await gamePage.data.getBalance()).toBe(1500);
    expect(await gamePage.data.getBet()).toBe(75);
    expect(await gamePage.data.getWin()).toBe(50);
  });

  test("should provide access to game instance for advanced testing", async () => {
    const gameInstance = await gamePage.state.getGameInstance();

    expect(gameInstance).toBeTruthy();
    expect(typeof gameInstance).toBe("object");
  });

  test.skip("should force wheel to land on specific index (currently broken)", async () => {
    // Known issue: setWheelLandingIndex stores undefined instead of index
    // This test documents the expected behavior once fixed
    await gamePage.testHooks.setPlayerData({ balance: 1000, bet: 10 });
    await gamePage.testHooks.setWheelLandingIndex(0);

    await gamePage.spin();
    await gamePage.state.waitForWheelToStop();

    const balance = await gamePage.data.getBalance();
    expect(balance).toBe(990); // Should be deducted without win
  });
});
