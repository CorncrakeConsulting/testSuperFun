import { Page, Locator } from "@playwright/test";

/**
 * UI Element Locators for the Wheel Game
 * Single Responsibility: Define and provide access to UI element selectors
 */
export class WheelGameLocators {
  // Console controls
  readonly balanceDisplay: Locator;
  readonly betDisplay: Locator;
  readonly winDisplay: Locator;
  readonly spinButton: Locator;
  readonly incrementBetButton: Locator;
  readonly decrementBetButton: Locator;
  readonly autoplayButton: Locator;
  readonly quickSpinCheckbox: Locator;

  // Game elements
  readonly wheel: Locator;
  readonly winDialog: Locator;

  constructor(page: Page) {
    // Console controls - use ID throughout
    this.balanceDisplay = page.locator("#balance");
    this.betDisplay = page.locator("#bet-button");
    this.winDisplay = page.locator("#win");
    this.spinButton = page.locator("#spin-button");
    this.incrementBetButton = page.locator("#increment-button");
    this.decrementBetButton = page.locator("#decrement-button");
    this.autoplayButton = page.locator("#autoplay-button");
    this.quickSpinCheckbox = page.locator("#quick-spin-button button");

    // Game elements
    this.wheel = page.locator("canvas"); // PixiJS canvas
    this.winDialog = page.locator('[id*="win"]'); // Win dialog container
  }
}
