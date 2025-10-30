import { Page } from "@playwright/test";
import { WheelGameLocators } from "./WheelGameLocators";
import { WheelState } from "../types/WheelState";
import { GameWindow } from "../utils/windowHelpers";

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
      (states: [string, string]) => {
        const [spinning, resolving] = states;
        const game = (globalThis as unknown as GameWindow).game;
        //no state => not spinning
        if (!game?.wheel?._state) return false;
        const state = game.wheel._state;
        return state === spinning || state === resolving;
      },
      [WheelState.Spinning, WheelState.Resolving] as [string, string]
    );
  }

  /**
   * Wait for spin to complete
   */
  async waitForSpinComplete(timeout: number = 10000): Promise<void> {
    await this.page.waitForFunction(
      ([resolved, idle]) => {
        const game = (globalThis as unknown as GameWindow).game;
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
    return await this.page.evaluate(() => {
      const quickSpinDiv = document.querySelector("#quick-spin-button");
      const button = quickSpinDiv?.querySelector("button");
      const img = button?.querySelector("img");
      const imgSrc = img?.getAttribute("src") || "";

      // The checked state shows "checked_box.png", unchecked shows "box.png"
      return imgSrc.includes("checked_box.png");
    });
  }

  /**
   * Get the number of slices on the wheel
   */
  async getSliceCount(): Promise<number> {
    return await this.page.evaluate(() => {
      const game = (globalThis as unknown as GameWindow).game;
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
      const game = (globalThis as unknown as GameWindow).game;
      if (!game?.wheel) {
        throw new Error("Game wheel not found");
      }

      const wheel = game.wheel;
      const rotation = wheel.container?.rotation ?? 0;
      const sliceCount = wheel._config?.slices?.length ?? 8;
      const sliceAngle = (Math.PI * 2) / sliceCount;

      const normalizedRotation = rotation % (Math.PI * 2);
      return Math.floor(normalizedRotation / sliceAngle);
    });
  }

  /**
   * Get game instance for advanced testing
   */
  async getGameInstance(): Promise<GameWindow["game"] | undefined> {
    return await this.page.evaluate(() => {
      return (globalThis as unknown as GameWindow).game;
    });
  }
}
