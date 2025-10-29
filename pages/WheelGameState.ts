import { Page } from "@playwright/test";
import { WheelGameLocators } from "./WheelGameLocators";
import { WheelState } from "../types/WheelState";

/**
 * Game State Manager for the Wheel Game
 * Single Responsibility: Query and wait for game state changes
 */
export class WheelGameState {
  constructor(
    private readonly page: Page,
    private readonly locators: WheelGameLocators
  ) {}

  /**
   * Check if the wheel is currently spinning
   */
  async isSpinning(): Promise<boolean> {
    return await this.page.evaluate(
      ([spinning, resolving]) => {
        const game = (globalThis as any).game;
        //no state => not spinning
        if (!game?.wheel?._state) return false;
        const state = game.wheel._state;
        return state === spinning || state === resolving;
      },
      [WheelState.Spinning, WheelState.Resolving]
    );
  }

  /**
   * Wait for the wheel to start spinning
   */
  async waitForWheelToStartSpinning(timeout: number = 5000): Promise<void> {
    await this.page.waitForFunction(
      (spinning) => {
        const game = (globalThis as any).game;
        return game?.wheel?._state === spinning;
      },
      WheelState.Spinning,
      { timeout }
    );
  }

  /**
   * Wait for spin to complete
   */
  async waitForSpinComplete(timeout: number = 10000): Promise<void> {
    await this.page.waitForFunction(
      ([resolved, idle]) => {
        const game = (globalThis as any).game;
        const state = game?.wheel?._state;
        return state === resolved || state === idle;
      },
      [WheelState.Resolved, WheelState.Idle],
      { timeout }
    );
  }

  /**
   * Wait for wheel to stop spinning (alias for waitForSpinComplete)
   */
  async waitForWheelToStop(timeout: number = 10000): Promise<void> {
    await this.waitForSpinComplete(timeout);
  }

  /**
   * Check if quick spin is enabled
   * Since Constants.PLAYER_DATA is not exposed globally, we check the checkbox button's image
   */
  async isQuickSpinEnabled(): Promise<boolean> {
    // Check if the checkbox shows the checked image
    const isChecked = await this.page.evaluate(() => {
      const quickSpinDiv = document.querySelector("#quick-spin-button");
      const button = quickSpinDiv?.querySelector("button");
      const img = button?.querySelector("img");
      const imgSrc = img?.getAttribute("src") || "";

      // The checked state shows "checked_box.png", unchecked shows "box.png"
      return imgSrc.includes("checked_box.png");
    });

    return isChecked;
  }

  /**
   * Get the number of slices on the wheel
   */
  async getSliceCount(): Promise<number> {
    return await this.page.evaluate(() => {
      const game = (globalThis as any).game;
      if (game?.wheel?.slices) {
        return game.wheel.slices.length;
      }
      if (game?.wheelData?.slices) {
        return game.wheelData.slices.length;
      }
      return 8;
    });
  }

  /**
   * Get the index of the slice the wheel landed on
   */
  /*
    When the spin completes, there's no stored property for "which slice did we land on". 
    So tests must reverse-engineer it from the rotation angle.
  */
  async getLandedSliceIndex(): Promise<number> {
    return await this.page.evaluate(() => {
      const game = (globalThis as any).game;
      if (!game?.wheel) {
        throw new Error("Game wheel not found");
      }

      const rotation = game.wheel.container.rotation;
      const sliceCount = game.wheel._config.slices.length;
      const sliceAngle = (Math.PI * 2) / sliceCount;

      const normalizedRotation = rotation % (Math.PI * 2);
      const sliceIndex = Math.floor(normalizedRotation / sliceAngle);

      return sliceIndex;
    });
  }

  /**
   * Get the configuration of a specific slice including sprite and multiplier
   */
  async getSliceConfiguration(
    sliceIndex: number
  ): Promise<{ sprite: string; winMultiplier: number }> {
    return await this.page.evaluate((idx) => {
      const game = (globalThis as any).game;
      const slice = game.wheel._config.slices[idx];
      return {
        sprite: slice.sprite,
        winMultiplier: slice.winMultiplier,
      };
    }, sliceIndex);
  }

  /**
   * Get game instance for advanced testing
   */
  async getGameInstance(): Promise<Window["game"] | undefined> {
    return await this.page.evaluate(() => {
      return (globalThis as any).game;
    });
  }
}
