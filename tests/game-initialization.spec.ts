import { test, expect } from "@playwright/test";
import { WheelGamePage } from "../pages/WheelGamePage";
import { GameConstants } from "../utils/testUtils";

test.describe("Game Initialization and UI", () => {
  let gamePage: WheelGamePage;

  test.beforeEach(async ({ page }) => {
    gamePage = new WheelGamePage(page);
    await gamePage.goto();
  });

  test("should load the game successfully", async () => {
    // Verify all UI elements are visible
    await gamePage.verifyUIElements();

    // Verify initial values
    expect(await gamePage.getBalance()).toBe(GameConstants.DEFAULT_BALANCE);
    expect(await gamePage.getBet()).toBe(GameConstants.DEFAULT_BET);
    expect(await gamePage.getWin()).toBe(0);
    expect(await gamePage.isAutoplayEnabled()).toBe(false);
  });

  test("should display correct initial player data", async () => {
    const balance = await gamePage.getBalance();
    const bet = await gamePage.getBet();
    const win = await gamePage.getWin();

    expect(balance).toBe(1000);
    expect(bet).toBe(10);
    expect(win).toBe(0);
  });

  test("should have functional canvas for game rendering", async () => {
    // Verify PixiJS canvas is present and visible
    await expect(gamePage.wheel).toBeVisible();

    // Check canvas has reasonable dimensions
    const canvasBox = await gamePage.wheel.boundingBox();
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
