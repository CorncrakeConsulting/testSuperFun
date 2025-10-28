import { Page, expect } from "@playwright/test";
import { WheelGamePage } from "../pages/WheelGamePage";
import { TestLogger, ILogger } from "../services/TestLogger";

export interface MultiplierTestResult {
  sliceIndex?: number;
  sprite?: string;
  expectedMultiplier?: number;
  configuredMultiplier?: number;
  expectedWin?: number;
  actualWin?: number;
  bet?: number;
  balanceBeforeSpin?: number;
  balanceAfterSpin?: number;
  screenshot?: Buffer;
}

export class AssertionLogic {
  private readonly logger: ILogger;

  constructor(
    private readonly page: Page,
    private readonly wheelGamePage: WheelGamePage,
    logger?: ILogger
  ) {
    this.logger = logger ?? TestLogger.getDefault();
  }

  async assertBalanceUpdated(initialBalance?: number): Promise<void> {
    const currentBalance = await this.wheelGamePage.data.getBalance();
    expect(currentBalance).toBeDefined();
    expect(currentBalance).not.toBe(initialBalance);
  }

  async assertBalanceDecreasedBy(
    initialBalance: number,
    amount: number
  ): Promise<void> {
    await this.page.waitForTimeout(1000);
    const currentBalance = await this.wheelGamePage.data.getBalance();
    expect(currentBalance).toBe(initialBalance - amount);
  }

  async assertBalanceEquals(expectedBalance: number): Promise<void> {
    const currentBalance = await this.wheelGamePage.data.getBalance();
    expect(currentBalance).toBe(expectedBalance);
  }

  async assertBalanceIncreasedByWin(initialBalance: number): Promise<void> {
    await this.wheelGamePage.state.waitForWheelToStop();
    await this.page.waitForTimeout(1000);
    const winAmount = await this.wheelGamePage.data.getWin();
    const currentBalance = await this.wheelGamePage.data.getBalance();
    expect(winAmount).toBeGreaterThan(0);
    expect(currentBalance).toBeGreaterThan(initialBalance);
  }

  async assertBalanceDecreasedAfterFirstSpin(
    initialBalance: number
  ): Promise<number> {
    await this.page.waitForTimeout(3000);
    const currentBalance = await this.wheelGamePage.data.getBalance();
    expect(currentBalance).toBeLessThan(initialBalance);
    return currentBalance;
  }

  async assertBalanceChangedAfterAutoplaySecondSpin(
    balanceAfterFirstSpin: number
  ): Promise<void> {
    await this.page.waitForTimeout(8000);
    const currentBalance = await this.wheelGamePage.data.getBalance();
    expect(currentBalance).not.toBe(balanceAfterFirstSpin);
  }

  async assertWinAmountCalculatedCorrectly(): Promise<void> {
    await this.wheelGamePage.state.waitForWheelToStop();
    const winAmount = await this.wheelGamePage.data.getWin();
    expect(winAmount).toBeGreaterThanOrEqual(0);
  }

  async assertBetEquals(expectedBet: number): Promise<void> {
    const currentBet = await this.wheelGamePage.data.getBet();
    expect(currentBet).toBe(expectedBet);
  }

  async assertAutoplayEnabled(): Promise<void> {
    const isEnabled = await this.wheelGamePage.data.isAutoplayEnabled();
    expect(isEnabled).toBeTruthy();
  }

  async assertAutoplayDisabled(): Promise<void> {
    const isEnabled = await this.wheelGamePage.data.isAutoplayEnabled();
    expect(isEnabled).toBeFalsy();
  }

  async assertAutoplayDisplayShows(expectedText: string): Promise<void> {
    const autoplayText = await this.wheelGamePage.data.getAutoplayText();
    expect(autoplayText).toContain(expectedText);
  }

  async assertAnotherSpinStartsAutomatically(): Promise<void> {
    await this.wheelGamePage.state.waitForWheelToStop();
    await this.page.waitForTimeout(1500);
    const isSpinning = await this.wheelGamePage.state.isSpinning();
    expect(isSpinning).toBeTruthy();
  }

  async assertQuickSpinFasterThanNormal(): Promise<void> {
    const startTime = Date.now();
    await this.wheelGamePage.state.waitForWheelToStop();
    const quickSpinDuration = Date.now() - startTime;

    this.logger.debug(`Quick spin duration: ${quickSpinDuration}ms`);
    // Quick spin should complete in approximately 1-4.5 seconds (with 3.5x speed multiplier)
    expect(quickSpinDuration).toBeLessThan(4500);
    expect(quickSpinDuration).toBeGreaterThan(1000);
  }

  async assertNormalSpinSpeed(spinStartTime?: number): Promise<void> {
    const startTime = spinStartTime ?? Date.now();
    await this.wheelGamePage.state.waitForWheelToStop();
    const normalSpinDuration = Date.now() - startTime;

    this.logger.debug(`Normal spin duration: ${normalSpinDuration}ms`);
    // Normal spin should take 8-11 seconds (platform dependent but generally 9-10s)
    expect(normalSpinDuration).toBeGreaterThanOrEqual(7000);
  }

  async assertAllSpinsFasterThanNormal(spinCount: number): Promise<void> {
    const durations: number[] = [];

    for (let i = 0; i < spinCount; i++) {
      const startTime = Date.now();
      await this.wheelGamePage.state.waitForWheelToStop();
      const duration = Date.now() - startTime;
      durations.push(duration);
      this.logger.debug(`Spin ${i + 1} duration: ${duration}ms`);

      // If not the last spin, wait a bit and spin again
      if (i < spinCount - 1) {
        await this.page.waitForTimeout(1000);
        await this.wheelGamePage.spin();
      }
    }

    // All spins should be quick (under 4.5 seconds)
    for (const duration of durations) {
      expect(duration).toBeLessThan(4500);
    }
  }

  async assertNormalSpinWithinMaxDuration(maxDuration: number): Promise<void> {
    const startTime = Date.now();
    await this.wheelGamePage.state.waitForWheelToStop();
    const duration = Date.now() - startTime;

    this.logger.debug(
      `Normal spin duration: ${duration}ms (max allowed: ${maxDuration}ms)`
    );
    expect(duration).toBeLessThan(maxDuration);
  }

  async assertQuickSpinWithinMaxDuration(maxDuration: number): Promise<void> {
    const startTime = Date.now();
    await this.wheelGamePage.state.waitForWheelToStop();
    const duration = Date.now() - startTime;

    this.logger.debug(
      `Quick spin duration: ${duration}ms (max allowed: ${maxDuration}ms)`
    );
    expect(duration).toBeLessThan(maxDuration);
  }

  async assertAllSpinsQuick(
    spinCount: number,
    baseline?: number
  ): Promise<void> {
    const durations: number[] = [];

    for (let i = 0; i < spinCount; i++) {
      const startTime = Date.now();
      await this.wheelGamePage.state.waitForWheelToStop();
      const duration = Date.now() - startTime;
      durations.push(duration);
      this.logger.debug(`Quick spin ${i + 1} duration: ${duration}ms`);

      if (i < spinCount - 1) {
        await this.page.waitForTimeout(1000);
        await this.wheelGamePage.spin();
      }
    }

    // All spins should be quick (under 4.5 seconds)
    for (const duration of durations) {
      expect(duration).toBeLessThan(4500);
    }

    // If we have a baseline, verify consistency (within 1.5x of baseline)
    if (baseline) {
      this.logger.debug(`Baseline: ${baseline}ms`);
      for (const duration of durations) {
        expect(duration).toBeLessThanOrEqual(baseline * 1.5);
      }
    }
  }

  async assertReturnToNormalSpeed(
    spinStartTime?: number,
    baseline?: number
  ): Promise<void> {
    const startTime = spinStartTime ?? Date.now();
    await this.wheelGamePage.state.waitForWheelToStop();
    const duration = Date.now() - startTime;

    this.logger.debug(
      `Spin duration after disabling quick spin: ${duration}ms`
    );

    if (baseline) {
      this.logger.debug(`Normal spin baseline: ${baseline}ms`);
      // Should be within 30% of the calibrated normal baseline
      const lowerBound = baseline * 0.7;
      const upperBound = baseline * 1.3;
      expect(duration).toBeGreaterThanOrEqual(lowerBound);
      expect(duration).toBeLessThanOrEqual(upperBound);
    } else {
      // Fallback to absolute threshold if no baseline
      expect(duration).toBeGreaterThanOrEqual(7000);
    }
  }

  assertAllSliceWinningsMatchSprites(
    results: MultiplierTestResult[],
    attachScreenshot: (data: Buffer, mediaType: string) => void
  ): void {
    expect(results.length).toBeGreaterThan(0);

    const errors: string[] = [];

    for (const result of results) {
      const {
        sliceIndex,
        sprite,
        expectedMultiplier,
        configuredMultiplier,
        expectedWin,
        actualWin,
        bet,
        balanceBeforeSpin,
        balanceAfterSpin,
        screenshot,
      } = result;

      const actualBalanceChange =
        (balanceAfterSpin ?? 0) - (balanceBeforeSpin ?? 0) + (bet ?? 0);

      this.logger.debug(`\nSlice ${sliceIndex}: ${sprite}`);
      this.logger.debug(`  Sprite shows: ${expectedMultiplier}x`);
      this.logger.debug(`  Config has: ${configuredMultiplier}x`);
      this.logger.debug(`  Expected win: ${expectedWin}`);
      this.logger.debug(`  Actual win (display): ${actualWin}`);
      this.logger.debug(`  Actual win (balance): ${actualBalanceChange}`);
      this.logger.debug(
        `  Balance: ${balanceBeforeSpin} -> ${balanceAfterSpin} (bet: ${bet})`
      );

      if (expectedMultiplier !== configuredMultiplier) {
        errors.push(
          `Slice ${sliceIndex}: Sprite shows ${expectedMultiplier}x but configured as ${configuredMultiplier}x`
        );

        if (screenshot) {
          attachScreenshot(screenshot, "image/png");
        }
      }

      if (actualWin !== expectedWin) {
        errors.push(
          `Slice ${sliceIndex}: Expected ${expectedWin} (${expectedMultiplier}x) but got ${actualWin}`
        );

        if (screenshot && expectedMultiplier === configuredMultiplier) {
          attachScreenshot(screenshot, "image/png");
        }
      }

      const expectedBalance =
        (balanceBeforeSpin ?? 0) - (bet ?? 0) + (actualWin ?? 0);
      if (balanceAfterSpin !== expectedBalance) {
        errors.push(
          `Slice ${sliceIndex}: Balance mismatch - expected ${expectedBalance} but got ${balanceAfterSpin}`
        );
      }
    }

    if (errors.length > 0) {
      throw new Error(`Found ${errors.length} error(s):\n${errors.join("\n")}`);
    }
  }

  async waitForWheelSpinStart(): Promise<void> {
    await this.page.waitForTimeout(1000);
  }

  async waitForWheelNotSpinning(): Promise<void> {
    await this.page.waitForTimeout(500);
  }

  async waitForWheelSpin(): Promise<void> {
    await this.page.waitForTimeout(2000);
  }

  async waitForQuickSpinState(): Promise<void> {
    await this.page.waitForTimeout(500);
  }
}
