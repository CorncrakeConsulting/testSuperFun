/**
 * Cucumber World: Shared context object that persists across test steps.
 * Stores page objects, test logic, and state data for each scenario.
 */
import { World, IWorldOptions, setWorldConstructor } from "@cucumber/cucumber";
import { Page } from "@playwright/test";
import { WheelGamePage } from "../../pages/WheelGamePage";
import { DistributionTestingLogic } from "../../logic/DistributionTestingLogic";
import { AutoplayTestingLogic } from "../../logic/AutoplayTestingLogic";

export interface MultiplierTestResult {
  sliceIndex?: number;
  sprite?: string;
  expectedMultiplier?: number;
  configuredMultiplier?: number;
  multiplier?: number;
  expectedWin: number;
  actualWin: number;
  bet: number;
  balanceBeforeSpin: number;
  balanceAfterSpin: number;
  screenshot?: Buffer;
}

export interface CustomWorld extends World {
  page: Page;
  wheelGamePage: WheelGamePage;
  distributionLogic: DistributionTestingLogic;
  autoplayLogic: AutoplayTestingLogic;
  initialBalance?: number;
  balanceBeforeSpin?: number;
  multiplierTestResults?: MultiplierTestResult[];
  spinStartTime?: number;
  normalSpinBaseline?: number;
  quickSpinBaseline?: number;
  targetSliceIndex?: number; // Target slice for next spin (set by test hooks)
}

export class CustomWorldImpl extends World implements CustomWorld {
  page!: Page;
  wheelGamePage!: WheelGamePage;
  distributionLogic!: DistributionTestingLogic;
  autoplayLogic!: AutoplayTestingLogic;
  initialBalance?: number;
  balanceBeforeSpin?: number;
  multiplierTestResults?: MultiplierTestResult[];
  spinStartTime?: number;
  normalSpinBaseline?: number;
  quickSpinBaseline?: number;
  targetSliceIndex?: number;

  constructor(options: IWorldOptions) {
    super(options);
  }
}

setWorldConstructor(CustomWorldImpl);
