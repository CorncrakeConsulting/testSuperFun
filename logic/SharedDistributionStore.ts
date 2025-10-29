/**
 * Shared Distribution Data Store
 * Allows distribution data to be shared across scenarios within a feature
 * This is a singleton that persists for the entire test run
 */

import { DistributionData } from "./DistributionTestingLogic";

class SharedDistributionStore {
  private static instance: SharedDistributionStore;
  private distributionData: DistributionData | null = null;
  private featureTag: string | null = null;

  private constructor() {}

  public static getInstance(): SharedDistributionStore {
    if (!SharedDistributionStore.instance) {
      SharedDistributionStore.instance = new SharedDistributionStore();
    }
    return SharedDistributionStore.instance;
  }

  /**
   * Store distribution data for a feature
   */
  public setDistributionData(data: DistributionData, featureTag: string): void {
    this.distributionData = data;
    this.featureTag = featureTag;
    console.log(`📦 Stored distribution data for feature: ${featureTag}`);
  }

  /**
   * Retrieve distribution data for a feature
   */
  public getDistributionData(featureTag: string): DistributionData | null {
    if (this.featureTag === featureTag && this.distributionData) {
      console.log(`📦 Retrieved stored distribution data for feature: ${featureTag}`);
      return this.distributionData;
    }
    console.log(`📦 No stored data found for feature: ${featureTag}`);
    return null;
  }

  /**
   * Check if data exists for a feature
   */
  public hasData(featureTag: string): boolean {
    return this.featureTag === featureTag && this.distributionData !== null;
  }

  /**
   * Clear stored data
   */
  public clear(): void {
    this.distributionData = null;
    this.featureTag = null;
    console.log(`📦 Cleared stored distribution data`);
  }

  /**
   * Clear data for a specific feature
   */
  public clearFeature(featureTag: string): void {
    if (this.featureTag === featureTag) {
      this.clear();
    }
  }
}

export const sharedDistributionStore = SharedDistributionStore.getInstance();
