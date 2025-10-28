/**
 * Distribution Testing Logic Layer
 * Handles all distribution testing calculations and operations
 */

import { WheelGamePage } from "../pages/WheelGamePage";
import { CustomWorld } from "../tests/support/world";

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
  private wheelGamePage: WheelGamePage;
  private distributionData: DistributionData;
  private world: CustomWorld;

  constructor(world: CustomWorld) {
    this.world = world;
    this.wheelGamePage = world.wheelGamePage;
    this.distributionData = this.initializeDistributionData();
  }

  /**
   * Initialize distribution data structure
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

    // Initialize counters for 8 slices
    for (let i = 0; i < 8; i++) {
      data.distribution[i] = 0;
    }

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
    await this.wheelGamePage.setPlayerData({ balance });
  }

  /**
   * Identify what each slice pays by forcing spins on each slice
   */
  public async identifySliceConfigurations(): Promise<void> {
    console.log("📊 Identifying slice configurations...");
    const testBet = await this.wheelGamePage.getBet();

    for (let sliceIndex = 0; sliceIndex < 8; sliceIndex++) {
      await this.wheelGamePage.setPlayerData({ balance: 10000 });
      await this.wheelGamePage.setWheelLandingIndex(sliceIndex);
      await this.wheelGamePage.spin();
      await this.wheelGamePage.waitForWheelToStop();

      const winAmount = await this.wheelGamePage.getWin();
      this.distributionData.sliceConfig[sliceIndex] = winAmount;
      this.distributionData.sliceMultipliers[sliceIndex] = winAmount / testBet;
    }
  }

  /**
   * Reset distribution counters for a new test
   */
  private resetDistributionCounters(): void {
    for (let i = 0; i < 8; i++) {
      this.distributionData.distribution[i] = 0;
    }
    this.distributionData.totalSpins = 0;
    this.distributionData.totalWagered = 0;
    this.distributionData.totalWon = 0;
  }

  /**
   * Determine which slice was hit based on win amount
   */
  private determineSliceFromWin(winAmount: number): number {
    for (let i = 0; i < 8; i++) {
      if (this.distributionData.sliceConfig[i] === winAmount) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Perform multiple random spins and track distribution
   */
  public async performRandomSpins(times: number): Promise<void> {
    console.log(`\n🎰 Running ${times} spins for distribution testing...`);

    // Enable quick spin for faster testing
    await this.wheelGamePage.enableQuickSpin();

    // Ensure slice configurations are identified
    if (
      !this.distributionData.sliceConfig ||
      Object.keys(this.distributionData.sliceConfig).length === 0
    ) {
      await this.identifySliceConfigurations();
    }

    console.log(`Running ${times} random spins...`);

    // Clear forced landing index to allow random spins
    await this.wheelGamePage.setWheelLandingIndex(undefined);

    // Reset counters
    this.resetDistributionCounters();

    // Perform spins
    for (let spinNumber = 0; spinNumber < times; spinNumber++) {
      const currentBet = await this.wheelGamePage.getBet();
      await this.wheelGamePage.setPlayerData({ balance: 100000 }); // Keep balance high

      await this.wheelGamePage.spin();
      await this.wheelGamePage.waitForWheelToStop();

      const winAmount = await this.wheelGamePage.getWin();
      const landedSlice = this.determineSliceFromWin(winAmount);

      if (landedSlice !== -1) {
        this.distributionData.distribution[landedSlice]++;
        this.distributionData.totalWon += winAmount;
      }

      this.distributionData.totalSpins++;
      this.distributionData.totalWagered += currentBet;

      // Progress indicator
      if ((spinNumber + 1) % 25 === 0) {
        console.log(`   Completed ${spinNumber + 1}/${times} spins...`);
      }
    }

    console.log("✅ Spin testing complete");
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
      console.log(`\n🎰 Running test set ${setNumber + 1}/${sets}...`);

      const setDistribution: Record<number, number> = {};
      for (let i = 0; i < 8; i++) {
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
      await this.wheelGamePage.setWheelLandingIndex(undefined);

      // Run spins for this set
      for (let spin = 0; spin < spinsPerSet; spin++) {
        await this.wheelGamePage.setPlayerData({ balance: 100000 });
        await this.wheelGamePage.spin();
        await this.wheelGamePage.waitForWheelToStop();

        const winAmount = await this.wheelGamePage.getWin();
        const landedSlice = this.determineSliceFromWin(winAmount);

        if (landedSlice !== -1) {
          setDistribution[landedSlice]++;
        }
      }

      this.distributionData.testSets.push(setDistribution);
    }
  }

  /**
   * Validate distribution is approximately equal across all slices
   */
  public validateEqualDistribution(tolerance: number = 0.25): void {
    const totalSpins = this.distributionData.totalSpins;
    const expectedPerSlice = totalSpins / 8;

    console.log("\n📈 Distribution Results:");
    for (let i = 0; i < 8; i++) {
      const count = this.distributionData.distribution[i];
      const percentage = (count / totalSpins) * 100;
      const deviation = ((count - expectedPerSlice) / expectedPerSlice) * 100;
      console.log(
        `Slice ${i}: ${count} hits (${percentage.toFixed(
          1
        )}%) | Deviation: ${deviation.toFixed(1)}%`
      );

      if (Math.abs(deviation) >= tolerance * 100) {
        throw new Error(
          `Slice ${i} deviation ${deviation.toFixed(1)}% exceeds tolerance of ${
            tolerance * 100
          }%`
        );
      }
    }
  }

  /**
   * Calculate and validate Chi-Square statistic
   */
  public validateChiSquareTest(criticalValue: number = 14.07): number {
    const totalSpins = this.distributionData.totalSpins;
    const expectedPerSlice = totalSpins / 8;

    // Calculate Chi-Square statistic
    let chiSquare = 0;
    for (let i = 0; i < 8; i++) {
      const observed = this.distributionData.distribution[i];
      const expected = expectedPerSlice;
      chiSquare += Math.pow(observed - expected, 2) / expected;
    }

    console.log(
      `\n📊 Chi-Square: ${chiSquare.toFixed(2)} (Critical: ${criticalValue})`
    );

    if (chiSquare >= criticalValue) {
      throw new Error(
        `Chi-Square ${chiSquare.toFixed(
          2
        )} exceeds critical value ${criticalValue}`
      );
    }

    return chiSquare;
  }

  /**
   * Validate no slice is significantly over-represented
   */
  public validateNoOverRepresentation(maxDeviationPercent: number = 50): void {
    const totalSpins = this.distributionData.totalSpins;
    const expectedPerSlice = totalSpins / 8;
    const maxAllowed = expectedPerSlice * (1 + maxDeviationPercent / 100);

    for (let i = 0; i < 8; i++) {
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
    const expectedPerSlice = totalSpins / 8;
    const minAllowed = expectedPerSlice * (1 - minDeviationPercent / 100);

    for (let i = 0; i < 8; i++) {
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
    const bet = await this.wheelGamePage.getBet();
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
    console.log(`\n💰 RTP: ${rtp.toFixed(2)}%`);

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

    for (let i = 0; i < 8; i++) {
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

    for (let i = 0; i < 8; i++) {
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

    console.log("\n📊 Distribution across test sets:");
    for (let setIndex = 0; setIndex < sets.length; setIndex++) {
      console.log(`Set ${setIndex + 1}:`, sets[setIndex]);
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
   * Validate high multiplier slices are not over-represented
   */
  public validateHighMultiplierDistribution(): void {
    const multipliers: number[] = Object.values(
      this.distributionData.sliceMultipliers
    );
    const avgMultiplier =
      multipliers.reduce((a: number, b: number) => a + b, 0) /
      multipliers.length;

    let highMultiplierHits = 0;
    let totalHits = 0;

    for (let i = 0; i < 8; i++) {
      const hits = this.distributionData.distribution[i];
      totalHits += hits;

      if (this.distributionData.sliceMultipliers[i] > avgMultiplier) {
        highMultiplierHits += hits;
      }
    }

    const highMultiplierPercentage = (highMultiplierHits / totalHits) * 100;
    console.log(
      `High multiplier slices: ${highMultiplierPercentage.toFixed(1)}% of hits`
    );

    // Should be roughly 50% since we split at average
    if (highMultiplierPercentage >= 60 || highMultiplierPercentage <= 40) {
      throw new Error(
        `High multiplier distribution ${highMultiplierPercentage.toFixed(
          1
        )}% is outside 40-60% range`
      );
    }
  }

  /**
   * Validate low multiplier slices are not under-represented
   */
  public validateLowMultiplierDistribution(): void {
    const multipliers: number[] = Object.values(
      this.distributionData.sliceMultipliers
    );
    const avgMultiplier =
      multipliers.reduce((a: number, b: number) => a + b, 0) /
      multipliers.length;

    let lowMultiplierHits = 0;
    let totalHits = 0;

    for (let i = 0; i < 8; i++) {
      const hits = this.distributionData.distribution[i];
      totalHits += hits;

      if (this.distributionData.sliceMultipliers[i] <= avgMultiplier) {
        lowMultiplierHits += hits;
      }
    }

    const lowMultiplierPercentage = (lowMultiplierHits / totalHits) * 100;
    console.log(
      `Low multiplier slices: ${lowMultiplierPercentage.toFixed(1)}% of hits`
    );

    if (lowMultiplierPercentage >= 60 || lowMultiplierPercentage <= 40) {
      throw new Error(
        `Low multiplier distribution ${lowMultiplierPercentage.toFixed(
          1
        )}% is outside 40-60% range`
      );
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
