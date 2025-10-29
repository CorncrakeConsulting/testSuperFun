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
  private readonly wheelGamePage: WheelGamePage;
  private readonly distributionData: DistributionData;
  private readonly world: CustomWorld;
  private readonly NUM_SLICES = 12; // Wheel has 12 slices

  constructor(world: CustomWorld) {
    this.world = world;
    this.wheelGamePage = world.wheelGamePage;
    this.distributionData = this.initializeDistributionData();
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
      0: 100,  // 10x (bet is typically 10)
      1: 50,   // 5x
      2: 0,    // 0x
      3: 20,   // 2x
      4: 10,   // 1x
      5: 5,    // 0.5x
      6: 100,  // 10x
      7: 40,   // 4x (note: sprite shows 5x but pays 4x - known bug)
      8: 0,    // 0x
      9: 20,   // 2x
      10: 10,  // 1x
      11: 5    // 0.5x
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
      11: 0.5
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
    await this.wheelGamePage.setPlayerData({ balance });
  }

  /**
   * Identify what each slice pays by forcing spins on each slice
   * Uses quick spin for faster identification
   */
  public async identifySliceConfigurations(): Promise<void> {
    console.log(`📊 Identifying slice configurations for ${this.NUM_SLICES} slices (with quick spin)...`);
    
    // Enable quick spin for faster configuration identification
    const wasQuickSpinEnabled = await this.wheelGamePage.isQuickSpinEnabled();
    if (!wasQuickSpinEnabled) {
      await this.wheelGamePage.enableQuickSpin();
    }
    
    const testBet = await this.wheelGamePage.getBet();

    for (let sliceIndex = 0; sliceIndex < this.NUM_SLICES; sliceIndex++) {
      await this.wheelGamePage.setWheelLandingIndex(sliceIndex);
      await this.wheelGamePage.spin();
      await this.wheelGamePage.waitForWheelToStop();

      const winAmount = await this.wheelGamePage.getWin();
      this.distributionData.sliceConfig[sliceIndex] = winAmount;
      this.distributionData.sliceMultipliers[sliceIndex] = winAmount / testBet;
      console.log(`   Slice ${sliceIndex}: pays ${winAmount} (${this.distributionData.sliceMultipliers[sliceIndex]}x)`);
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
    return await this.wheelGamePage.getLandedSliceIndex();
  }

  /**
   * Perform multiple spins and track distribution
   */
  public async performRandomSpins(times: number): Promise<void> {
    const startTime = Date.now();
    console.log(`\n🎰 Starting distribution test with ${times} spins...`);
    console.log(`   Using ${this.NUM_SLICES} slice wheel configuration`);
    console.log(`   Quick spin: ${await this.wheelGamePage.isQuickSpinEnabled() ? 'ENABLED ⚡' : 'DISABLED'}`);

    await this.wheelGamePage.setWheelLandingIndex(undefined);

    // Reset counters
    this.resetDistributionCounters();

    // Perform spins
    for (let spinNumber = 0; spinNumber < times; spinNumber++) {
      const currentBet = await this.wheelGamePage.getBet();

      await this.wheelGamePage.spin();
      await this.wheelGamePage.waitForWheelToStop();

      // Get the actual slice index the wheel landed on
      const landedSlice = await this.getLandedSliceIndex();
      const winAmount = await this.wheelGamePage.getWin();

      this.distributionData.distribution[landedSlice]++;
      this.distributionData.totalWon += winAmount;
      this.distributionData.totalSpins++;
      this.distributionData.totalWagered += currentBet;

      // Progress indicator
      if ((spinNumber + 1) % 10 === 0 || spinNumber === times - 1) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const spinsPerSec = ((spinNumber + 1) / (Date.now() - startTime) * 1000).toFixed(1);
        console.log(`   Progress: ${spinNumber + 1}/${times} spins (${elapsed}s elapsed, ${spinsPerSec} spins/sec)`);
      }

      // Print raw results every 100 spins
      if ((spinNumber + 1) % 100 === 0) {
        console.log(`\n📊 Raw Results After ${spinNumber + 1} Spins:`);
        console.log(`   Distribution: ${JSON.stringify(this.distributionData.distribution)}`);
        console.log(`   Total Wagered: ${this.distributionData.totalWagered}`);
        console.log(`   Total Won: ${this.distributionData.totalWon}`);
        console.log(`   RTP: ${((this.distributionData.totalWon / this.distributionData.totalWagered) * 100).toFixed(2)}%\n`);
      }
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✅ Spin testing complete in ${totalTime}s`);
    console.log(`   Total wagered: ${this.distributionData.totalWagered}`);
    console.log(`   Total won: ${this.distributionData.totalWon}`);
    console.log(`   Net result: ${this.distributionData.totalWon - this.distributionData.totalWagered}`);
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
        await this.wheelGamePage.spin();
        await this.wheelGamePage.waitForWheelToStop();

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

    console.log("\n" + "=".repeat(80));
    console.log("📈 DISTRIBUTION ANALYSIS");
    console.log("=".repeat(80));
    console.log(`Total Spins: ${totalSpins}`);
    console.log(`Number of Slices: ${this.NUM_SLICES}`);
    console.log(`Expected per slice: ${expectedPerSlice.toFixed(2)} hits (${(100/this.NUM_SLICES).toFixed(2)}%)`);
    console.log(`Tolerance: ±${(tolerance * 100).toFixed(0)}%`);
    console.log("\nSlice Results:");
    console.log("-".repeat(80));
    
    const errors: string[] = [];
    const passingSlices: number[] = [];
    const failingSlices: number[] = [];
    let slicesNeverHit = 0;
    
    for (let i = 0; i < this.NUM_SLICES; i++) {
      const count = this.distributionData.distribution[i];
      const percentage = (count / totalSpins) * 100;
      const deviation = ((count - expectedPerSlice) / expectedPerSlice) * 100;
      const multiplier = this.distributionData.sliceMultipliers[i];
      const status = Math.abs(deviation) < tolerance * 100 ? "✅ PASS" : "❌ FAIL";
      
      console.log(
        `Slice ${i.toString().padStart(2)}: ${count.toString().padStart(3)} hits | ` +
        `${percentage.toFixed(1).padStart(5)}% | ` +
        `Deviation: ${(deviation >= 0 ? '+' : '') + deviation.toFixed(1).padStart(6)}% | ` +
        `Multiplier: ${multiplier.toFixed(1).padStart(4)}x | ${status}`
      );

      if (count === 0) {
        slicesNeverHit++;
      }

      if (Math.abs(deviation) >= tolerance * 100) {
        failingSlices.push(i);
        errors.push(
          `Slice ${i} (${multiplier}x): ${count} hits (${percentage.toFixed(1)}%), ` +
          `deviation ${(deviation >= 0 ? '+' : '')}${deviation.toFixed(1)}% exceeds ±${tolerance * 100}%`
        );
      } else {
        passingSlices.push(i);
      }
    }
    
    console.log("-".repeat(80));
    console.log(`\n📊 Summary:`);
    console.log(`   Passing slices: ${passingSlices.length}/${this.NUM_SLICES}`);
    console.log(`   Failing slices: ${failingSlices.length}/${this.NUM_SLICES}`);
    console.log(`   Slices never hit: ${slicesNeverHit}/${this.NUM_SLICES}`);
    
    if (slicesNeverHit > 0) {
      const neverHitSlices = [];
      for (let i = 0; i < this.NUM_SLICES; i++) {
        if (this.distributionData.distribution[i] === 0) {
          neverHitSlices.push(i);
        }
      }
      console.log(`   ⚠️  WARNING: Slices [${neverHitSlices.join(', ')}] were NEVER hit - possible RNG bug!`);
    }
    
    console.log("=".repeat(80) + "\n");
    
    if (errors.length > 0) {
      throw new Error(
        `Distribution validation failed (${failingSlices.length}/${this.NUM_SLICES} slices outside tolerance):\n\n${errors.join('\n')}`
      );
    }
  }

  /**
   * Calculate and validate Chi-Square statistic
   */
  public validateChiSquareTest(criticalValue: number = 19.68): number {
    const totalSpins = this.distributionData.totalSpins;
    const expectedPerSlice = totalSpins / this.NUM_SLICES;

    // Calculate Chi-Square statistic
    let chiSquare = 0;
    console.log("\n📊 Chi-Square Test:");
    console.log("-".repeat(80));
    
    for (let i = 0; i < this.NUM_SLICES; i++) {
      const observed = this.distributionData.distribution[i];
      const expected = expectedPerSlice;
      const contribution = Math.pow(observed - expected, 2) / expected;
      chiSquare += contribution;
      
      if (contribution > 1) {
        console.log(`   Slice ${i}: χ² contribution = ${contribution.toFixed(2)} (high variance)`);
      }
    }

    console.log("-".repeat(80));
    console.log(`Chi-Square Statistic: ${chiSquare.toFixed(2)}`);
    console.log(`Critical Value (α=0.05, df=${this.NUM_SLICES - 1}): ${criticalValue}`);
    console.log(`Result: ${chiSquare < criticalValue ? '✅ PASS - Distribution appears random' : '❌ FAIL - Distribution is not random'}`);
    console.log("-".repeat(80));

    if (chiSquare >= criticalValue) {
      throw new Error(
        `Chi-Square test failed: ${chiSquare.toFixed(2)} exceeds critical value ${criticalValue}\n` +
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
