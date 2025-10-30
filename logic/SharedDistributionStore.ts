/**
 * Shared Distribution Data Store
 * Allows distribution data to be shared across scenarios within a test run
 * Simple in-memory store for data sharing
 */

import { DistributionData } from "./DistributionTestingLogic";
import { TestLogger, ILogger } from "../services/TestLogger";

export class SharedDistributionStore {
  private data: DistributionData | null = null;
  private readonly logger: ILogger;

  constructor(logger?: ILogger) {
    this.logger = logger ?? TestLogger.getDefault();
  }

  /**
   * Store distribution data
   */
  public setDistributionData(data: DistributionData): void {
    this.data = data;
    this.logger.debug(`📦 Stored distribution data`);
  }

  /**
   * Retrieve distribution data
   */
  public getDistributionData(): DistributionData | null {
    if (!this.data) {
      this.logger.debug(`📦 No stored data found`);
      return null;
    }

    this.logger.debug(`📦 Retrieved stored distribution data`);
    return this.data;
  }
}

export const sharedDistributionStore = new SharedDistributionStore();
