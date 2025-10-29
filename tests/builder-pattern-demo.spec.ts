import { test, expect } from "@playwright/test";
import { WheelGamePage, WheelGamePageBuilder } from "../pages/WheelGamePage";
import { WheelGameLocators } from "../pages/WheelGameLocators";
import { WheelGameDataReader } from "../pages/WheelGameDataReader";

/**
 * Demonstration of Builder Pattern with Dependency Injection
 * Shows how to inject mock/stub implementations for isolated testing
 */
test.describe("Builder Pattern Demo", () => {
  test("Standard usage - all real dependencies", async ({ page }) => {
    // Builder with default implementations (real browser interactions)
    const gamePage = new WheelGamePageBuilder().withPage(page).build();

    await gamePage.goto();

    const balance = await gamePage.data.getBalance();
    expect(balance).toBeGreaterThan(0);
  });

  test("Factory method - convenience wrapper", async ({ page }) => {
    // Same as builder, but more concise
    const gamePage = WheelGamePage.create(page);

    await gamePage.goto();

    const bet = await gamePage.data.getBet();
    expect(bet).toBeGreaterThan(0);
  });

  test("Mock data reader - inject custom implementation", async ({ page }) => {
    // Create a mock data reader that returns fixed values
    class MockDataReader extends WheelGameDataReader {
      async getBalance(): Promise<number> {
        return 9999; // Fixed mock value
      }

      async getBet(): Promise<number> {
        return 777; // Fixed mock value
      }

      async getWin(): Promise<number> {
        return 1000000; // Fixed mock value
      }
    }

    const locators = new WheelGameLocators(page);
    const mockDataReader = new MockDataReader(locators);

    // Inject the mock data reader
    const gamePage = new WheelGamePageBuilder()
      .withPage(page)
      .withDataReader(mockDataReader)
      .build();

    // Data comes from mock, not real browser
    const balance = await gamePage.data.getBalance();
    const bet = await gamePage.data.getBet();
    const win = await gamePage.data.getWin();

    expect(balance).toBe(9999);
    expect(bet).toBe(777);
    expect(win).toBe(1000000);
  });

  test("Partial mocking - mix real and mock dependencies", async ({ page }) => {
    // Create a mock test hooks that logs but doesn't actually set data
    class SpyTestHooks {
      private calls: string[] = [];

      constructor(private page: any) {}

      async setPlayerData(data: any): Promise<void> {
        this.calls.push(`setPlayerData: ${JSON.stringify(data)}`);
        console.log(`🕵️ Spy: setPlayerData called with`, data);
        // Don't actually set data - just spy on calls
      }

      async setWheelLandingIndex(index?: number): Promise<void> {
        this.calls.push(`setWheelLandingIndex: ${index}`);
        console.log(`🕵️ Spy: setWheelLandingIndex called with`, index);
      }

      getCalls(): string[] {
        return this.calls;
      }
    }

    const spyHooks = new SpyTestHooks(page) as any;

    // Mix real locators/data with spy test hooks
    const gamePage = new WheelGamePageBuilder()
      .withPage(page)
      .withTestHooks(spyHooks)
      .build();

    await gamePage.goto();

    // Call methods that use test hooks
    await gamePage.testHooks.setPlayerData({ balance: 5000 });
    await gamePage.testHooks.setWheelLandingIndex(7);

    // Verify spy captured calls
    const calls = spyHooks.getCalls();
    expect(calls).toHaveLength(2);
    expect(calls[0]).toContain("balance");
    expect(calls[1]).toContain("7");
  });

  test("Fluent builder syntax - chain multiple overrides", async ({ page }) => {
    // Demonstrate fluent API - order doesn't matter
    const gamePage1 = new WheelGamePageBuilder()
      .withPage(page)
      .withTestHooks({} as any)
      .withDataReader({} as any)
      .build();

    const gamePage2 = new WheelGamePageBuilder()
      .withDataReader({} as any)
      .withTestHooks({} as any)
      .withPage(page)
      .build();

    // Both work equally well - order is flexible
    expect(gamePage1).toBeDefined();
    expect(gamePage2).toBeDefined();
  });

  test("Error handling - page is required", async () => {
    // Builder validates required dependencies
    expect(() => {
      new WheelGamePageBuilder().build();
    }).toThrow("Page is required");
  });
});
