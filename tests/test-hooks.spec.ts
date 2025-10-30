import { test, expect } from "./fixtures/gameFixtures";

test.describe("Test Hooks Integration", () => {
  test("should update player data using setPlayerData hook", async ({
    gamePage,
  }) => {
    await gamePage.testHooks.setPlayerData({
      balance: 1500,
      bet: 75,
      win: 50,
    });

    expect(await gamePage.data.getBalance()).toBe(1500);
    expect(await gamePage.data.getBet()).toBe(75);
    expect(await gamePage.data.getWin()).toBe(50);
  });

  test("should provide access to game instance for advanced testing", async ({
    gamePage,
  }) => {
    const gameInstance = await gamePage.state.getGameInstance();

    expect(gameInstance).toBeTruthy();
    expect(typeof gameInstance).toBe("object");
  });

  test.skip("should force wheel to land on specific index (currently broken)", async ({
    gamePage,
  }) => {
    // Known issue: setWheelLandingIndex stores undefined instead of index
    // This test documents the expected behavior once fixed
    await gamePage.testHooks.setPlayerData({ balance: 1000, bet: 10 });
    await gamePage.testHooks.setWheelLandingIndex(0);

    await gamePage.spinAndWait();

    const balance = await gamePage.data.getBalance();
    expect(balance).toBe(990); // Should be deducted without win
  });
});
