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
    await this.page.waitForFunction(() => {
      const game = (globalThis as any).game;
      return game?.wheel?.state?.current === 'SPINNING';
    }, { timeout });
  }

  /**
   * Wait for spin to complete
   */
  async waitForSpinComplete(timeout: number = 10000): Promise<void> {
    // Wait for wheel to reach RESOLVED or IDLE state
    await this.page.waitForFunction(() => {
      const game = (globalThis as any).game;
      const state = game?.wheel?.state?.current;
      return state === 'RESOLVED' || state === 'IDLE';
    }, { timeout });
  }

  /**
   * Check if the wheel is currently spinning
   */
  async isWheelSpinning(): Promise<boolean> {
    // Check actual game state instead of button state
    return await this.page.evaluate(() => {
      const game = (globalThis as any).game;
      if (!game?.wheel?.state) return false;
      
      const state = game.wheel.state.current;
      return state === 'SPINNING' || state === 'RESOLVING';
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
    // Try multiple methods to detect quick spin state
    try {
      // Method 1: Check if it's a checkbox
      return await this.quickSpinCheckbox.isChecked();
    } catch {
      try {
        // Method 2: Check for active/checked class
        const classList = await this.quickSpinCheckbox.getAttribute("class");
        if (classList?.includes("active") || classList?.includes("checked")) {
          return true;
        }
      } catch {
        // Ignore
      }

      try {
        // Method 3: Check data attribute
        const dataState = await this.quickSpinCheckbox.getAttribute(
          "data-state"
        );
        return dataState === "active" || dataState === "on";
      } catch {
        // Ignore
      }

      // Default: assume disabled if we can't determine
      return false;
    }
  }

  /**
   * Enable quick spin if not already enabled
   */
  async enableQuickSpin(): Promise<void> {
    const isEnabled = await this.isQuickSpinEnabled();
    if (!isEnabled) {
      await this.toggleQuickSpin();
    }
  }

  /**
   * Disable quick spin if currently enabled
   */
  async disableQuickSpin(): Promise<void> {
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
   * Get game instance for advanced testing
   */
  async getGameInstance(): Promise<Window["game"] | undefined> {
    return await this.page.evaluate(() => {
      return (globalThis as typeof globalThis & Window).game;
    });
  }

  /**
   * Get the number of slices on the wheel
   */
  async getSliceCount(): Promise<number> {
    return await this.page.evaluate(() => {
      const game = (globalThis as typeof globalThis & Window).game;
      // Try to get slice count from game configuration or wheel data
      if (game?.wheel?.slices) {
        return game.wheel.slices.length;
      }
      if (game?.wheelData?.slices) {
        return game.wheelData.slices.length;
      }
      // Default to 8 if we can't find it
      return 8;
    });
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
