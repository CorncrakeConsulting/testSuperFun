/**
 * Shared Distribution Data Store
 * Allows distribution data to be shared across scenarios within a feature
 * Uses file-based storage to persist data across parallel Cucumber workers
 */

import { DistributionData } from "./DistributionTestingLogic";
import { TestLogger } from "../services/TestLogger";
import * as fs from "fs";
import * as path from "path";

class SharedDistributionStore {
  private static instance: SharedDistributionStore;
  private readonly storageDir: string;

  private constructor() {
    // Store data in test-results directory
    this.storageDir = path.join(
      process.cwd(),
      "test-results",
      "distribution-data"
    );
    this.ensureStorageDir();
  }

  private ensureStorageDir(): void {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  private getFilePath(featureTag: string): string {
    return path.join(this.storageDir, `${featureTag}.json`);
  }

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
    const filePath = this.getFilePath(featureTag);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    TestLogger.debug(
      `📦 Stored distribution data for feature: ${featureTag} at ${filePath}`
    );
  }

  /**
   * Retrieve distribution data for a feature
   */
  public getDistributionData(featureTag: string): DistributionData | null {
    const filePath = this.getFilePath(featureTag);

    if (!fs.existsSync(filePath)) {
      TestLogger.debug(`📦 No stored data found for feature: ${featureTag}`);
      return null;
    }

    try {
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      TestLogger.debug(
        `📦 Retrieved stored distribution data for feature: ${featureTag}`
      );
      return data;
    } catch (error) {
      TestLogger.debug(
        `📦 Error reading data for feature: ${featureTag} - ${error}`
      );
      return null;
    }
  }

  /**
   * Check if data exists for a feature
   */
  public hasData(featureTag: string): boolean {
    return fs.existsSync(this.getFilePath(featureTag));
  }

  /**
   * Clear stored data
   */
  public clear(): void {
    if (fs.existsSync(this.storageDir)) {
      const files = fs.readdirSync(this.storageDir);
      files.forEach((file) => {
        fs.unlinkSync(path.join(this.storageDir, file));
      });
    }
    TestLogger.debug(`📦 Cleared all stored distribution data`);
  }

  /**
   * Clear data for a specific feature
   */
  public clearFeature(featureTag: string): void {
    const filePath = this.getFilePath(featureTag);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      TestLogger.debug(
        `📦 Cleared distribution data for feature: ${featureTag}`
      );
    }
  }
}

export const sharedDistributionStore = SharedDistributionStore.getInstance();
