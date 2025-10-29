import { test, expect } from "@playwright/test";
import { WheelGamePage } from "../pages/WheelGamePage";
import { GameConstants } from "../utils/testUtils";

test.describe("Game Initialization and UI", () => {
  let gamePage: WheelGamePage;

  test.beforeEach(async ({ page }) => {
    // Using the Builder Pattern for dependency injection
    gamePage = WheelGamePage.builder().withPage(page).build();

    // Or use the convenience factory method (same result):
    // gamePage = WheelGamePage.create(page);

    await gamePage.goto();
  });

  test("should load the game successfully", async () => {
    // Verify all UI elements are visible
    await gamePage.verifyUIElements();

    // Verify initial values
    expect(await gamePage.data.getBalance()).toBe(
      GameConstants.DEFAULT_BALANCE
    );
    expect(await gamePage.data.getBet()).toBe(GameConstants.DEFAULT_BET);
    expect(await gamePage.data.getWin()).toBe(0);
    expect(await gamePage.data.isAutoplayEnabled()).toBe(false);
  });

  test("should display correct initial player data", async () => {
    const balance = await gamePage.data.getBalance();
    const bet = await gamePage.data.getBet();
    const win = await gamePage.data.getWin();

    expect(balance).toBe(1000);
    expect(bet).toBe(10);
    expect(win).toBe(0);
  });

  test("should have functional canvas for game rendering", async () => {
    // Verify PixiJS canvas is present and visible
    await expect(gamePage.locators.wheel).toBeVisible();

    // Check canvas has reasonable dimensions
    const canvasBox = await gamePage.locators.wheel.boundingBox();
    expect(canvasBox).toBeTruthy();
    if (canvasBox) {
      expect(canvasBox.width).toBeGreaterThan(400);
      expect(canvasBox.height).toBeGreaterThan(300);
    }
  });

  test("should expose test hooks on window object", async () => {
    const hasTestHooks = await gamePage.page.evaluate(() => {
      return (
        typeof (globalThis as typeof globalThis & Window).setPlayerData ===
          "function" &&
        typeof (globalThis as typeof globalThis & Window).setWheelLandIndex ===
          "function" &&
        typeof (globalThis as typeof globalThis & Window).game === "object"
      );
    });

    expect(hasTestHooks).toBe(true);
  });
});
