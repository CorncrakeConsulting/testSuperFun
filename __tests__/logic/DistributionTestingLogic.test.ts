import { test, expect } from "@playwright/test";
import {
  DistributionTestingLogic,
  DistributionData,
} from "../../logic/DistributionTestingLogic";
import { CustomWorld } from "../../tests/support/world";
import { WheelGamePage } from "../../pages/WheelGamePage";

// Mock helper to create a CustomWorld
function createMockWorld(): CustomWorld {
  const mockWheelGamePage = {
    data: {
      getBet: async () => 10,
      getWin: async () => 100,
      getBalance: async () => 1000,
    },
    state: {
      isQuickSpinEnabled: async () => false,
      getLandedSliceIndex: async () => 0,
      waitForWheelToStop: async () => {},
    },
    testHooks: {
      setPlayerData: async () => {},
      setWheelLandingIndex: async () => ({ success: true }),
    },
    spin: async () => {},
    enableQuickSpin: async () => {},
    disableQuickSpin: async () => {},
  } as any as WheelGamePage;

  return {
    wheelGamePage: mockWheelGamePage,
    page: {} as any,
  } as CustomWorld;
}

// Helper to create distribution data with specific values
function createDistributionData(
  overrides?: Partial<DistributionData>
): DistributionData {
  const defaultData: DistributionData = {
    distribution: {
      0: 10,
      1: 10,
      2: 10,
      3: 10,
      4: 10,
      5: 10,
      6: 10,
      7: 10,
      8: 10,
      9: 10,
      10: 10,
      11: 10,
    },
    totalSpins: 120,
    totalWagered: 1200,
    totalWon: 2400,
    sliceMultipliers: {
      0: 10,
      1: 5,
      2: 0,
      3: 2,
      4: 1,
      5: 0.5,
      6: 10,
      7: 4,
      8: 0,
      9: 2,
      10: 1,
      11: 0.5,
    },
    sliceConfig: {
      0: 100,
      1: 50,
      2: 0,
      3: 20,
      4: 10,
      5: 5,
      6: 100,
      7: 40,
      8: 0,
      9: 20,
      10: 10,
      11: 5,
    },
  };

  return { ...defaultData, ...overrides };
}

test.describe("DistributionTestingLogic Unit Tests", () => {
  test.describe("Initialization", () => {
    test("should initialize with empty distribution data", () => {
      const world = createMockWorld();
      const logic = new DistributionTestingLogic(world);
      const data = logic.getDistributionData();

      expect(data.totalSpins).toBe(0);
      expect(data.totalWagered).toBe(0);
      expect(data.totalWon).toBe(0);
      expect(Object.keys(data.distribution).length).toBe(12);
    });

    test("should pre-populate slice configurations", () => {
      const world = createMockWorld();
      const logic = new DistributionTestingLogic(world);
      const data = logic.getDistributionData();

      expect(data.sliceConfig[0]).toBe(100); // 10x
      expect(data.sliceConfig[7]).toBe(40); // 4x (known bug slice)
      expect(data.sliceMultipliers[0]).toBe(10);
      expect(data.sliceMultipliers[7]).toBe(4);
    });

    test("should initialize all 12 slices with zero counts", () => {
      const world = createMockWorld();
      const logic = new DistributionTestingLogic(world);
      const data = logic.getDistributionData();

      for (let i = 0; i < 12; i++) {
        expect(data.distribution[i]).toBe(0);
      }
    });
  });

  test.describe("validateEqualDistribution", () => {
    test("should pass when all slices are within tolerance", () => {
      const world = createMockWorld();
      const logic = new DistributionTestingLogic(world);

      // Perfect distribution: 120 spins / 12 slices = 10 each
      const data = createDistributionData();
      logic.setDistributionData(data);

      expect(() => logic.validateEqualDistribution(0.25)).not.toThrow();
    });

    test("should fail when slices exceed tolerance", () => {
      const world = createMockWorld();
      const logic = new DistributionTestingLogic(world);

      // Heavily skewed distribution
      const data = createDistributionData({
        distribution: {
          0: 50, // Way over expected
          1: 5,
          2: 5,
          3: 5,
          4: 5,
          5: 5,
          6: 5,
          7: 5,
          8: 5,
          9: 5,
          10: 5,
          11: 5,
        },
        totalSpins: 120,
      });
      logic.setDistributionData(data);

      expect(() => logic.validateEqualDistribution(0.25)).toThrow(
        /Distribution validation failed/
      );
    });

    test("should handle zero spins in some slices", () => {
      const world = createMockWorld();
      const logic = new DistributionTestingLogic(world);

      const data = createDistributionData({
        distribution: {
          0: 20,
          1: 20,
          2: 0, // Never hit
          3: 20,
          4: 20,
          5: 20,
          6: 0, // Never hit
          7: 20,
          8: 0, // Never hit
          9: 0, // Never hit
          10: 0, // Never hit
          11: 0, // Never hit
        },
        totalSpins: 120,
      });
      logic.setDistributionData(data);

      expect(() => logic.validateEqualDistribution(0.25)).toThrow();
    });

    test("should use custom tolerance parameter", () => {
      const world = createMockWorld();
      const logic = new DistributionTestingLogic(world);

      // Slightly uneven but within 50% tolerance (±50% = deviation between -50% and +50%)
      // Expected per slice: 120/12 = 10
      // Deviation of +40% or -40% should pass with 50% tolerance
      const data = createDistributionData({
        distribution: {
          0: 14, // 40% more than expected (10)
          1: 10,
          2: 10,
          3: 10,
          4: 10,
          5: 10,
          6: 6, // 40% less than expected (10)
          7: 10,
          8: 10,
          9: 10,
          10: 10,
          11: 10,
        },
        totalSpins: 120,
      });
      logic.setDistributionData(data);

      expect(() => logic.validateEqualDistribution(0.5)).not.toThrow();
    });
  });

  test.describe("validateChiSquareTest", () => {
    test("should pass with uniform distribution", () => {
      const world = createMockWorld();
      const logic = new DistributionTestingLogic(world);

      const data = createDistributionData();
      logic.setDistributionData(data);

      const chiSquare = logic.validateChiSquareTest(19.68);
      expect(chiSquare).toBeLessThan(19.68);
    });

    test("should fail with highly skewed distribution", () => {
      const world = createMockWorld();
      const logic = new DistributionTestingLogic(world);

      const data = createDistributionData({
        distribution: {
          0: 60,
          1: 60,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
          6: 0,
          7: 0,
          8: 0,
          9: 0,
          10: 0,
          11: 0,
        },
        totalSpins: 120,
      });
      logic.setDistributionData(data);

      expect(() => logic.validateChiSquareTest(19.68)).toThrow(
        /Chi-Square test failed/
      );
    });

    test("should return chi-square statistic", () => {
      const world = createMockWorld();
      const logic = new DistributionTestingLogic(world);

      const data = createDistributionData();
      logic.setDistributionData(data);

      const chiSquare = logic.validateChiSquareTest(19.68);
      expect(chiSquare).toBeGreaterThanOrEqual(0);
      expect(typeof chiSquare).toBe("number");
    });

    test("should use custom critical value", () => {
      const world = createMockWorld();
      const logic = new DistributionTestingLogic(world);

      const data = createDistributionData({
        distribution: {
          0: 12,
          1: 11,
          2: 10,
          3: 10,
          4: 10,
          5: 10,
          6: 10,
          7: 10,
          8: 10,
          9: 9,
          10: 9,
          11: 9,
        },
        totalSpins: 120,
      });
      logic.setDistributionData(data);

      // Should pass with higher critical value
      expect(() => logic.validateChiSquareTest(100)).not.toThrow();
    });
  });

  test.describe("validateRTP", () => {
    test("should pass when RTP is within range", () => {
      const world = createMockWorld();
      const logic = new DistributionTestingLogic(world);

      const data = createDistributionData({
        totalWagered: 1000,
        totalWon: 900, // 90% RTP
      });
      logic.setDistributionData(data);

      const rtp = logic.validateRTP(80, 120);
      expect(rtp).toBe(90);
    });

    test("should fail when RTP is too low", () => {
      const world = createMockWorld();
      const logic = new DistributionTestingLogic(world);

      const data = createDistributionData({
        totalWagered: 1000,
        totalWon: 500, // 50% RTP
      });
      logic.setDistributionData(data);

      expect(() => logic.validateRTP(80, 120)).toThrow(
        /RTP 50.00% is outside acceptable range/
      );
    });

    test("should fail when RTP is too high", () => {
      const world = createMockWorld();
      const logic = new DistributionTestingLogic(world);

      const data = createDistributionData({
        totalWagered: 1000,
        totalWon: 1500, // 150% RTP
      });
      logic.setDistributionData(data);

      expect(() => logic.validateRTP(80, 120)).toThrow(
        /RTP 150.00% is outside acceptable range/
      );
    });

    test("should return calculated RTP value", () => {
      const world = createMockWorld();
      const logic = new DistributionTestingLogic(world);

      const data = createDistributionData({
        totalWagered: 1000,
        totalWon: 950,
      });
      logic.setDistributionData(data);

      const rtp = logic.validateRTP(80, 120);
      expect(rtp).toBe(95);
    });
  });

  test.describe("validateNoOverRepresentation", () => {
    test("should pass when no slice exceeds max deviation", () => {
      const world = createMockWorld();
      const logic = new DistributionTestingLogic(world);

      const data = createDistributionData();
      logic.setDistributionData(data);

      expect(() => logic.validateNoOverRepresentation(50)).not.toThrow();
    });

    test("should fail when slice is over-represented", () => {
      const world = createMockWorld();
      const logic = new DistributionTestingLogic(world);

      const data = createDistributionData({
        distribution: {
          0: 30, // Way over expected (10)
          1: 8,
          2: 8,
          3: 8,
          4: 8,
          5: 8,
          6: 8,
          7: 8,
          8: 8,
          9: 8,
          10: 10,
          11: 8,
        },
        totalSpins: 120,
      });
      logic.setDistributionData(data);

      expect(() => logic.validateNoOverRepresentation(50)).toThrow(
        /Slice 0 is over-represented/
      );
    });

    test("should use custom max deviation percent", () => {
      const world = createMockWorld();
      const logic = new DistributionTestingLogic(world);

      const data = createDistributionData({
        distribution: {
          0: 15, // 50% over expected (10)
          1: 10,
          2: 10,
          3: 10,
          4: 10,
          5: 10,
          6: 10,
          7: 10,
          8: 5,
          9: 10,
          10: 10,
          11: 10,
        },
        totalSpins: 120,
      });
      logic.setDistributionData(data);

      // Should pass with 100% tolerance
      expect(() => logic.validateNoOverRepresentation(100)).not.toThrow();
    });
  });

  test.describe("validateNoUnderRepresentation", () => {
    test("should pass when no slice is below min deviation", () => {
      const world = createMockWorld();
      const logic = new DistributionTestingLogic(world);

      const data = createDistributionData();
      logic.setDistributionData(data);

      expect(() => logic.validateNoUnderRepresentation(50)).not.toThrow();
    });

    test("should fail when slice is under-represented", () => {
      const world = createMockWorld();
      const logic = new DistributionTestingLogic(world);

      const data = createDistributionData({
        distribution: {
          0: 2, // Way under expected (10)
          1: 10,
          2: 10,
          3: 10,
          4: 10,
          5: 10,
          6: 10,
          7: 10,
          8: 10,
          9: 10,
          10: 16,
          11: 12,
        },
        totalSpins: 120,
      });
      logic.setDistributionData(data);

      expect(() => logic.validateNoUnderRepresentation(50)).toThrow(
        /Slice 0 is under-represented/
      );
    });
  });

  test.describe("validateTotalWon", () => {
    test("should pass when total won is greater than zero", () => {
      const world = createMockWorld();
      const logic = new DistributionTestingLogic(world);

      const data = createDistributionData({
        totalWon: 100,
      });
      logic.setDistributionData(data);

      expect(() => logic.validateTotalWon()).not.toThrow();
    });

    test("should fail when total won is zero", () => {
      const world = createMockWorld();
      const logic = new DistributionTestingLogic(world);

      const data = createDistributionData({
        totalWon: 0,
      });
      logic.setDistributionData(data);

      expect(() => logic.validateTotalWon()).toThrow(
        /Total won should be greater than 0/
      );
    });

    test("should fail when total won is negative", () => {
      const world = createMockWorld();
      const logic = new DistributionTestingLogic(world);

      const data = createDistributionData({
        totalWon: -100,
      });
      logic.setDistributionData(data);

      expect(() => logic.validateTotalWon()).toThrow();
    });
  });

  test.describe("validateMaxSliceOccurrence", () => {
    test("should pass when no slice exceeds max percentage", () => {
      const world = createMockWorld();
      const logic = new DistributionTestingLogic(world);

      const data = createDistributionData();
      logic.setDistributionData(data);

      // Each slice is 8.33% (10/120), well under 20%
      expect(() => logic.validateMaxSliceOccurrence(20)).not.toThrow();
    });

    test("should fail when slice exceeds max percentage", () => {
      const world = createMockWorld();
      const logic = new DistributionTestingLogic(world);

      const data = createDistributionData({
        distribution: {
          0: 30, // 25% of 120 spins
          1: 10,
          2: 10,
          3: 10,
          4: 10,
          5: 10,
          6: 10,
          7: 10,
          8: 10,
          9: 0,
          10: 0,
          11: 0,
        },
        totalSpins: 120,
      });
      logic.setDistributionData(data);

      expect(() => logic.validateMaxSliceOccurrence(20)).toThrow(
        /Slice 0 occurs 25.0% \(max allowed: 20%\)/
      );
    });
  });

  test.describe("validateMinSliceOccurrence", () => {
    test("should pass when all slices meet minimum percentage", () => {
      const world = createMockWorld();
      const logic = new DistributionTestingLogic(world);

      const data = createDistributionData();
      logic.setDistributionData(data);

      // Each slice is 8.33% (10/120), meets 5% minimum
      expect(() => logic.validateMinSliceOccurrence(5)).not.toThrow();
    });

    test("should fail when slice is below minimum percentage", () => {
      const world = createMockWorld();
      const logic = new DistributionTestingLogic(world);

      const data = createDistributionData({
        distribution: {
          0: 2, // 1.67% of 120 spins
          1: 10,
          2: 10,
          3: 10,
          4: 10,
          5: 10,
          6: 10,
          7: 10,
          8: 10,
          9: 10,
          10: 14,
          11: 14,
        },
        totalSpins: 120,
      });
      logic.setDistributionData(data);

      expect(() => logic.validateMinSliceOccurrence(5)).toThrow(
        /Slice 0 occurs only 1.7% \(min required: 5%\)/
      );
    });
  });

  test.describe("validateSliceWasHit", () => {
    test("should pass when slice was hit at least once", () => {
      const world = createMockWorld();
      const logic = new DistributionTestingLogic(world);

      const data = createDistributionData();
      logic.setDistributionData(data);

      expect(() => logic.validateSliceWasHit(0)).not.toThrow();
    });

    test("should fail when slice was never hit", () => {
      const world = createMockWorld();
      const logic = new DistributionTestingLogic(world);

      const data = createDistributionData({
        distribution: {
          0: 0, // Never hit
          1: 10,
          2: 10,
          3: 10,
          4: 10,
          5: 10,
          6: 10,
          7: 10,
          8: 10,
          9: 10,
          10: 20,
          11: 20,
        },
        totalSpins: 120,
      });
      logic.setDistributionData(data);

      expect(() => logic.validateSliceWasHit(0)).toThrow(
        /Slice 0 was never hit/
      );
    });
  });

  test.describe("validateSufficientSpins", () => {
    test("should pass when enough spins were performed", () => {
      const world = createMockWorld();
      const logic = new DistributionTestingLogic(world);

      const data = createDistributionData({
        totalSpins: 1000,
      });
      logic.setDistributionData(data);

      expect(() => logic.validateSufficientSpins(100)).not.toThrow();
    });

    test("should fail when insufficient spins were performed", () => {
      const world = createMockWorld();
      const logic = new DistributionTestingLogic(world);

      const data = createDistributionData({
        totalSpins: 50,
      });
      logic.setDistributionData(data);

      expect(() => logic.validateSufficientSpins(100)).toThrow(
        /Only 50 spins performed \(minimum: 100\)/
      );
    });
  });

  test.describe("setDistributionData and getDistributionData", () => {
    test("should set and retrieve distribution data", () => {
      const world = createMockWorld();
      const logic = new DistributionTestingLogic(world);

      const newData = createDistributionData({
        totalSpins: 500,
        totalWagered: 5000,
      });

      logic.setDistributionData(newData);
      const retrieved = logic.getDistributionData();

      expect(retrieved.totalSpins).toBe(500);
      expect(retrieved.totalWagered).toBe(5000);
    });
  });
});
