import { test, expect, Page } from "@playwright/test";
import { DataTable } from "@cucumber/cucumber";
import {
  BalanceTestingLogic,
  SliceTestData,
} from "../../logic/BalanceTestingLogic";
import { WheelGamePage } from "../../pages/WheelGamePage";
import {
  createMockPageWithEvaluate,
  createMockWheelGamePageWithData,
} from "../helpers/testMocks";

/**
 * Unit tests for BalanceTestingLogic
 * Tests slice validation, win calculations, and balance verification
 */

// Helper to create a mock DataTable
function createMockDataTable(rows: any[]): DataTable {
  return {
    hashes: () => rows,
  } as any;
}

// Helper to create BalanceTestingLogic with standard mocks for tests that don't need customization
function createLogicWithStandardMocks(spriteData?: {
  sprite: string;
  winMultiplier: number;
}): BalanceTestingLogic {
  const data = spriteData ?? { sprite: "10x.png", winMultiplier: 10 };
  const mockPage = createMockPageWithEvaluate(data) as Page;
  const mockWheelGamePage = createMockWheelGamePageWithData() as WheelGamePage;
  return new BalanceTestingLogic(mockPage, mockWheelGamePage);
}

// Helper to create BalanceTestingLogic with custom balance/win/bet scenario
function createLogicWithCustomScenario(
  spriteData: { sprite: string; winMultiplier: number },
  balance: number,
  win: number,
  bet: number
): BalanceTestingLogic {
  const mockPage = createMockPageWithEvaluate(spriteData) as Page;
  const mockWheelGamePage = {
    data: {
      getBalance: async () => balance,
      getWin: async () => win,
      getBet: async () => bet,
    },
    testHooks: {
      setWheelLandingIndex: async () => {},
    },
    spin: async () => {},
    state: {
      waitForSpinComplete: async () => {},
    },
  } as any as WheelGamePage;
  return new BalanceTestingLogic(mockPage, mockWheelGamePage);
}

test.describe("BalanceTestingLogic Unit Tests", () => {
  test.describe("extractMultiplierFromSprite", () => {
    test("should extract integer multiplier from sprite filename", () => {
      const logic = createLogicWithStandardMocks();

      const result = (logic as any).extractMultiplierFromSprite("10x.png");
      expect(result).toBe(10);
    });

    test("should extract decimal multiplier from sprite filename", () => {
      const logic = createLogicWithStandardMocks();

      const result = (logic as any).extractMultiplierFromSprite("0.5x.png");
      expect(result).toBe(0.5);
    });

    test("should return null for invalid sprite filename", () => {
      const logic = createLogicWithStandardMocks();

      const result = (logic as any).extractMultiplierFromSprite("invalid.png");
      expect(result).toBeNull();
    });

    test("should handle sprite without .png extension", () => {
      const logic = createLogicWithStandardMocks();

      const result = (logic as any).extractMultiplierFromSprite("5x");
      expect(result).toBeNull();
    });
  });

  test.describe("validateSpriteConfiguration", () => {
    test("should not add errors when all multipliers match", () => {
      const logic = createLogicWithStandardMocks();
      const errors: string[] = [];

      (logic as any).validateSpriteConfiguration(0, 10, 10, 10, errors);

      expect(errors).toHaveLength(0);
    });

    test("should add error when actual sprite doesn't match expected", () => {
      const logic = createLogicWithStandardMocks();
      const errors: string[] = [];

      (logic as any).validateSpriteConfiguration(0, 5, 10, 5, errors);

      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain("Defined expected sprite 10x but found 5x");
    });

    test("should add error when sprite doesn't match configured multiplier", () => {
      const logic = createLogicWithStandardMocks();
      const errors: string[] = [];

      (logic as any).validateSpriteConfiguration(7, 5, 5, 4, errors);

      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain("shows 5x but configured as 4x");
    });

    test("should add multiple errors when both validations fail", () => {
      const logic = createLogicWithStandardMocks();
      const errors: string[] = [];

      (logic as any).validateSpriteConfiguration(7, 5, 10, 4, errors);

      expect(errors).toHaveLength(2);
      expect(errors[0]).toContain("Defined expected sprite 10x but found 5x");
      expect(errors[1]).toContain("shows 5x but configured as 4x");
    });
  });

  test.describe("validateWinAndBalance", () => {
    test("should not add errors when win and balance are correct", () => {
      const logic = createLogicWithStandardMocks();
      const errors: string[] = [];

      // balanceBefore: 1000, bet: 100, actualWin: 200
      // expectedBalance: 1000 - 100 + 200 = 1100
      (logic as any).validateWinAndBalance(
        {
          sliceIndex: 0,
          actualSpriteMultiplier: 2,
          configuredMultiplier: 2,
          expectedWin: 200,
          actualWin: 200,
          balanceBefore: 1000,
          balanceAfter: 1100,
          errors,
        },
        100
      );

      expect(errors).toHaveLength(0);
    });

    test("should add error when actual win doesn't match expected", () => {
      const logic = createLogicWithStandardMocks();
      const errors: string[] = [];

      (logic as any).validateWinAndBalance(
        {
          sliceIndex: 0,
          actualSpriteMultiplier: 1.5,
          configuredMultiplier: 2,
          expectedWin: 200,
          actualWin: 150,
          balanceBefore: 1000,
          balanceAfter: 1050,
          errors,
        },
        100
      );

      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain("Expected win 200 but got 150");
    });

    test("should add error when balance change is incorrect", () => {
      const logic = createLogicWithStandardMocks();
      const errors: string[] = [];

      // balanceBefore: 1000, bet: 100, actualWin: 200
      // expectedBalance: 1000 - 100 + 200 = 1100, but balanceAfter is 1200
      (logic as any).validateWinAndBalance(
        {
          sliceIndex: 0,
          actualSpriteMultiplier: 2,
          configuredMultiplier: 2,
          expectedWin: 200,
          actualWin: 200,
          balanceBefore: 1000,
          balanceAfter: 1200,
          errors,
        },
        100
      );

      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain("Balance should be 1100 but is 1200");
    });

    test("should handle losing spin (zero win)", () => {
      const logic = createLogicWithStandardMocks();
      const errors: string[] = [];

      // balanceBefore: 1000, bet: 100, actualWin: 0
      // expectedBalance: 1000 - 100 + 0 = 900
      (logic as any).validateWinAndBalance(
        {
          sliceIndex: 2,
          actualSpriteMultiplier: 0,
          configuredMultiplier: 0,
          expectedWin: 0,
          actualWin: 0,
          balanceBefore: 1000,
          balanceAfter: 900,
          errors,
        },
        100
      );

      expect(errors).toHaveLength(0);
    });

    test("should handle break-even spin (1x multiplier)", () => {
      const logic = createLogicWithStandardMocks();
      const errors: string[] = [];

      // balanceBefore: 1000, bet: 100, actualWin: 100 (1x)
      // expectedBalance: 1000 - 100 + 100 = 1000
      (logic as any).validateWinAndBalance(
        {
          sliceIndex: 4,
          actualSpriteMultiplier: 1,
          configuredMultiplier: 1,
          expectedWin: 100,
          actualWin: 100,
          balanceBefore: 1000,
          balanceAfter: 1000,
          errors,
        },
        100
      );

      expect(errors).toHaveLength(0);
    });
  });

  test.describe("parseDataTableToSliceTestData", () => {
    test("should parse single row DataTable correctly", () => {
      const logic = createLogicWithStandardMocks();

      const dataTable = createMockDataTable([
        { slice_index: "0", sprite_multiplier: "10", expected_win: "1000" },
      ]);

      const result = logic.parseDataTableToSliceTestData(dataTable);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        sliceIndex: 0,
        expectedSpriteMultiplier: 10,
        expectedWin: 1000,
      });
    });

    test("should parse multiple rows DataTable correctly", () => {
      const logic = createLogicWithStandardMocks();

      const dataTable = createMockDataTable([
        { slice_index: "0", sprite_multiplier: "10", expected_win: "1000" },
        { slice_index: "1", sprite_multiplier: "5", expected_win: "500" },
        { slice_index: "2", sprite_multiplier: "0", expected_win: "0" },
      ]);

      const result = logic.parseDataTableToSliceTestData(dataTable);

      expect(result).toHaveLength(3);
      expect(result[0].sliceIndex).toBe(0);
      expect(result[1].sliceIndex).toBe(1);
      expect(result[2].sliceIndex).toBe(2);
    });

    test("should parse decimal multipliers correctly", () => {
      const logic = createLogicWithStandardMocks();

      const dataTable = createMockDataTable([
        { slice_index: "5", sprite_multiplier: "0.5", expected_win: "50" },
      ]);

      const result = logic.parseDataTableToSliceTestData(dataTable);

      expect(result[0].expectedSpriteMultiplier).toBe(0.5);
    });

    test("should handle radix correctly for parseInt", () => {
      const logic = createLogicWithStandardMocks();

      const dataTable = createMockDataTable([
        { slice_index: "08", sprite_multiplier: "10", expected_win: "0100" },
      ]);

      const result = logic.parseDataTableToSliceTestData(dataTable);

      // With radix 10, "08" should be 8, not octal
      expect(result[0].sliceIndex).toBe(8);
      expect(result[0].expectedWin).toBe(100);
    });
  });

  test.describe("validateSliceAndSpin - Success Cases", () => {
    test("should return no errors for valid slice configuration", async () => {
      const logic = createLogicWithCustomScenario(
        { sprite: "10x.png", winMultiplier: 10 },
        1900, // Balance after spin
        1000, // Win
        100 // Bet
      );

      const testData: SliceTestData = {
        sliceIndex: 0,
        expectedSpriteMultiplier: 10,
        expectedWin: 1000,
      };

      const result = await logic.validateSliceAndSpin(testData, 100, 1000);

      expect(result.errors).toHaveLength(0);
      expect(result.actualSpriteMultiplier).toBe(10);
      expect(result.actualWin).toBe(1000);
      expect(result.balanceBefore).toBe(1000);
      expect(result.balanceAfter).toBe(1900);
    });

    test("should handle zero multiplier slice", async () => {
      const logic = createLogicWithCustomScenario(
        { sprite: "0x.png", winMultiplier: 0 },
        900, // Balance after losing spin
        0, // Win
        100 // Bet
      );

      const testData: SliceTestData = {
        sliceIndex: 2,
        expectedSpriteMultiplier: 0,
        expectedWin: 0,
      };

      const result = await logic.validateSliceAndSpin(testData, 100, 1000);

      expect(result.errors).toHaveLength(0);
      expect(result.actualWin).toBe(0);
      expect(result.balanceAfter).toBe(900);
    });
  });

  test.describe("validateSliceAndSpin - Error Cases", () => {
    test("should return error for invalid sprite filename", async () => {
      const mockPage = createMockPageWithEvaluate({
        sprite: "invalid.png",
        winMultiplier: 10,
      }) as Page;

      const mockWheelGamePage = createMockWheelGamePageWithData(
        1000,
        0,
        100
      ) as WheelGamePage;
      const logic = new BalanceTestingLogic(mockPage, mockWheelGamePage);

      const testData: SliceTestData = {
        sliceIndex: 0,
        expectedSpriteMultiplier: 10,
        expectedWin: 1000,
      };

      const result = await logic.validateSliceAndSpin(testData, 100, 1000);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("Could not parse multiplier");
      expect(result.actualSpriteMultiplier).toBe(0);
    });

    test("should detect sprite mismatch (known game bug)", async () => {
      const logic = createLogicWithCustomScenario(
        { sprite: "5x.png", winMultiplier: 4 }, // Bug: shows 5x but configured as 4x
        1300, // Balance after 4x payout
        400, // 4x payout
        100 // Bet
      );

      const testData: SliceTestData = {
        sliceIndex: 7,
        expectedSpriteMultiplier: 5,
        expectedWin: 500,
      };

      const result = await logic.validateSliceAndSpin(testData, 100, 1000);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.includes("configured as 4x"))).toBe(
        true
      );
      expect(
        result.errors.some((e) => e.includes("Expected win 500 but got 400"))
      ).toBe(true);
    });
  });

  test.describe("validateAllSlices", () => {
    test("should successfully validate multiple slices without errors", async () => {
      let evaluateCallCount = 0;

      const sliceConfigs = [
        { sprite: "10x.png", winMultiplier: 10 },
        { sprite: "5x.png", winMultiplier: 5 },
      ];

      const mockPage = {
        evaluate: async () => sliceConfigs[evaluateCallCount++],
        waitForTimeout: async () => {},
      } as any as Page;

      // Start balance: 1000
      // After spin 1: 1000 - 100 + 1000 = 1900
      // After spin 2: 1900 - 100 + 500 = 2300
      let balanceCallCount = 0;
      let winCallCount = 0;

      const mockWheelGamePage = {
        data: {
          getBet: async () => 100,
          // First call in validateAllSlices gets initial 1000
          // Second call (after spin 1) gets 1900
          // Third call (after spin 2) gets 2300
          getBalance: async () => {
            const balanceValues = [1000, 1900, 2300];
            return balanceValues[balanceCallCount++];
          },
          getWin: async () => {
            const winValues = [1000, 500];
            return winValues[winCallCount++];
          },
        },
        testHooks: {
          setWheelLandingIndex: async () => {},
        },
        spin: async () => {},
        state: {
          waitForSpinComplete: async () => {},
        },
      } as any as WheelGamePage;

      const logic = new BalanceTestingLogic(mockPage, mockWheelGamePage);

      const testData: SliceTestData[] = [
        { sliceIndex: 0, expectedSpriteMultiplier: 10, expectedWin: 1000 },
        { sliceIndex: 1, expectedSpriteMultiplier: 5, expectedWin: 500 },
      ];

      await expect(logic.validateAllSlices(testData)).resolves.toBeUndefined();
    });

    test("should throw error when validation fails", async () => {
      const logic = createLogicWithCustomScenario(
        { sprite: "10x.png", winMultiplier: 10 },
        1800, // Wrong balance
        1000, // Win
        100 // Bet
      );

      const testData: SliceTestData[] = [
        { sliceIndex: 0, expectedSpriteMultiplier: 10, expectedWin: 1000 },
      ];

      await expect(logic.validateAllSlices(testData)).rejects.toThrow(
        "Found 1 error(s)"
      );
    });

    test("should accumulate errors from multiple slices", async () => {
      let evaluateCallCount = 0;

      const sliceConfigs = [
        { sprite: "10x.png", winMultiplier: 10 },
        { sprite: "5x.png", winMultiplier: 5 },
      ];

      const mockPage = {
        evaluate: async () => sliceConfigs[evaluateCallCount++],
        waitForTimeout: async () => {},
      } as any as Page;

      // Both wrong balances
      const balanceValues = [1800, 2200];
      let balanceCallCount = 0;

      const winSequence = [1000, 500];
      let winCallCount = 0;

      const mockWheelGamePage = {
        data: {
          getBalance: async () => balanceValues[balanceCallCount++],
          getWin: async () => winSequence[winCallCount++],
          getBet: async () => 100,
        },
        testHooks: {
          setWheelLandingIndex: async () => {},
        },
        spin: async () => {},
        state: {
          waitForSpinComplete: async () => {},
        },
      } as any as WheelGamePage;

      const logic = new BalanceTestingLogic(mockPage, mockWheelGamePage);

      const testData: SliceTestData[] = [
        { sliceIndex: 0, expectedSpriteMultiplier: 10, expectedWin: 1000 },
        { sliceIndex: 1, expectedSpriteMultiplier: 5, expectedWin: 500 },
      ];

      await expect(logic.validateAllSlices(testData)).rejects.toThrow(
        "Found 2 error(s)"
      );
    });
  });
});
