import { test, expect } from "@playwright/test";
import { SharedDistributionStore } from "../../logic/SharedDistributionStore";
import { DistributionData } from "../../logic/DistributionTestingLogic";
import { TestLogger } from "../../services/TestLogger";

test.describe("SharedDistributionStore", () => {
  let store: SharedDistributionStore;
  let mockLogger: ReturnType<typeof TestLogger.createMockLogger>;

  const createMockDistributionData = (
    totalSpins: number = 1000
  ): DistributionData => ({
    distribution: { 0: 100, 1: 80, 2: 90 },
    totalSpins,
    totalWagered: 10000,
    totalWon: 9500,
    sliceMultipliers: { 0: 10, 1: 5, 2: 0 },
    sliceConfig: { 0: 10, 1: 5, 2: 0 },
  });

  test.beforeEach(() => {
    mockLogger = TestLogger.createMockLogger();
    store = new SharedDistributionStore(mockLogger);
  });

  test.describe("constructor", () => {
    test("should create instance with injected logger", () => {
      expect(store).toBeDefined();
    });

    test("should create instance with default logger when none provided", () => {
      const storeWithDefaultLogger = new SharedDistributionStore();
      expect(storeWithDefaultLogger).toBeDefined();
    });
  });

  test.describe("setDistributionData", () => {
    test("should store distribution data", () => {
      const data = createMockDistributionData();

      store.setDistributionData(data);

      const retrieved = store.getDistributionData();
      expect(retrieved).toEqual(data);
    });

    test("should log debug message when storing data", () => {
      const data = createMockDistributionData();

      store.setDistributionData(data);

      expect(mockLogger.calls.debug.length).toBe(1);
      expect(mockLogger.calls.debug[0][0]).toBe(`📦 Stored distribution data`);
    });

    test("should overwrite existing data", () => {
      const originalData = createMockDistributionData(1000);
      const updatedData = createMockDistributionData(2000);

      store.setDistributionData(originalData);
      store.setDistributionData(updatedData);

      const retrieved = store.getDistributionData();
      expect(retrieved).toEqual(updatedData);
      expect(retrieved?.totalSpins).toBe(2000);
    });
  });

  test.describe("getDistributionData", () => {
    test("should return null when no data exists", () => {
      const result = store.getDistributionData();

      expect(result).toBeNull();
    });

    test("should log debug message when no data found", () => {
      store.getDistributionData();

      expect(mockLogger.calls.debug.length).toBe(1);
      expect(mockLogger.calls.debug[0][0]).toBe(`📦 No stored data found`);
    });

    test("should return stored data", () => {
      const data = createMockDistributionData();

      store.setDistributionData(data);
      const retrieved = store.getDistributionData();

      expect(retrieved).toEqual(data);
    });

    test("should log debug message when data retrieved", () => {
      const data = createMockDistributionData();

      store.setDistributionData(data);
      const callCountBeforeGet = mockLogger.calls.debug.length;
      store.getDistributionData();

      // Should have one more debug call after get
      expect(mockLogger.calls.debug.length).toBe(callCountBeforeGet + 1);
      expect(mockLogger.calls.debug[callCountBeforeGet][0]).toBe(
        `📦 Retrieved stored distribution data`
      );
    });

    test("should return same data object that was stored", () => {
      const data = createMockDistributionData();

      store.setDistributionData(data);
      const retrieved = store.getDistributionData();

      expect(retrieved).toBe(data); // Same reference
    });

    test("should handle complex distribution data", () => {
      const complexData: DistributionData = {
        distribution: {
          0: 100,
          1: 95,
          2: 88,
          3: 92,
          4: 105,
          5: 97,
          6: 103,
          7: 91,
          8: 89,
          9: 94,
          10: 98,
          11: 96,
        },
        totalSpins: 1148,
        totalWagered: 114800,
        totalWon: 112340,
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
        testSets: [
          { 0: 10, 1: 8, 2: 9 },
          { 0: 12, 1: 7, 2: 11 },
        ],
      };

      store.setDistributionData(complexData);
      const retrieved = store.getDistributionData();

      expect(retrieved).toEqual(complexData);
      expect(retrieved?.testSets).toHaveLength(2);
    });
  });

  test.describe("integration scenarios", () => {
    test("should handle sequential store and retrieve operations", () => {
      const data1 = createMockDistributionData(1000);
      const data2 = createMockDistributionData(2000);
      const data3 = createMockDistributionData(3000);

      // Store sequentially (each overwrites previous)
      store.setDistributionData(data1);
      store.setDistributionData(data2);
      store.setDistributionData(data3);

      // Retrieve last stored
      const retrieved = store.getDistributionData();
      expect(retrieved).toEqual(data3);
    });

    test("should allow data mutation after retrieval", () => {
      const data = createMockDistributionData(1000);

      store.setDistributionData(data);

      // Modify retrieved data
      const retrieved1 = store.getDistributionData();
      if (retrieved1) {
        retrieved1.totalSpins = 9999;
      }

      // Original stored data should be affected (same reference)
      const retrieved2 = store.getDistributionData();
      expect(retrieved2?.totalSpins).toBe(9999);
    });

    test("should handle empty distribution data", () => {
      const emptyData: DistributionData = {
        distribution: {},
        totalSpins: 0,
        totalWagered: 0,
        totalWon: 0,
        sliceMultipliers: {},
        sliceConfig: {},
      };

      store.setDistributionData(emptyData);
      const retrieved = store.getDistributionData();

      expect(retrieved).toEqual(emptyData);
      expect(retrieved?.totalSpins).toBe(0);
    });
  });

  test.describe("exported singleton instance", () => {
    test("should export a shared instance", async () => {
      const { sharedDistributionStore } = await import(
        "../../logic/SharedDistributionStore"
      );

      expect(sharedDistributionStore).toBeDefined();
      expect(sharedDistributionStore).toBeInstanceOf(SharedDistributionStore);
    });

    test("should maintain state across imports", async () => {
      const { sharedDistributionStore: instance1 } = await import(
        "../../logic/SharedDistributionStore"
      );
      const { sharedDistributionStore: instance2 } = await import(
        "../../logic/SharedDistributionStore"
      );

      const data = createMockDistributionData();
      instance1.setDistributionData(data);

      const retrieved = instance2.getDistributionData();
      expect(retrieved).toEqual(data);
    });
  });
});
