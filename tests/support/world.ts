import { World, IWorldOptions, setWorldConstructor } from '@cucumber/cucumber';
import { Page } from '@playwright/test';
import { WheelGamePage } from '../../pages/WheelGamePage';
import { DistributionTestingLogic } from '../../logic/DistributionTestingLogic';
import { AutoplayTestingLogic } from '../../logic/AutoplayTestingLogic';
import { TestResultsSink } from '../../logic/TestResultsSink';

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
  testResultsSink: TestResultsSink;
  balanceBeforeSpin?: number;
  balanceAfterFirstSpin?: number;
  multiplierTestResults?: MultiplierTestResult[];
  spinStartTime?: number;
  normalSpinBaseline?: number;
  quickSpinBaseline?: number;
  testError?: Error; // Store non-critical errors to allow continuation
}

export class CustomWorldImpl extends World implements CustomWorld {
  page!: Page;
  wheelGamePage!: WheelGamePage;
  distributionLogic!: DistributionTestingLogic;
  autoplayLogic!: AutoplayTestingLogic;
  testResultsSink!: TestResultsSink;
  balanceBeforeSpin?: number;
  balanceAfterFirstSpin?: number;
  multiplierTestResults?: MultiplierTestResult[];
  spinStartTime?: number;
  normalSpinBaseline?: number;
  quickSpinBaseline?: number;
  testError?: Error;

  constructor(options: IWorldOptions) {
    super(options);
    this.testResultsSink = new TestResultsSink();
  }
}

setWorldConstructor(CustomWorldImpl);
