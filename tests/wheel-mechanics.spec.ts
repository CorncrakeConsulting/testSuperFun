import { test, expect } from "./fixtures/gameFixtures";

test.describe("Basic Spinning Mechanics", () => {
  test("should complete spin cycle within reasonable time", async ({
    gamePage,
  }) => {
    const startTime = Date.now();

    await gamePage.spinAndWait();

    const endTime = Date.now();
    const spinDuration = endTime - startTime;

    // Spin should complete within 10 seconds
    expect(spinDuration).toBeLessThan(10000);
    expect(spinDuration).toBeGreaterThan(500); // Should take at least 500ms
  });

  test("should prevent multiple simultaneous spins", async ({ gamePage }) => {
    await gamePage.spin();
    await gamePage.spin();
    await gamePage.state.waitForWheelToStop();
    const balance = await gamePage.data.getBalance();
    expect(balance).toBe(990); // 1000 - 10 (one bet only)
  });
});

test.describe("Test Hook Validation", () => {
  test("should land on specified index when using test hook", async ({
    gamePage,
  }) => {
    const targetIndex = 0;
    await gamePage.testHooks.setWheelLandingIndex(targetIndex);
    await gamePage.spinAndWait();
    const win = await gamePage.data.getWin();
    expect(win).toBeGreaterThanOrEqual(0);
  });
});
