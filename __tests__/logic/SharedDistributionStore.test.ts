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
    test("should store distribution data for a feature tag", () => {
      const data = createMockDistributionData();
      const featureTag = "test-feature";

      store.setDistributionData(data, featureTag);

      const retrieved = store.getDistributionData(featureTag);
      expect(retrieved).toEqual(data);
    });

    test("should log debug message when storing data", () => {
      const data = createMockDistributionData();
      const featureTag = "test-feature";

      store.setDistributionData(data, featureTag);

      expect(mockLogger.calls.debug.length).toBe(1);
      expect(mockLogger.calls.debug[0][0]).toBe(
        `📦 Stored distribution data for feature: ${featureTag}`
      );
    });

    test("should store multiple feature tags independently", () => {
      const data1 = createMockDistributionData(1000);
      const data2 = createMockDistributionData(2000);

      store.setDistributionData(data1, "feature1");
      store.setDistributionData(data2, "feature2");

      expect(store.getDistributionData("feature1")).toEqual(data1);
      expect(store.getDistributionData("feature2")).toEqual(data2);
    });

    test("should overwrite existing data for same feature tag", () => {
      const originalData = createMockDistributionData(1000);
      const updatedData = createMockDistributionData(2000);
      const featureTag = "test-feature";

      store.setDistributionData(originalData, featureTag);
      store.setDistributionData(updatedData, featureTag);

      const retrieved = store.getDistributionData(featureTag);
      expect(retrieved).toEqual(updatedData);
      expect(retrieved?.totalSpins).toBe(2000);
    });
  });

  test.describe("getDistributionData", () => {
    test("should return null when no data exists for feature tag", () => {
      const result = store.getDistributionData("non-existent");

      expect(result).toBeNull();
    });

    test("should log debug message when no data found", () => {
      const featureTag = "non-existent";

      store.getDistributionData(featureTag);

      expect(mockLogger.calls.debug.length).toBe(1);
      expect(mockLogger.calls.debug[0][0]).toBe(
        `📦 No stored data found for feature: ${featureTag}`
      );
    });

    test("should return stored data for valid feature tag", () => {
      const data = createMockDistributionData();
      const featureTag = "test-feature";

      store.setDistributionData(data, featureTag);
      const retrieved = store.getDistributionData(featureTag);

      expect(retrieved).toEqual(data);
    });

    test("should log debug message when data retrieved", () => {
      const data = createMockDistributionData();
      const featureTag = "test-feature";

      store.setDistributionData(data, featureTag);
      const callCountBeforeGet = mockLogger.calls.debug.length;
      store.getDistributionData(featureTag);

      // Should have one more debug call after get
      expect(mockLogger.calls.debug.length).toBe(callCountBeforeGet + 1);
      expect(mockLogger.calls.debug[callCountBeforeGet][0]).toBe(
        `📦 Retrieved stored distribution data for feature: ${featureTag}`
      );
    });

    test("should return same data object that was stored", () => {
      const data = createMockDistributionData();
      const featureTag = "test-feature";

      store.setDistributionData(data, featureTag);
      const retrieved = store.getDistributionData(featureTag);

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

      store.setDistributionData(complexData, "complex-feature");
      const retrieved = store.getDistributionData("complex-feature");

      expect(retrieved).toEqual(complexData);
      expect(retrieved?.testSets).toHaveLength(2);
    });
  });

  test.describe("integration scenarios", () => {
    test("should handle sequential store and retrieve operations", () => {
      const features = ["feature1", "feature2", "feature3"];
      const dataSet = features.map((_, i) => createMockDistributionData(1000 * (i + 1)));

      // Store all
      features.forEach((feature, i) => {
        store.setDistributionData(dataSet[i], feature);
      });

      // Retrieve all
      features.forEach((feature, i) => {
        const retrieved = store.getDistributionData(feature);
        expect(retrieved).toEqual(dataSet[i]);
      });
    });

    test("should maintain data isolation between features", () => {
      const data1 = createMockDistributionData(1000);
      const data2 = createMockDistributionData(2000);

      store.setDistributionData(data1, "feature1");
      store.setDistributionData(data2, "feature2");

      // Modify retrieved data
      const retrieved1 = store.getDistributionData("feature1");
      if (retrieved1) {
        retrieved1.totalSpins = 9999;
      }

      // Original stored data should be affected (same reference)
      const retrieved1Again = store.getDistributionData("feature1");
      expect(retrieved1Again?.totalSpins).toBe(9999);

      // Other feature data should be unaffected
      const retrieved2 = store.getDistributionData("feature2");
      expect(retrieved2?.totalSpins).toBe(2000);
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

      store.setDistributionData(emptyData, "empty-feature");
      const retrieved = store.getDistributionData("empty-feature");

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
      instance1.setDistributionData(data, "shared-test");

      const retrieved = instance2.getDistributionData("shared-test");
      expect(retrieved).toEqual(data);
    });
  });
});
