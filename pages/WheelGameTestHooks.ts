import { Page } from "@playwright/test";

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
      (
        globalThis as typeof globalThis & {
          setPlayerData: (data: typeof playerData) => void;
        }
      ).setPlayerData(playerData);
    }, data);
  }

  /**
   * Use test hook to set wheel landing index
   */
  async setWheelLandingIndex(index: number | undefined): Promise<void> {
    await this.page.evaluate((landingIndex) => {
      (
        globalThis as typeof globalThis & {
          setWheelLandIndex: (index: typeof landingIndex) => void;
        }
      ).setWheelLandIndex(landingIndex);
    }, index);
  }

  /**
   * Set the wheel to land on a slice with the specified multiplier
   * Finds the first slice with matching multiplier and sets it as landing index
   */
  async setWheelLandingMultiplier(multiplier: number): Promise<void> {
    const sliceIndex = await this.page.evaluate((targetMultiplier) => {
      const game = (globalThis as any).game;
      const slices = game?.wheel?._config?.slices || [];

      // Find first slice with matching multiplier
      for (let i = 0; i < slices.length; i++) {
        // Check both exact match and close enough (for floating point)
        if (Math.abs(slices[i].winMultiplier - targetMultiplier) < 0.001) {
          return i;
        }
      }

      // If not found, list available multipliers for debugging
      const available = slices
        .map((s: any, i: number) => `${i}: ${s.winMultiplier}x`)
        .join(", ");
      throw new Error(
        `No slice found with multiplier ${targetMultiplier}. Available: ${available}`
      );
    }, multiplier);

    await this.setWheelLandingIndex(sliceIndex);
  }
}
