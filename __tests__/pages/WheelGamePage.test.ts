import { test, expect } from "@playwright/test";
import { WheelGamePage } from "../../pages/WheelGamePage";
import {
  createMockPage,
  createMockLocators,
  createMockDataReader,
} from "../helpers/testMocks";

/**
 * Unit tests for WheelGamePage
 * Tests the page object model's builder pattern and dependency injection
 * These are true unit tests - no browser interactions, pure logic testing
 */

test.describe("WheelGamePage Unit Tests", () => {
  test.describe("Builder Pattern", () => {
    test("should throw error if page is not provided to builder", () => {
      expect(() => {
        WheelGamePage.builder().build();
      }).toThrow("Page is required");
    });

    test("should create instance via builder with mock page", () => {
      const mockPage = createMockPage();

      const gamePage = WheelGamePage.builder()
        .withPage(mockPage as any)
        .build();

      expect(gamePage).toBeDefined();
      expect(gamePage.page).toBe(mockPage);
      expect(gamePage.locators).toBeDefined();
      expect(gamePage.data).toBeDefined();
      expect(gamePage.state).toBeDefined();
      expect(gamePage.testHooks).toBeDefined();
    });

    test("should create instance via factory method", () => {
      const mockPage = createMockPage();

      const gamePage = WheelGamePage.create(mockPage as any);

      expect(gamePage).toBeDefined();
      expect(gamePage.page).toBe(mockPage);
    });

    test("should allow injecting custom data reader", () => {
      const mockPage = createMockPage();
      const customDataReader = createMockDataReader();

      const gamePage = WheelGamePage.builder()
        .withPage(mockPage as any)
        .withDataReader(customDataReader as any)
        .build();

      expect(gamePage.data).toBe(customDataReader);
    });

    test("should allow injecting multiple custom dependencies", () => {
      const mockPage = createMockPage();
      const customLocators = createMockLocators();
      const customDataReader = createMockDataReader();

      const gamePage = WheelGamePage.builder()
        .withPage(mockPage as any)
        .withLocators(customLocators as any)
        .withDataReader(customDataReader as any)
        .build();

      expect(gamePage.locators).toBe(customLocators);
      expect(gamePage.data).toBe(customDataReader);
      expect(gamePage.state).toBeDefined();
      expect(gamePage.testHooks).toBeDefined();
    });

    test("should support fluent builder API in any order", () => {
      const mockPage = createMockPage();
      const customLocators = createMockLocators();

      // Order 1: page first
      const gamePage1 = WheelGamePage.builder()
        .withPage(mockPage as any)
        .withLocators(customLocators as any)
        .build();

      // Order 2: locators first
      const gamePage2 = WheelGamePage.builder()
        .withLocators(customLocators as any)
        .withPage(mockPage as any)
        .build();

      expect(gamePage1).toBeDefined();
      expect(gamePage2).toBeDefined();
    });
  });

  test.describe("Dependency Injection", () => {
    test("should use injected data reader for method calls", async () => {
      const mockPage = createMockPage();
      const mockDataReader = {
        getBalance: async () => 9999,
        getBet: async () => 777,
        getWin: async () => 5000,
        isAutoplayEnabled: async () => false,
        getAutoplayText: async () => "Off",
      };

      const gamePage = WheelGamePage.builder()
        .withPage(mockPage as any)
        .withDataReader(mockDataReader as any)
        .build();

      const balance = await gamePage.data.getBalance();
      const bet = await gamePage.data.getBet();
      const win = await gamePage.data.getWin();

      expect(balance).toBe(9999);
      expect(bet).toBe(777);
      expect(win).toBe(5000);
    });

    test("should use injected test hooks for method calls", async () => {
      const mockPage = createMockPage();
      let capturedData: any = null;

      const mockHooks = {
        setPlayerData: async (data: any) => {
          capturedData = data;
        },
        setWheelLandingIndex: async (index?: number) => {},
        getGameInstance: async () => ({}),
      };

      const gamePage = WheelGamePage.builder()
        .withPage(mockPage as any)
        .withTestHooks(mockHooks as any)
        .build();

      await gamePage.testHooks.setPlayerData({ balance: 5000 });

      expect(capturedData).toEqual({ balance: 5000 });
    });
  });

  test.describe("Composition Pattern", () => {
    test("should expose all composed dependencies as properties", () => {
      const mockPage = createMockPage();

      const gamePage = WheelGamePage.builder()
        .withPage(mockPage as any)
        .build();

      expect(gamePage.page).toBeDefined();
      expect(gamePage.locators).toBeDefined();
      expect(gamePage.data).toBeDefined();
      expect(gamePage.state).toBeDefined();
      expect(gamePage.testHooks).toBeDefined();
    });

    test("should use new explicit API pattern", () => {
      const mockPage = createMockPage();

      const gamePage = WheelGamePage.builder()
        .withPage(mockPage as any)
        .build();

      // Verify new API structure (data.*, state.*, testHooks.*, locators.*)
      expect(typeof gamePage.data.getBalance).toBe("function");
      expect(typeof gamePage.state.isSpinning).toBe("function");
      expect(typeof gamePage.testHooks.setPlayerData).toBe("function");
      expect(gamePage.locators.spinButton).toBeDefined();
    });
  });
});
