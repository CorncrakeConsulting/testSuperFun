import { test, expect } from "./fixtures/gameFixtures";
import {
  SpinTimingThresholds,
  TimingValidators,
} from "./performance/performance-thresholds";

test.describe("Basic Spinning Mechanics", () => {
  test("should complete spin cycle within reasonable time", async ({
    gamePage,
  }) => {
    // Use performance.now() for more reliable timing measurement
    const startTime = performance.now();
    await gamePage.spinAndWait();
    const endTime = performance.now();
    const spinDuration = endTime - startTime;

    // Verify spin completes within expected time bounds
    expect(spinDuration).toBeGreaterThan(
      SpinTimingThresholds.MIN_SPIN_DURATION_MS
    );
    expect(spinDuration).toBeLessThan(SpinTimingThresholds.MAX_NORMAL_SPIN_MS);

    // Log formatted duration for debugging
    console.log(
      `✓ Spin completed in ${TimingValidators.formatDuration(spinDuration)}`
    );
  });

  test("should prevent multiple simultaneous spins", async ({
    gamePage,
    browserName,
    page,
  }) => {
    // NOTE: This test validates spin prevention using timing-based inference
    // (i.e., if only one spin occurs, total duration ≈ single spin time).
    // This approach has limitations since spin timings vary across browsers
    // and individual spins. For more reliable validation, consider:
    // - Direct assertion on spinCount variable (currently tracked but not validated)
    // - Balance deduction check (should only deduct once)
    // - Event counter using game's internal spin events
    let spinCount = 0;
    await page.exposeFunction("trackSpin", () => {
      spinCount++;
    });

    // Monitor wheel state changes
    await page.evaluate(() => {
      const originalSpin = (globalThis as any).game?.wheel?.spin;
      if (originalSpin) {
        (globalThis as any).game.wheel.spin = function (...args: any[]) {
          (globalThis as any).trackSpin();
          return originalSpin.apply(this, args);
        };
      }
    });

    const startTime = performance.now();

    // First spin
    await gamePage.spin();

    // Attempt second spin during first spin
    await gamePage.page.waitForTimeout(
      SpinTimingThresholds.CONCURRENT_SPIN_ATTEMPT_DELAY_MS
    );
    await gamePage.spin();

    // Wait for wheel to stop
    await gamePage.state.waitForWheelToStop();
    const totalDuration = performance.now() - startTime;

    // Verify only one spin occurred using validation helper
    const validation = TimingValidators.isSingleSpinOnly(
      totalDuration,
      browserName
    );
    expect(validation.valid).toBe(true);
    console.log(`✓ ${validation.message}`);
  });
});
