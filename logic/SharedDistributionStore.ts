/**
 * Shared Distribution Data Store
 * Allows distribution data to be shared across scenarios within a feature
 * Simple in-memory store for data sharing within a test run
 */

import { DistributionData } from "./DistributionTestingLogic";
import { TestLogger, ILogger } from "../services/TestLogger";

export class SharedDistributionStore {
  private dataStore: Map<string, DistributionData> = new Map();
  private readonly logger: ILogger;

  constructor(logger?: ILogger) {
    this.logger = logger ?? TestLogger.getDefault();
  }

  /**
   * Store distribution data for a feature
   */
  public setDistributionData(data: DistributionData, featureTag: string): void {
    this.dataStore.set(featureTag, data);
    this.logger.debug(`📦 Stored distribution data for feature: ${featureTag}`);
  }

  /**
   * Retrieve distribution data for a feature
   */
  public getDistributionData(featureTag: string): DistributionData | null {
    const data = this.dataStore.get(featureTag);

    if (!data) {
      this.logger.debug(`📦 No stored data found for feature: ${featureTag}`);
      return null;
    }

    this.logger.debug(
      `📦 Retrieved stored distribution data for feature: ${featureTag}`
    );
    return data;
  }
}

export const sharedDistributionStore = new SharedDistributionStore();
