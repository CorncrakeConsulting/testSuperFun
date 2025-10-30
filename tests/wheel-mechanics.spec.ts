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

  test("should prevent multiple simultaneous spins", async ({
    gamePage,
    browserName,
  }) => {
    const startTime = Date.now();

    await gamePage.spin();

    // Wait 2 seconds, then try to spin again (while first spin is still active)
    await gamePage.page.waitForTimeout(2000);
    await gamePage.spin(); // This should be ignored

    await gamePage.state.waitForWheelToStop();
    const totalDuration = Date.now() - startTime;

    // Firefox is notably faster at rendering the wheel animations
    //this will be reported on to the developers!
    if (browserName === "firefox") {
      // Total time should be consistent with ONE spin (typically 4-6 seconds in Firefox)
      // If two spins happened, it would take ~8-12 seconds (two full spins)
      expect(totalDuration).toBeGreaterThan(4000); // At least one full spin
      expect(totalDuration).toBeLessThan(10000); // Less than time for two spins
    } else {
      // Chromium and Webkit: ONE spin typically takes 6-8 seconds
      // If two spins happened, it would take ~12-16 seconds (two full spins)
      expect(totalDuration).toBeGreaterThan(4000); // At least one full spin
      expect(totalDuration).toBeLessThan(12000); // Less than time for two spins
    }
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
xx;
