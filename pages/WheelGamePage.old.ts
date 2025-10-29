/// <reference path="../types/global.d.ts" />
import { Page, Locator, expect } from "@playwright/test";

/**
 * Page Object Model for the Super Fun Wheel Game
 * Handles all interactions with the spinning wheel casino game
 */
export class WheelGamePage {
  readonly page: Page;

  // UI Elements
  readonly balanceDisplay: Locator;
  readonly betDisplay: Locator;
  readonly winDisplay: Locator;
  readonly spinButton: Locator;
  readonly incrementBetButton: Locator;
  readonly decrementBetButton: Locator;
  readonly autoplayButton: Locator;
  readonly quickSpinCheckbox: Locator;
  readonly wheel: Locator;
  readonly winDialog: Locator;

  constructor(page: Page) {
    this.page = page;

    // Console controls
    this.balanceDisplay = page.locator("#balance");
    this.betDisplay = page.locator("#bet-button");
    this.winDisplay = page.locator("#win");
    this.spinButton = page.locator("#spin-button");
    this.incrementBetButton = page.locator("#increment-button");
    this.decrementBetButton = page.locator("#decrement-button");
    this.autoplayButton = page.locator("#autoplay-button");
    this.quickSpinCheckbox = page.locator("#quick-spin-button");

    // Game elements
    this.wheel = page.locator("canvas"); // PixiJS canvas
    this.winDialog = page.locator('[id*="win"]'); // Win dialog container
  }

  /**
   * Navigate to the game and wait for it to load
   */
  async goto() {
    await this.page.goto("/");
    await this.waitForGameToLoad();
  }

  /**
   * Wait for the game to fully load and be ready for interaction
   */
  async waitForGameToLoad() {
    // Wait for preloader to disappear
    await this.page.waitForSelector("#preloader", {
      state: "detached",
      timeout: 30000,
    });

    // Wait for console to be visible
    await this.balanceDisplay.waitFor({ state: "visible" });
    await this.spinButton.waitFor({ state: "visible" });

    // Wait for canvas (PixiJS game) to be rendered
    await this.wheel.waitFor({ state: "visible" });

    // Small delay to ensure all animations and initialization are complete
    await this.page.waitForTimeout(1000);
  }

  /**
   * Get current balance value
   */
  async getBalance(): Promise<number> {
    const balanceText = await this.balanceDisplay.textContent();
    const match = balanceText?.match(/Balance: (\d+)/);
    return match ? Number.parseInt(match[1]) : 0;
  }

  /**
   * Get current bet value
   */
  async getBet(): Promise<number> {
    const betText = await this.betDisplay.textContent();
    const match = betText?.match(/Bet: (\d+)/);
    return match ? Number.parseInt(match[1]) : 0;
  }

  /**
   * Get current win value
   */
  async getWin(): Promise<number> {
    const winText = await this.winDisplay.textContent();
    const match = winText?.match(/Win: (\d+)/);
    return match ? Number.parseInt(match[1]) : 0;
  }

  /**
   * Click the spin button to start a game round
   */
  async spin() {
    await this.spinButton.click();
  }

  /**
   * Wait for the wheel to start spinning
   */
  async waitForWheelToStartSpinning(timeout: number = 5000): Promise<void> {
    // Use game state to detect when wheel actually starts spinning
    await this.page.waitForFunction(
      () => {
        const game = (globalThis as any).game;
        return game?.wheel?._state === "SPINNING";
      },
      { timeout }
    );
  }

  /**
   * Wait for spin to complete
   */
  async waitForSpinComplete(timeout: number = 10000): Promise<void> {
    // Wait for wheel to reach RESOLVED or IDLE state (not BREATHE, which comes before spinning)
    await this.page.waitForFunction(
      () => {
        const game = (globalThis as any).game;
        const state = game?.wheel?._state;
        return state === "RESOLVED" || state === "IDLE";
      },
      { timeout }
    );
  }

  /**
   * Check if the wheel is currently spinning
   */
  async isWheelSpinning(): Promise<boolean> {
    // Check actual game state instead of button state
    return await this.page.evaluate(() => {
      const game = (globalThis as any).game;
      if (!game?.wheel?._state) return false;

      const state = game.wheel._state;
      return state === "SPINNING" || state === "RESOLVING";
    });
  }

  /**
   * Increase bet by clicking increment button
   */
  async increaseBet() {
    await this.incrementBetButton.click();
  }

  /**
   * Decrease bet by clicking decrement button
   */
  async decreaseBet() {
    await this.decrementBetButton.click();
  }

  /**
   * Toggle autoplay mode
   */
  async toggleAutoplay() {
    await this.autoplayButton.click();
  }

  /**
   * Toggle quick spin mode
   */
  async toggleQuickSpin() {
    await this.quickSpinCheckbox.click();
  }

  /**
   * Check if quick spin is enabled
   */
  async isQuickSpinEnabled(): Promise<boolean> {
    // Check the actual game state from Constants.PLAYER_DATA
    return await this.page.evaluate(() => {
      const Constants = (globalThis as any).Constants;
      return Constants?.PLAYER_DATA?.quickSpin ?? false;
    });
  }

  /**
   * Enable quick spin if not already enabled
   */
  async enableQuickSpin(): Promise<void> {
    // Set quick spin via player data to ensure it's actually enabled
    await this.setPlayerData({ quickSpin: true });

    // Also click the UI if it's not checked
    const isEnabled = await this.isQuickSpinEnabled();
    if (!isEnabled) {
      await this.toggleQuickSpin();
    }
  }

  /**
   * Disable quick spin if currently enabled
   */
  async disableQuickSpin(): Promise<void> {
    // Set quick spin via player data to ensure it's actually disabled
    await this.setPlayerData({ quickSpin: false });

    // Also click the UI if it's checked
    const isEnabled = await this.isQuickSpinEnabled();
    if (isEnabled) {
      await this.toggleQuickSpin();
    }
  }

  /**
   * Check if autoplay is enabled
   */
  async isAutoplayEnabled(): Promise<boolean> {
    const autoplayText = await this.autoplayButton.textContent();
    return autoplayText?.includes("On") ?? false;
  }

  /**
   * Get autoplay button text
   */
  async getAutoplayText(): Promise<string> {
    const text = await this.autoplayButton.textContent();
    return text || "";
  }

  /**
   * Enable autoplay if not already enabled
   */
  async enableAutoplay(): Promise<void> {
    const isEnabled = await this.isAutoplayEnabled();
    if (!isEnabled) {
      await this.toggleAutoplay();
    }
  }

  /**
   * Disable autoplay if currently enabled
   */
  async disableAutoplay(): Promise<void> {
    const isEnabled = await this.isAutoplayEnabled();
    if (isEnabled) {
      await this.toggleAutoplay();
    }
  }

  /**
   * Wait for wheel to stop spinning (alias for waitForSpinComplete)
   */
  async waitForWheelToStop(timeout: number = 10000): Promise<void> {
    await this.waitForSpinComplete(timeout);
  }

  /**
   * Use test hook to set player data
   */
  async setPlayerData(data: {
    balance?: number;
    bet?: number;
    autoplay?: boolean;
    win?: number;
    quickSpin?: boolean;
  }) {
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
  async setWheelLandingIndex(index: number | undefined) {
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

  /**
   * Get game instance for advanced testing
   */
  async getGameInstance(): Promise<Window["game"] | undefined> {
    return await this.page.evaluate(() => {
      return (globalThis as typeof globalThis & Window).game;
    });
  }

  async getSliceCount(): Promise<number> {
    return await this.page.evaluate(() => {
      const game = (globalThis as typeof globalThis & Window).game;
      if (game?.wheel?.slices) {
        return game.wheel.slices.length;
      }
      if (game?.wheelData?.slices) {
        return game.wheelData.slices.length;
      }
      throw new Error(
        "Unable to determine wheel slice count: No slice data found"
      );
    });
  }

  /**
   * Get the index of the slice the wheel landed on
   */
  async getLandedSliceIndex(): Promise<number> {
    return await this.page.evaluate(() => {
      const game = (globalThis as any).game;
      if (!game?.wheel) {
        throw new Error("Game wheel not found");
      }

      // Get the current rotation of the wheel
      const rotation = game.wheel.container.rotation;
      const sliceCount = game.wheel._config.slices.length;
      const sliceAngle = (Math.PI * 2) / sliceCount;

      // Calculate which slice is at the top (landing position)
      // The wheel rotates and we need to find which slice is at the marker position
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
   * Wait for specific balance value
   */
  async waitForBalance(expectedBalance: number, timeout: number = 5000) {
    await expect
      .poll(
        async () => {
          return await this.getBalance();
        },
        { timeout }
      )
      .toBe(expectedBalance);
  }

  /**
   * Wait for specific win value
   */
  async waitForWin(expectedWin: number, timeout: number = 5000) {
    await expect
      .poll(
        async () => {
          return await this.getWin();
        },
        { timeout }
      )
      .toBe(expectedWin);
  }

  /**
   * Verify UI elements are visible and functional
   */
  async verifyUIElements() {
    await expect(this.balanceDisplay).toBeVisible();
    await expect(this.betDisplay).toBeVisible();
    await expect(this.winDisplay).toBeVisible();
    await expect(this.spinButton).toBeVisible();
    await expect(this.incrementBetButton).toBeVisible();
    await expect(this.decrementBetButton).toBeVisible();
    await expect(this.autoplayButton).toBeVisible();
    await expect(this.quickSpinCheckbox).toBeVisible();
    await expect(this.wheel).toBeVisible();
  }
}
