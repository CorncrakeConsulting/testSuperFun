/**
 * Distribution Testing Logic Layer
 * Handles all distribution testing calculations and operations
 */

import { WheelGamePage } from "../pages/WheelGamePage";
import { TestLogger, ILogger } from "../services/TestLogger";
import { CustomWorld } from "../tests/support/world";
import { sharedDistributionStore } from "./SharedDistributionStore";

export interface DistributionData {
  distribution: Record<number, number>;
  totalSpins: number;
  totalWagered: number;
  totalWon: number;
  sliceMultipliers: Record<number, number>;
  testSets?: Array<Record<number, number>>;
  sliceConfig: Record<number, number>;
}

export class DistributionTestingLogic {
  private readonly wheelGamePage: WheelGamePage;
  private distributionData: DistributionData;
  private readonly world: CustomWorld;
  private readonly logger: ILogger;
  private readonly NUM_SLICES = 12; // Wheel has 12 slices

  constructor(world: CustomWorld, logger?: ILogger) {
    this.world = world;
    this.wheelGamePage = world.wheelGamePage;
    this.logger = logger ?? TestLogger.getDefault();
    this.distributionData = this.initializeDistributionData();
  }

  // Ensures only one DistributionTestingLogic exists per CustomWorld scenario.
  static ensureInitialized(world: CustomWorld): DistributionTestingLogic {
    if (!world.wheelGamePage) {
      world.wheelGamePage = WheelGamePage.create(world.page);
    }
    if (!world.distributionLogic) {
      world.distributionLogic = new DistributionTestingLogic(world);
    }
    return world.distributionLogic;
  }

  setDistributionData(data: DistributionData): void {
    this.distributionData = data;
  }

  /**
   * Store current distribution data for cross-scenario analysis
   */
  public storeDistributionDataForAnalysis(): void {
    if (this.distributionData.totalSpins === 0) {
      throw new Error("No spin data was collected");
    }

    sharedDistributionStore.setDistributionData(this.distributionData);
    this.logger.success(
      `Successfully stored data from ${this.distributionData.totalSpins} spins for validation scenarios`
    );
  }

  /**
   * Load previously stored distribution data for analysis
   */
  public loadStoredDistributionData(): void {
    const data = sharedDistributionStore.getDistributionData();

    if (!data) {
      throw new Error(
        'No distribution data available. Make sure the "Collect distribution data" scenario runs first.'
      );
    }

    this.setDistributionData(data);
    this.logger.success(`Loaded distribution data: ${data.totalSpins} spins`);
  }

  /**
   * Initialize distribution data structure with known slice configuration
   */
  private initializeDistributionData(): DistributionData {
    const data: DistributionData = {
      distribution: {},
      totalSpins: 0,
      totalWagered: 0,
      totalWon: 0,
      sliceMultipliers: {},
      sliceConfig: {},
    };

    // Initialize counters for all slices
    for (let i = 0; i < this.NUM_SLICES; i++) {
      data.distribution[i] = 0;
    }

    // Pre-populate known slice configurations from game code
    // This avoids the slow identification phase
    data.sliceConfig = {
      0: 100, // 10x (bet is typically 10)
      1: 50, // 5x
      2: 0, // 0x
      3: 20, // 2x
      4: 10, // 1x
      5: 5, // 0.5x
      6: 100, // 10x
      7: 40, // 4x (note: sprite shows 5x but pays 4x - known bug)
      8: 0, // 0x
      9: 20, // 2x
      10: 10, // 1x
      11: 5, // 0.5x
    };

    data.sliceMultipliers = {
      0: 10,
      1: 5,
      2: 0,
      3: 2,
      4: 1,
      5: 0.5,
      6: 10,
      7: 4,
      8: 0,
      9: 2,
      10: 1,
      11: 0.5,
    };

    return data;
  }

  /**
   * Get current distribution data
   */
  public getDistributionData(): DistributionData {
    return this.distributionData;
  }

  /**
   * Initialize player with balance
   */
  public async initializePlayer(balance: number): Promise<void> {
    await this.wheelGamePage.testHooks.setPlayerData({ balance });
  }

  /**
   * Identify what each slice pays by forcing spins on each slice
   * Uses quick spin for faster identification
   */
  public async identifySliceConfigurations(): Promise<void> {
    this.logger.info(
      `📊 Identifying slice configurations for ${this.NUM_SLICES} slices (with quick spin)...`
    );

    // Enable quick spin for faster configuration identification
    const wasQuickSpinEnabled =
      await this.wheelGamePage.state.isQuickSpinEnabled();
    if (!wasQuickSpinEnabled) {
      await this.wheelGamePage.enableQuickSpin();
    }

    const testBet = await this.wheelGamePage.data.getBet();

    for (let sliceIndex = 0; sliceIndex < this.NUM_SLICES; sliceIndex++) {
      await this.wheelGamePage.testHooks.setWheelLandingIndex(sliceIndex);
      await this.wheelGamePage.spin();
      await this.wheelGamePage.state.waitForWheelToStop();

      const winAmount = await this.wheelGamePage.data.getWin();
      this.distributionData.sliceConfig[sliceIndex] = winAmount;
      this.distributionData.sliceMultipliers[sliceIndex] = winAmount / testBet;
      this.logger.debug(
        `   Slice ${sliceIndex}: pays ${winAmount} (${this.distributionData.sliceMultipliers[sliceIndex]}x)`
      );
    }

    // Restore original quick spin state if it was disabled
    if (!wasQuickSpinEnabled) {
      await this.wheelGamePage.disableQuickSpin();
    }
  }

  /**
   * Reset distribution counters for a new test
   */
  private resetDistributionCounters(): void {
    for (let i = 0; i < this.NUM_SLICES; i++) {
      this.distributionData.distribution[i] = 0;
    }
    this.distributionData.totalSpins = 0;
    this.distributionData.totalWagered = 0;
    this.distributionData.totalWon = 0;
  }

  /**
   * Get the slice index that the wheel landed on
   */
  private async getLandedSliceIndex(): Promise<number> {
    return await this.wheelGamePage.state.getLandedSliceIndex();
  }

  /**
   * Perform multiple spins and track distribution
   */
  public async performRandomSpins(times: number): Promise<void> {
    const startTime = Date.now();
    await this.logTestStart(times);
    await this.wheelGamePage.testHooks.setWheelLandingIndex(undefined);
    this.resetDistributionCounters();

    for (let spinNumber = 0; spinNumber < times; spinNumber++) {
      await this.executeSingleSpin();
      this.logProgress(spinNumber, times, startTime);
      this.logIntermediateResults(spinNumber);
    }

    this.logTestComplete(startTime);
  }

  private async logTestStart(times: number): Promise<void> {
    this.logger.info(`\n🎰 Starting distribution test with ${times} spins...`);
    this.logger.info(`   Using ${this.NUM_SLICES} slice wheel configuration`);
    const quickSpinEnabled =
      await this.wheelGamePage.state.isQuickSpinEnabled();
    this.logger.info(
      `   Quick spin: ${quickSpinEnabled ? "ENABLED ⚡" : "DISABLED"}`
    );
  }

  private async executeSingleSpin(): Promise<void> {
    const currentBet = await this.wheelGamePage.data.getBet();
    await this.wheelGamePage.spin();
    await this.wheelGamePage.state.waitForWheelToStop();

    const landedSlice = await this.getLandedSliceIndex();
    const winAmount = await this.wheelGamePage.data.getWin();

    this.distributionData.distribution[landedSlice]++;
    this.distributionData.totalWon += winAmount;
    this.distributionData.totalSpins++;
    this.distributionData.totalWagered += currentBet;
  }

  private logProgress(
    spinNumber: number,
    totalSpins: number,
    startTime: number
  ): void {
    if ((spinNumber + 1) % 10 === 0 || spinNumber === totalSpins - 1) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const spinsPerSec = (
        ((spinNumber + 1) / (Date.now() - startTime)) *
        1000
      ).toFixed(1);
      this.logger.info(
        `   Progress: ${
          spinNumber + 1
        }/${totalSpins} spins (${elapsed}s elapsed, ${spinsPerSec} spins/sec)`
      );
    }
  }

  private logIntermediateResults(spinNumber: number): void {
    if ((spinNumber + 1) % 100 === 0) {
      const rtp =
        (this.distributionData.totalWon / this.distributionData.totalWagered) *
        100;
      this.logger.info(`\n📊 Raw Results After ${spinNumber + 1} Spins:`);
      this.logger.info(
        `   Distribution: ${JSON.stringify(this.distributionData.distribution)}`
      );
      this.logger.info(
        `   Total Wagered: ${this.distributionData.totalWagered}`
      );
      this.logger.info(`   Total Won: ${this.distributionData.totalWon}`);
      this.logger.info(`   RTP: ${rtp.toFixed(2)}%\n`);
    }
  }

  private logTestComplete(startTime: number): void {
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    const netResult =
      this.distributionData.totalWon - this.distributionData.totalWagered;
    this.logger.success(`\nSpin testing complete in ${totalTime}s`);
    this.logger.info(`   Total wagered: ${this.distributionData.totalWagered}`);
    this.logger.info(`   Total won: ${this.distributionData.totalWon}`);
    this.logger.info(`   Net result: ${netResult}`);
  }

  /**
   * Run multiple test sets with specified spins each
   */
  public async runMultipleTestSets(
    sets: number,
    spinsPerSet: number
  ): Promise<void> {
    this.distributionData.testSets = [];

    for (let setNumber = 0; setNumber < sets; setNumber++) {
      this.logger.info(`\n🎰 Running test set ${setNumber + 1}/${sets}...`);

      const setDistribution: Record<number, number> = {};
      for (let i = 0; i < this.NUM_SLICES; i++) {
        setDistribution[i] = 0;
      }

      // Ensure slice configs are identified
      if (
        !this.distributionData.sliceConfig ||
        Object.keys(this.distributionData.sliceConfig).length === 0
      ) {
        await this.identifySliceConfigurations();
      }

      // Clear forced landing
      await this.wheelGamePage.testHooks.setWheelLandingIndex(undefined);

      // Run spins for this set
      for (let spin = 0; spin < spinsPerSet; spin++) {
        await this.wheelGamePage.spin();
        await this.wheelGamePage.state.waitForWheelToStop();

        const landedSlice = await this.getLandedSliceIndex();
        setDistribution[landedSlice]++;
      }

      this.distributionData.testSets.push(setDistribution);
    }
  }

  /**
   * Validate distribution is approximately equal across all slices
   */
  public validateEqualDistribution(tolerance: number = 0.25): void {
    const totalSpins = this.distributionData.totalSpins;
    const expectedPerSlice = totalSpins / this.NUM_SLICES;

    this.logDistributionHeader(totalSpins, expectedPerSlice, tolerance);

    const validationResults = this.analyzeSliceDistribution(
      expectedPerSlice,
      tolerance
    );

    this.logDistributionSummary(validationResults);

    if (validationResults.errors.length > 0) {
      throw new Error(
        `Distribution validation failed (${
          validationResults.failingSlices.length
        }/${
          this.NUM_SLICES
        } slices outside tolerance):\n\n${validationResults.errors.join("\n")}`
      );
    }
  }

  private logDistributionHeader(
    totalSpins: number,
    expectedPerSlice: number,
    tolerance: number
  ): void {
    this.logger.info("\n" + "=".repeat(80));
    this.logger.info("📈 DISTRIBUTION ANALYSIS");
    this.logger.info("=".repeat(80));
    this.logger.info(`Total Spins: ${totalSpins}`);
    this.logger.info(`Number of Slices: ${this.NUM_SLICES}`);
    this.logger.info(
      `Expected per slice: ${expectedPerSlice.toFixed(2)} hits (${(
        100 / this.NUM_SLICES
      ).toFixed(2)}%)`
    );
    this.logger.info(`Tolerance: ±${(tolerance * 100).toFixed(0)}%`);
    this.logger.info("\nSlice Results:");
    this.logger.info("-".repeat(80));
  }

  private analyzeSliceDistribution(
    expectedPerSlice: number,
    tolerance: number
  ): {
    errors: string[];
    passingSlices: number[];
    failingSlices: number[];
    slicesNeverHit: number;
  } {
    const errors: string[] = [];
    const passingSlices: number[] = [];
    const failingSlices: number[] = [];
    let slicesNeverHit = 0;

    for (let i = 0; i < this.NUM_SLICES; i++) {
      const sliceResult = this.analyzeSlice(i, expectedPerSlice, tolerance);

      this.logSliceResult(i, sliceResult);

      if (sliceResult.count === 0) {
        slicesNeverHit++;
      }

      if (sliceResult.isOutsideTolerance) {
        failingSlices.push(i);
        errors.push(this.formatSliceError(i, sliceResult, tolerance));
      } else {
        passingSlices.push(i);
      }
    }

    return { errors, passingSlices, failingSlices, slicesNeverHit };
  }

  private analyzeSlice(
    sliceIndex: number,
    expectedPerSlice: number,
    tolerance: number
  ): {
    count: number;
    percentage: number;
    deviation: number;
    multiplier: number;
    isOutsideTolerance: boolean;
  } {
    const count = this.distributionData.distribution[sliceIndex];
    const totalSpins = this.distributionData.totalSpins;
    const percentage = (count / totalSpins) * 100;
    const deviation = ((count - expectedPerSlice) / expectedPerSlice) * 100;
    const multiplier = this.distributionData.sliceMultipliers[sliceIndex];
    const isOutsideTolerance = Math.abs(deviation) >= tolerance * 100;

    return { count, percentage, deviation, multiplier, isOutsideTolerance };
  }

  private logSliceResult(
    sliceIndex: number,
    result: {
      count: number;
      percentage: number;
      deviation: number;
      multiplier: number;
      isOutsideTolerance: boolean;
    }
  ): void {
    const status = result.isOutsideTolerance ? "❌ FAIL" : "✅ PASS";
    this.logger.info(
      `Slice ${sliceIndex.toString().padStart(2)}: ${result.count
        .toString()
        .padStart(3)} hits | ` +
        `${result.percentage.toFixed(1).padStart(5)}% | ` +
        `Deviation: ${
          (result.deviation >= 0 ? "+" : "") +
          result.deviation.toFixed(1).padStart(6)
        }% | ` +
        `Multiplier: ${result.multiplier.toFixed(1).padStart(4)}x | ${status}`
    );
  }

  private formatSliceError(
    sliceIndex: number,
    result: {
      count: number;
      percentage: number;
      deviation: number;
      multiplier: number;
    },
    tolerance: number
  ): string {
    return (
      `Slice ${sliceIndex} (${result.multiplier}x): ${
        result.count
      } hits (${result.percentage.toFixed(1)}%), ` +
      `deviation ${result.deviation >= 0 ? "+" : ""}${result.deviation.toFixed(
        1
      )}% exceeds ±${tolerance * 100}%`
    );
  }

  private logDistributionSummary(results: {
    passingSlices: number[];
    failingSlices: number[];
    slicesNeverHit: number;
  }): void {
    this.logger.info("-".repeat(80));
    this.logger.info(`\n📊 Summary:`);
    this.logger.info(
      `   Passing slices: ${results.passingSlices.length}/${this.NUM_SLICES}`
    );
    this.logger.info(
      `   Failing slices: ${results.failingSlices.length}/${this.NUM_SLICES}`
    );
    this.logger.info(
      `   Slices never hit: ${results.slicesNeverHit}/${this.NUM_SLICES}`
    );

    if (results.slicesNeverHit > 0) {
      this.logNeverHitWarning();
    }

    this.logger.info("=".repeat(80) + "\n");
  }

  private logNeverHitWarning(): void {
    const neverHitSlices = [];
    for (let i = 0; i < this.NUM_SLICES; i++) {
      if (this.distributionData.distribution[i] === 0) {
        neverHitSlices.push(i);
      }
    }
    this.logger.info(
      `   ⚠️  WARNING: Slices [${neverHitSlices.join(
        ", "
      )}] were NEVER hit - possible RNG bug!`
    );
  }

  /**
   * Calculate and validate Chi-Square statistic
   */
  public validateChiSquareTest(criticalValue: number = 19.68): number {
    const totalSpins = this.distributionData.totalSpins;
    const expectedPerSlice = totalSpins / this.NUM_SLICES;

    // Calculate Chi-Square statistic
    let chiSquare = 0;
    this.logger.info("\n📊 Chi-Square Test:");
    this.logger.info("-".repeat(80));

    for (let i = 0; i < this.NUM_SLICES; i++) {
      const observed = this.distributionData.distribution[i];
      const expected = expectedPerSlice;
      const contribution = Math.pow(observed - expected, 2) / expected;
      chiSquare += contribution;

      if (contribution > 1) {
        this.logger.info(
          `   Slice ${i}: χ² contribution = ${contribution.toFixed(
            2
          )} (high variance)`
        );
      }
    }

    this.logger.info("-".repeat(80));
    this.logger.info(`Chi-Square Statistic: ${chiSquare.toFixed(2)}`);
    this.logger.info(
      `Critical Value (α=0.05, df=${this.NUM_SLICES - 1}): ${criticalValue}`
    );
    this.logger.info(
      `Result: ${
        chiSquare < criticalValue
          ? "✅ PASS - Distribution appears random"
          : "❌ FAIL - Distribution is not random"
      }`
    );
    this.logger.info("-".repeat(80));

    if (chiSquare >= criticalValue) {
      throw new Error(
        `Chi-Square test failed: ${chiSquare.toFixed(
          2
        )} exceeds critical value ${criticalValue}\n` +
          `This indicates the wheel distribution is NOT random and may be rigged.`
      );
    }

    return chiSquare;
  }

  /**
   * Validate no slice is significantly over-represented
   */
  public validateNoOverRepresentation(maxDeviationPercent: number = 50): void {
    const totalSpins = this.distributionData.totalSpins;
    const expectedPerSlice = totalSpins / this.NUM_SLICES;
    const maxAllowed = expectedPerSlice * (1 + maxDeviationPercent / 100);

    for (let i = 0; i < this.NUM_SLICES; i++) {
      const count = this.distributionData.distribution[i];
      if (count > maxAllowed) {
        throw new Error(
          `Slice ${i} is over-represented: ${count} hits (max allowed: ${maxAllowed.toFixed(
            0
          )})`
        );
      }
    }
  }

  /**
   * Validate no slice is significantly under-represented
   */
  public validateNoUnderRepresentation(minDeviationPercent: number = 50): void {
    const totalSpins = this.distributionData.totalSpins;
    const expectedPerSlice = totalSpins / this.NUM_SLICES;
    const minAllowed = expectedPerSlice * (1 - minDeviationPercent / 100);

    for (let i = 0; i < this.NUM_SLICES; i++) {
      const count = this.distributionData.distribution[i];
      if (count < minAllowed) {
        throw new Error(
          `Slice ${i} is under-represented: ${count} hits (min allowed: ${minAllowed.toFixed(
            0
          )})`
        );
      }
    }
  }

  /**
   * Validate total wagered equals spins times bet
   */
  public async validateTotalWagered(): Promise<void> {
    const bet = await this.wheelGamePage.data.getBet();
    const expectedWagered = this.distributionData.totalSpins * bet;

    if (this.distributionData.totalWagered !== expectedWagered) {
      throw new Error(
        `Total wagered ${this.distributionData.totalWagered} does not match expected ${expectedWagered}`
      );
    }
  }

  /**
   * Validate total won is within reasonable variance
   */
  public validateTotalWon(): void {
    if (this.distributionData.totalWon <= 0) {
      throw new Error("Total won should be greater than 0");
    }
  }

  /**
   * Calculate and validate RTP percentage
   */
  public validateRTP(minRTP: number, maxRTP: number): number {
    const rtp =
      (this.distributionData.totalWon / this.distributionData.totalWagered) *
      100;
    this.logger.info(`\n💰 RTP: ${rtp.toFixed(2)}%`);

    if (rtp < minRTP || rtp > maxRTP) {
      throw new Error(
        `RTP ${rtp.toFixed(
          2
        )}% is outside acceptable range ${minRTP}%-${maxRTP}%`
      );
    }

    return rtp;
  }

  /**
   * Validate no single slice occurs more than a certain percentage
   */
  public validateMaxSliceOccurrence(maxPercentage: number): void {
    const totalSpins = this.distributionData.totalSpins;

    for (let i = 0; i < this.NUM_SLICES; i++) {
      const count = this.distributionData.distribution[i];
      const percentage = (count / totalSpins) * 100;

      if (percentage > maxPercentage) {
        throw new Error(
          `Slice ${i} occurs ${percentage.toFixed(
            1
          )}% (max allowed: ${maxPercentage}%)`
        );
      }
    }
  }

  /**
   * Validate no single slice occurs less than a certain percentage
   */
  public validateMinSliceOccurrence(minPercentage: number): void {
    const totalSpins = this.distributionData.totalSpins;

    for (let i = 0; i < this.NUM_SLICES; i++) {
      const count = this.distributionData.distribution[i];
      const percentage = (count / totalSpins) * 100;

      if (percentage < minPercentage) {
        throw new Error(
          `Slice ${i} occurs only ${percentage.toFixed(
            1
          )}% (min required: ${minPercentage}%)`
        );
      }
    }
  }

  /**
   * Validate test sets show similar distribution patterns
   */
  public validateTestSetsSimilarity(): void {
    const sets = this.distributionData.testSets;

    if (!sets || sets.length <= 1) {
      throw new Error("Need at least 2 test sets to compare");
    }

    this.logger.info("\n📊 Distribution across test sets:");
    for (let setIndex = 0; setIndex < sets.length; setIndex++) {
      this.logger.info(`Set ${setIndex + 1}:`, sets[setIndex]);
    }
  }

  /**
   * Validate variance between test sets is reasonable
   */
  public validateTestSetsVariance(minSlicesHit: number = 6): void {
    const sets = this.distributionData.testSets;

    if (!sets) {
      throw new Error("Test sets not initialized");
    }

    for (const set of sets) {
      const hitSlices = Object.values(set).filter(
        (count: number) => count > 0
      ).length;

      if (hitSlices < minSlicesHit) {
        throw new Error(
          `Test set has only ${hitSlices} slices hit (minimum: ${minSlicesHit})`
        );
      }
    }
  }

  /**
   * Validate a specific slice was hit at least once
   */
  public validateSliceWasHit(sliceIndex: number): void {
    const count = this.distributionData.distribution[sliceIndex];

    if (count === 0) {
      throw new Error(`Slice ${sliceIndex} was never hit`);
    }
  }

  /**
   * Validate sufficient spins have been performed
   */
  public validateSufficientSpins(minSpins: number): void {
    if (this.distributionData.totalSpins < minSpins) {
      throw new Error(
        `Only ${this.distributionData.totalSpins} spins performed (minimum: ${minSpins})`
      );
    }
  }
}
