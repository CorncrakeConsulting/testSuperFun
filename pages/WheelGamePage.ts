/// <reference path="../types/global.d.ts" />
import { Page, expect } from "@playwright/test";
import { WheelGameLocators } from "./WheelGameLocators";
import { WheelGameDataReader } from "./WheelGameDataReader";
import { WheelGameState } from "./WheelGameState";
import { WheelGameTestHooks } from "./WheelGameTestHooks";

/**
 * Page Object Model for the Super Fun Wheel Game
 * Coordinates interactions between different game concerns using composition
 * Following Single Responsibility Principle
 */
export class WheelGamePage {
  readonly page: Page;

  // Composed responsibilities
  readonly locators: WheelGameLocators;
  readonly data: WheelGameDataReader;
  readonly state: WheelGameState;
  readonly testHooks: WheelGameTestHooks;

  constructor(page: Page) {
    this.page = page;

    // Initialize composed classes
    this.locators = new WheelGameLocators(page);
    this.data = new WheelGameDataReader(this.locators);
    this.state = new WheelGameState(page, this.locators);
    this.testHooks = new WheelGameTestHooks(page);
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
    await this.page.waitForSelector("#preloader", {
      state: "detached",
      timeout: 30000,
    });

    await this.locators.balanceDisplay.waitFor({ state: "visible" });
    await this.locators.spinButton.waitFor({ state: "visible" });
    await this.locators.wheel.waitFor({ state: "visible" });

    await this.page.waitForTimeout(1000);
  }

  /**
   * Click the spin button to start a game round
   */
  async spin() {
    await this.locators.spinButton.click();
  }

  /**
   * Increase bet by clicking increment button
   */
  async increaseBet() {
    await this.locators.incrementBetButton.click();
  }

  /**
   * Decrease bet by clicking decrement button
   */
  async decreaseBet() {
    await this.locators.decrementBetButton.click();
  }

  /**
   * Toggle autoplay mode
   */
  async toggleAutoplay() {
    await this.locators.autoplayButton.click();
  }

  /**
   * Toggle quick spin mode
   */
  async toggleQuickSpin() {
    await this.locators.quickSpinCheckbox.click();
  }

  /**
   * Enable quick spin if not already enabled
   */
  async enableQuickSpin(): Promise<void> {
    await this.testHooks.setPlayerData({ quickSpin: true });

    const isEnabled = await this.state.isQuickSpinEnabled();
    if (!isEnabled) {
      await this.toggleQuickSpin();
    }
  }

  /**
   * Disable quick spin if currently enabled
   */
  async disableQuickSpin(): Promise<void> {
    await this.testHooks.setPlayerData({ quickSpin: false });

    const isEnabled = await this.state.isQuickSpinEnabled();
    if (isEnabled) {
      await this.toggleQuickSpin();
    }
  }

  /**
   * Enable autoplay if not already enabled
   */
  async enableAutoplay(): Promise<void> {
    const isEnabled = await this.data.isAutoplayEnabled();
    if (!isEnabled) {
      await this.toggleAutoplay();
    }
  }

  /**
   * Disable autoplay if currently enabled
   */
  async disableAutoplay(): Promise<void> {
    const isEnabled = await this.data.isAutoplayEnabled();
    if (isEnabled) {
      await this.toggleAutoplay();
    }
  }

  /**
   * Wait for specific balance value
   */
  async waitForBalance(expectedBalance: number, timeout: number = 5000) {
    await expect
      .poll(
        async () => {
          return await this.data.getBalance();
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
          return await this.data.getWin();
        },
        { timeout }
      )
      .toBe(expectedWin);
  }

  /**
   * Verify UI elements are visible and functional
   */
  async verifyUIElements() {
    await expect(this.locators.balanceDisplay).toBeVisible();
    await expect(this.locators.betDisplay).toBeVisible();
    await expect(this.locators.winDisplay).toBeVisible();
    await expect(this.locators.spinButton).toBeVisible();
    await expect(this.locators.incrementBetButton).toBeVisible();
    await expect(this.locators.decrementBetButton).toBeVisible();
    await expect(this.locators.autoplayButton).toBeVisible();
    await expect(this.locators.quickSpinCheckbox).toBeVisible();
    await expect(this.locators.wheel).toBeVisible();
  }

  // Convenience methods - delegate to composed classes for backward compatibility
  async getBalance() {
    return this.data.getBalance();
  }
  async getBet() {
    return this.data.getBet();
  }
  async getWin() {
    return this.data.getWin();
  }
  async isAutoplayEnabled() {
    return this.data.isAutoplayEnabled();
  }
  async getAutoplayText() {
    return this.data.getAutoplayText();
  }

  async isWheelSpinning() {
    return this.state.isSpinning();
  }
  async waitForWheelToStartSpinning(timeout?: number) {
    return this.state.waitForWheelToStartSpinning(timeout);
  }
  async waitForSpinComplete(timeout?: number) {
    return this.state.waitForSpinComplete(timeout);
  }
  async waitForWheelToStop(timeout?: number) {
    return this.state.waitForWheelToStop(timeout);
  }
  async isQuickSpinEnabled() {
    return this.state.isQuickSpinEnabled();
  }
  async getSliceCount() {
    return this.state.getSliceCount();
  }
  async getLandedSliceIndex() {
    return this.state.getLandedSliceIndex();
  }
  async getSliceConfiguration(sliceIndex: number) {
    return this.state.getSliceConfiguration(sliceIndex);
  }
  async getGameInstance() {
    return this.state.getGameInstance();
  }

  async setPlayerData(data: Parameters<typeof this.testHooks.setPlayerData>[0]) {
    return this.testHooks.setPlayerData(data);
  }
  async setWheelLandingIndex(index: number | undefined) {
    return this.testHooks.setWheelLandingIndex(index);
  }
  async setWheelLandingMultiplier(multiplier: number) {
    return this.testHooks.setWheelLandingMultiplier(multiplier);
  }
}
