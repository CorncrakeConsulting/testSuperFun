import { Page } from "@playwright/test";
import { WheelGamePage } from "../pages/WheelGamePage";

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
  constructor(
    private page: Page,
    private wheelGamePage: WheelGamePage
  ) {}

  private async getSliceConfiguration(sliceIndex: number) {
    return await this.page.evaluate((idx) => {
      const game = (globalThis as any).game;
      const slice = game.wheel._config.slices[idx];
      return {
        sprite: slice.sprite,
        winMultiplier: slice.winMultiplier
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
    // Validation 1: Check if sprite multiplier matches expected
    if (actualSpriteMultiplier !== expectedSpriteMultiplier) {
      errors.push(`Slice ${sliceIndex}: Expected sprite ${expectedSpriteMultiplier}x but found ${actualSpriteMultiplier}x`);
    }
    
    // Validation 2: Check if sprite matches configured multiplier (the main bug check)
    if (actualSpriteMultiplier !== configuredMultiplier) {
      errors.push(`Slice ${sliceIndex}: Sprite shows ${actualSpriteMultiplier}x but configured as ${configuredMultiplier}x`);
    }
  }

  private async spinWheelOnSlice(sliceIndex: number): Promise<void> {
    await this.wheelGamePage.setWheelLandingIndex(sliceIndex);
    await this.wheelGamePage.spin();
    await this.wheelGamePage.waitForSpinComplete();
    await this.page.waitForTimeout(1000); // Wait for UI to fully update
  }

  private async captureSpinResults(): Promise<{ balance: number; win: number }> {
    const balance = await this.wheelGamePage.getBalance();
    const win = await this.wheelGamePage.getWin();
    return { balance, win };
  }

  private validateWinAndBalance(
    sliceIndex: number,
    actualWin: number,
    expectedWin: number,
    balanceBefore: number,
    balanceAfter: number,
    bet: number,
    errors: string[]
  ): void {
    // Validation 3: Check if actual win matches expected win
    if (actualWin !== expectedWin) {
      errors.push(`Slice ${sliceIndex}: Expected win ${expectedWin} but got ${actualWin}`);
    }
    
    // Validation 4: Check if balance change is correct
    const expectedBalance = balanceBefore - bet + actualWin;
    if (balanceAfter !== expectedBalance) {
      errors.push(`Slice ${sliceIndex}: Balance should be ${expectedBalance} but is ${balanceAfter}`);
    }
  }

  private logSliceResult(
    sliceIndex: number,
    actualSpriteMultiplier: number,
    configuredMultiplier: number,
    expectedWin: number,
    actualWin: number,
    balanceBefore: number,
    balanceAfter: number
  ): void {
    console.log(
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
    const actualSpriteMultiplier = this.extractMultiplierFromSprite(sliceConfig.sprite);
    if (actualSpriteMultiplier === null) {
      errors.push(`Slice ${sliceIndex}: Could not parse multiplier from sprite "${sliceConfig.sprite}"`);
      return {
        sliceIndex,
        actualSpriteMultiplier: 0,
        configuredMultiplier: sliceConfig.winMultiplier,
        expectedWin,
        actualWin: 0,
        balanceBefore,
        balanceAfter: balanceBefore,
        errors
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
    const { balance: balanceAfter, win: actualWin } = await this.captureSpinResults();
    
    // Validate win and balance
    this.validateWinAndBalance(
      sliceIndex,
      actualWin,
      expectedWin,
      balanceBefore,
      balanceAfter,
      bet,
      errors
    );
    
    // Log the results
    this.logSliceResult(
      sliceIndex,
      actualSpriteMultiplier,
      sliceConfig.winMultiplier,
      expectedWin,
      actualWin,
      balanceBefore,
      balanceAfter
    );
    
    return {
      sliceIndex,
      actualSpriteMultiplier,
      configuredMultiplier: sliceConfig.winMultiplier,
      expectedWin,
      actualWin,
      balanceBefore,
      balanceAfter,
      errors
    };
  }

  async validateAllSlices(
    sliceTestData: SliceTestData[]
  ): Promise<void> {
    const bet = await this.wheelGamePage.getBet();
    let currentBalance = await this.wheelGamePage.getBalance();
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
      throw new Error(`Found ${allErrors.length} error(s):\n${allErrors.join('\n')}`);
    }
  }
}
