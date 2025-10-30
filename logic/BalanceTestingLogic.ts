import { Page } from "@playwright/test";
import { DataTable } from "@cucumber/cucumber";
import { WheelGamePage } from "../pages/WheelGamePage";
import { TestLogger, ILogger } from "../services/TestLogger";
import { GameWindow } from "../utils/windowHelpers";

export interface SliceTestData {
  sliceIndex: number;
  expectedSpriteMultiplier: number;
  expectedWin: number;
}

export interface SliceValidationResult {
  sliceIndex: number;
  actualSpriteMultiplier: number;
  configuredMultiplier: number;
  expectedWin: number;
  actualWin: number;
  balanceBefore: number;
  balanceAfter: number;
  errors: string[];
}

export class BalanceTestingLogic {
  private readonly logger: ILogger;

  constructor(
    private readonly page: Page,
    private readonly wheelGamePage: WheelGamePage,
    logger?: ILogger
  ) {
    this.logger = logger ?? TestLogger.getDefault();
  }

  private async getSliceConfiguration(
    sliceIndex: number
  ): Promise<{ sprite: string; winMultiplier: number }> {
    return await this.page.evaluate((idx) => {
      const game = (globalThis as unknown as GameWindow).game;
      const slice = game?.wheel?._config?.slices?.[idx];
      return {
        sprite: slice?.sprite ?? "",
        winMultiplier: slice?.winMultiplier ?? 0,
      };
    }, sliceIndex);
  }

  private extractMultiplierFromSprite(sprite: string): number | null {
    const spriteMatch = new RegExp(/(\d+\.?\d*)x\.png/).exec(sprite);
    return spriteMatch ? Number.parseFloat(spriteMatch[1]) : null;
  }

  private validateSpriteConfiguration(
    sliceIndex: number,
    actualSpriteMultiplier: number,
    expectedSpriteMultiplier: number,
    configuredMultiplier: number,
    errors: string[]
  ): void {
    // Validation 1: Check if sprite multiplier matches expected from cuck table
    if (actualSpriteMultiplier !== expectedSpriteMultiplier) {
      errors.push(
        `Slice ${sliceIndex}: Defined expected sprite ${expectedSpriteMultiplier}x but found ${actualSpriteMultiplier}x`
      );
    }

    // Validation 2: Check if sprite matches configured multiplier
    if (actualSpriteMultiplier !== configuredMultiplier) {
      errors.push(
        `Slice ${sliceIndex}: Sprite incorrectly configured - shows ${actualSpriteMultiplier}x but configured as ${configuredMultiplier}x`
      );
    }
  }

  private async spinWheelOnSlice(sliceIndex: number): Promise<void> {
    await this.wheelGamePage.testHooks.setWheelLandingIndex(sliceIndex);
    await this.wheelGamePage.spin();
    await this.wheelGamePage.state.waitForSpinComplete();
    await this.page.waitForTimeout(1000); // Wait for UI to fully update
  }

  private async captureSpinResults(): Promise<{
    balance: number;
    win: number;
  }> {
    const balance = await this.wheelGamePage.data.getBalance();
    const win = await this.wheelGamePage.data.getWin();
    return { balance, win };
  }

  private validateWinAndBalance(
    result: SliceValidationResult,
    bet: number
  ): void {
    const {
      sliceIndex,
      actualWin,
      expectedWin,
      balanceBefore,
      balanceAfter,
      errors,
    } = result;

    // Validation 3: Check if actual win matches expected win
    if (actualWin !== expectedWin) {
      errors.push(
        `Slice ${sliceIndex}: Expected win ${expectedWin} but got ${actualWin}`
      );
    }

    // Validation 4: Check if balance change is correct
    const expectedBalance = balanceBefore - bet + actualWin;
    if (balanceAfter !== expectedBalance) {
      errors.push(
        `Slice ${sliceIndex}: Balance should be ${expectedBalance} but is ${balanceAfter}`
      );
    }
  }

  private logSliceResult(result: SliceValidationResult): void {
    const {
      sliceIndex,
      actualSpriteMultiplier,
      configuredMultiplier,
      expectedWin,
      actualWin,
      balanceBefore,
      balanceAfter,
    } = result;

    this.logger.info(
      `Slice ${sliceIndex}: sprite=${actualSpriteMultiplier}x, ` +
        `config=${configuredMultiplier}x, ` +
        `expected_win=${expectedWin}, actual_win=${actualWin}, ` +
        `balance=${balanceBefore}->${balanceAfter}`
    );
  }

  async validateSliceAndSpin(
    testData: SliceTestData,
    bet: number,
    currentBalance: number
  ): Promise<SliceValidationResult> {
    const { sliceIndex, expectedSpriteMultiplier, expectedWin } = testData;
    const errors: string[] = [];
    const balanceBefore = currentBalance;

    // Get the actual slice configuration from the game
    const sliceConfig = await this.getSliceConfiguration(sliceIndex);

    // Extract multiplier from sprite filename
    const actualSpriteMultiplier = this.extractMultiplierFromSprite(
      sliceConfig.sprite
    );
    if (actualSpriteMultiplier === null) {
      errors.push(
        `Slice ${sliceIndex}: Could not parse multiplier from sprite "${sliceConfig.sprite}"`
      );
      return {
        sliceIndex,
        actualSpriteMultiplier: 0,
        configuredMultiplier: sliceConfig.winMultiplier,
        expectedWin,
        actualWin: 0,
        balanceBefore,
        balanceAfter: balanceBefore,
        errors,
      };
    }

    // Validate sprite configuration
    this.validateSpriteConfiguration(
      sliceIndex,
      actualSpriteMultiplier,
      expectedSpriteMultiplier,
      sliceConfig.winMultiplier,
      errors
    );

    // Spin the wheel on this slice
    await this.spinWheelOnSlice(sliceIndex);

    // Capture results after spin
    const { balance: balanceAfter, win: actualWin } =
      await this.captureSpinResults();

    // Create result object
    const result: SliceValidationResult = {
      sliceIndex,
      actualSpriteMultiplier,
      configuredMultiplier: sliceConfig.winMultiplier,
      expectedWin,
      actualWin,
      balanceBefore,
      balanceAfter,
      errors,
    };

    // Validate win and balance
    this.validateWinAndBalance(result, bet);

    // Log the results
    this.logSliceResult(result);

    return result;
  }

  async validateAllSlices(sliceTestData: SliceTestData[]): Promise<void> {
    const bet = await this.wheelGamePage.data.getBet();
    let currentBalance = await this.wheelGamePage.data.getBalance();
    const allErrors: string[] = [];

    for (const testData of sliceTestData) {
      const result = await this.validateSliceAndSpin(
        testData,
        bet,
        currentBalance
      );

      currentBalance = result.balanceAfter;
      allErrors.push(...result.errors);
    }

    if (allErrors.length > 0) {
      throw new Error(
        `Found ${allErrors.length} error(s):\n${allErrors.join("\n")}`
      );
    }
  }

  parseDataTableToSliceTestData(dataTable: DataTable): SliceTestData[] {
    return dataTable.hashes().map((row: Record<string, string>) => ({
      //Without specifying the radix, parseInt() can be unpredictable
      sliceIndex: Number.parseInt(row.slice_index, 10),
      expectedSpriteMultiplier: Number.parseFloat(row.sprite_multiplier),
      expectedWin: Number.parseInt(row.expected_win, 10),
    }));
  }

  async validateAllSlicesFromDataTable(dataTable: DataTable): Promise<void> {
    const sliceTestData = this.parseDataTableToSliceTestData(dataTable);
    await this.validateAllSlices(sliceTestData);
  }
}
