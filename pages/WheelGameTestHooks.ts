import { Page } from "@playwright/test";
import { TestLogger } from "../services/TestLogger";
import { GameWindow } from "../utils/windowHelpers";

/**
 * Test Hooks for the Wheel Game
 * Single Responsibility: Provide test-specific APIs to control game behavior
 */
export class WheelGameTestHooks {
  constructor(private readonly page: Page) {}

  /**
   * Use test hook to set player data
   */
  async setPlayerData(data: {
    balance?: number;
    bet?: number;
    autoplay?: boolean;
    win?: number;
    quickSpin?: boolean;
  }): Promise<void> {
    await this.page.evaluate((playerData) => {
      const win = globalThis as unknown as GameWindow;
      win.setPlayerData?.(playerData);
    }, data);
  }

  /**
   * Use test hook to set wheel landing index
   */
  async setWheelLandingIndex(index: number | undefined): Promise<void> {
    const result = await this.page.evaluate((landingIndex) => {
      const win = globalThis as unknown as GameWindow;
      const setWheelLandIndex = win.setWheelLandIndex;

      if (typeof setWheelLandIndex === "function") {
        setWheelLandIndex(landingIndex);
        return { success: true };
      } else {
        console.error(`❌ setWheelLandIndex is not available!`);
        return { success: false, error: "Function not available" };
      }
    }, index);

    TestLogger.debug(`Test hook result:`, result);

    if (!result.success) {
      const errorMsg = `Test hook failed: ${result.error}`;
      console.error(errorMsg);
      TestLogger.error(errorMsg);
    }
  }
  /**
   * Set the wheel to land on a slice with the specified multiplier
   * Finds the first slice with matching multiplier and sets it as landing index
   */
  async setWheelLandingMultiplier(multiplier: number): Promise<void> {
    const sliceIndex = await this.page.evaluate((targetMultiplier) => {
      const game = (globalThis as unknown as GameWindow).game;
      const slices = game?.wheel?._config?.slices || [];

      // Find first slice with matching multiplier
      for (let i = 0; i < slices.length; i++) {
        const slice = slices[i];
        // Check both exact match and close enough (for floating point)
        if (slice && Math.abs(slice.winMultiplier - targetMultiplier) < 0.001) {
          return i;
        }
      }

      // If not found, list available multipliers for debugging
      const available = slices
        .map(
          (s: { winMultiplier: number }, i: number) =>
            `${i}: ${s?.winMultiplier}x`
        )
        .join(", ");
      throw new Error(
        `No slice found with multiplier ${targetMultiplier}. Available: ${available}`
      );
    }, multiplier);

    await this.setWheelLandingIndex(sliceIndex);
  }
}
