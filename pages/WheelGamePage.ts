import { Page, expect } from "@playwright/test";
import { WheelGameLocators } from "./WheelGameLocators";
import { WheelGameDataReader } from "./WheelGameDataReader";
import { WheelGameState } from "./WheelGameState";
import { WheelGameTestHooks } from "./WheelGameTestHooks";

/**
 * Page Object Model for the Super Fun Wheel Game
 * Coordinates interactions between different game concerns using composition
 * Following Single Responsibility Principle
 *
 * Use WheelGamePage.builder() or WheelGamePage.create() for construction
 */
export class WheelGamePage {
  readonly page: Page;

  // Composed responsibilities (injected via constructor)
  readonly locators: WheelGameLocators;
  readonly data: WheelGameDataReader;
  readonly state: WheelGameState;
  readonly testHooks: WheelGameTestHooks;

  /**
   * Private constructor with dependency injection
   * Use WheelGamePage.builder() or WheelGamePage.create() to construct instances
   * @private - Enforces use of builder pattern or factory method
   */
  private constructor(
    page: Page,
    locators: WheelGameLocators,
    data: WheelGameDataReader,
    state: WheelGameState,
    testHooks: WheelGameTestHooks
  ) {
    this.page = page;
    this.locators = locators;
    this.data = data;
    this.state = state;
    this.testHooks = testHooks;
  }

  /**
   * Create a new builder for constructing WheelGamePage with dependency injection
   */
  static builder(): WheelGamePageBuilder {
    return new WheelGamePageBuilder();
  }

  /**
   * Convenience factory method for standard usage
   * For custom dependencies, use WheelGamePage.builder()
   */
  static create(page: Page): WheelGamePage {
    return WheelGamePage.builder().withPage(page).build();
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
   * Spin the wheel and wait for completion
   * Convenience method combining spin() and waitForSpinComplete()
   * @param timeout - Optional timeout for spin completion (default: 30000ms)
   */
  async spinAndWait(timeout?: number): Promise<void> {
    await this.spin();
    await this.state.waitForSpinComplete(timeout);
  }

  /**
   * Spin the wheel multiple times with wait between each
   * @param count - Number of spins to perform
   * @param timeout - Optional timeout for each spin completion
   */
  async spinMultiple(count: number, timeout?: number): Promise<void> {
    for (let i = 0; i < count; i++) {
      await this.spinAndWait(timeout);
    }
  }

  /**
   * Spin and verify balance calculation is correct
   * Formula: newBalance = oldBalance - bet + win
   * @throws AssertionError if balance calculation is incorrect
   */
  async spinAndVerifyBalance(): Promise<void> {
    const beforeData = await this.data.getCoreData();

    await this.spin();
    await this.state.waitForSpinComplete();

    const afterData = await this.data.getCoreData();
    const expectedBalance = beforeData.balance - beforeData.bet + afterData.win;

    if (afterData.balance !== expectedBalance) {
      throw new Error(
        `Balance calculation incorrect: expected ${expectedBalance} (${beforeData.balance} - ${beforeData.bet} + ${afterData.win}), got ${afterData.balance}`
      );
    }
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
    await this.locators.quickSpinCheckbox.waitFor({ state: "visible" });
    await this.locators.quickSpinCheckbox.click();
    await this.page.waitForTimeout(200); // Wait for state to update
  }

  /**
   * Set quick spin mode to a specific state
   */
  async setQuickSpin(enabled: boolean): Promise<void> {
    await this.testHooks.setPlayerData({ quickSpin: enabled });
    await this.page.waitForTimeout(100); // Give the game time to process the test hook

    const isEnabled = await this.state.isQuickSpinEnabled();

    if (isEnabled !== enabled) {
      await this.toggleQuickSpin();
    }
  }

  /**
   * Enable quick spin if not already enabled
   */
  async enableQuickSpin(): Promise<void> {
    await this.setQuickSpin(true);
  }

  /**
   * Disable quick spin if currently enabled
   */
  async disableQuickSpin(): Promise<void> {
    await this.setQuickSpin(false);
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

  /**
   * Get the current wheel state
   * @returns The current state of the wheel (IDLE, SPINNING, RESOLVING, etc.)
   */
  async getWheelState(): Promise<string> {
    return await this.page.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const game = (globalThis as any).game;
      return game?.wheel?._state || "";
    });
  }
}

/**
 * Builder for constructing WheelGamePage with dependency injection
 * Allows injecting custom implementations for testing while providing sensible defaults
 *
 * Access via WheelGamePage.builder()
 */
export class WheelGamePageBuilder {
  private page?: Page;
  private locators?: WheelGameLocators;
  private data?: WheelGameDataReader;
  private state?: WheelGameState;
  private testHooks?: WheelGameTestHooks;

  /**
   * Set the Playwright page instance
   */
  withPage(page: Page): this {
    this.page = page;
    return this;
  }

  /**
   * Inject custom locators implementation (useful for mocking)
   */
  withLocators(locators: WheelGameLocators): this {
    this.locators = locators;
    return this;
  }

  /**
   * Inject custom data reader implementation (useful for mocking)
   */
  withDataReader(data: WheelGameDataReader): this {
    this.data = data;
    return this;
  }

  /**
   * Inject custom state handler implementation (useful for mocking)
   */
  withStateHandler(state: WheelGameState): this {
    this.state = state;
    return this;
  }

  /**
   * Inject custom test hooks implementation (useful for mocking)
   */
  withTestHooks(testHooks: WheelGameTestHooks): this {
    this.testHooks = testHooks;
    return this;
  }

  /**
   * Build the WheelGamePage with provided or default dependencies
   */
  build(): WheelGamePage {
    if (!this.page) {
      throw new Error("Page is required. Call withPage() before build()");
    }

    // Create default implementations if not provided
    // (dependency injection with defaults)
    const locators = this.locators ?? new WheelGameLocators(this.page);
    const data = this.data ?? new WheelGameDataReader(locators);
    const state = this.state ?? new WheelGameState(this.page, locators);
    const testHooks = this.testHooks ?? new WheelGameTestHooks(this.page);

    // Use Reflect.construct to access private constructor
    return Reflect.construct(WheelGamePage, [
      this.page,
      locators,
      data,
      state,
      testHooks,
    ]) as WheelGamePage;
  }
}
