import { World, IWorldOptions, setWorldConstructor } from '@cucumber/cucumber';
import { Page } from '@playwright/test';
import { WheelGamePage } from '../../pages/WheelGamePage';
import { DistributionTestingLogic } from '../../logic/distributionTestingLogic';
import { AutoplayTestingLogic } from '../../logic/AutoplayTestingLogic';

export interface CustomWorld extends World {
  page: Page;
  wheelGamePage: WheelGamePage;
  distributionLogic: DistributionTestingLogic;
  autoplayLogic: AutoplayTestingLogic;
  balanceBeforeSpin?: number;
  balanceAfterFirstSpin?: number;
}

export class CustomWorldImpl extends World implements CustomWorld {
  page!: Page;
  wheelGamePage!: WheelGamePage;
  distributionLogic!: DistributionTestingLogic;
  autoplayLogic!: AutoplayTestingLogic;
  balanceBeforeSpin?: number;
  balanceAfterFirstSpin?: number;

  constructor(options: IWorldOptions) {
    super(options);
  }
}

setWorldConstructor(CustomWorldImpl);
