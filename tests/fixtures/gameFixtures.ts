/**
 * Playwright Test Fixtures for Wheel Game
 * Provides automatic setup and teardown for game page instances
 *
 * Usage:
 * import { test, expect } from './fixtures/gameFixtures';
 *
 * test("my test", async ({ gamePage }) => {
 *   // gamePage is automatically initialized and ready to use
 * });
 */

import { test as base } from "@playwright/test";
import { WheelGamePage } from "../../pages/WheelGamePage";

type GameFixtures = {
  gamePage: WheelGamePage;
};

export const test = base.extend<GameFixtures>({
  gamePage: async ({ page }, use) => {
    // Setup: Create and initialize game page
    const gamePage = WheelGamePage.create(page);
    await gamePage.goto();

    // Provide to test
    await use(gamePage);

    // Teardown happens automatically via Playwright
  },
});

export { expect } from "@playwright/test";
