/// <reference path="../types/global.d.ts" />
import { Page } from "@playwright/test";
import { WheelGamePage } from "../pages/WheelGamePage";
import { WheelState } from "../types/WheelState";
import { TestLogger, ITestLogger } from "../services/TestLogger";

/**
 * Configuration options for autoplay testing behavior
 */
export interface AutoplayTestingOptions {
  /** Polling interval in milliseconds for checking wheel state (default: 50) */
  pollInterval?: number;
  /** Maximum wait time per spin in milliseconds (default: 8000) */
  maxWaitTimePerSpin?: number;
  /** Whether to track and report unexpected state transitions (default: true) */
  trackStateTransitions?: boolean;
  /** Whether to verify quick spin is enabled during autoplay (default: false) */
  verifyQuickSpin?: boolean;
  /** Logger instance for test output (optional, uses default if not provided) */
  logger?: ITestLogger;
}

/**
 * Business logic for autoplay testing
 * Handles verification that autoplay triggers multiple spins
 */
export class AutoplayTestingLogic {
  private readonly pollInterval: number;
  private readonly maxWaitTimePerSpin: number;
  private readonly trackStateTransitions: boolean;
  private readonly verifyQuickSpin: boolean;
  private readonly logger: ITestLogger;

  constructor(
    private readonly page: Page,
    private readonly wheelGamePage: WheelGamePage,
    options: AutoplayTestingOptions = {}
  ) {
    this.pollInterval = options.pollInterval ?? 50;
    this.maxWaitTimePerSpin = options.maxWaitTimePerSpin ?? 8000;
    this.trackStateTransitions = options.trackStateTransitions ?? true;
    this.verifyQuickSpin = options.verifyQuickSpin ?? false;
    this.logger = options.logger ?? TestLogger.getDefault();
  }

  /**
   * Verify that the wheel completes the expected number of automatic spins
   * Tracks wheel state transitions from SPINNING/RESOLVING to IDLE/RESOLVED
   *
   * @param spinCount - Expected number of spins to complete
   * @throws Error if the expected number of spins don't complete in time
   */
  async verifyAutoplaySpins(spinCount: number): Promise<void> {
    // Verify quick spin is enabled if required
    if (this.verifyQuickSpin) {
      const isQuickSpinEnabled =
        await this.wheelGamePage.state.isQuickSpinEnabled();
      if (!isQuickSpinEnabled) {
        throw new Error(
          "Quick spin verification failed: Quick spin is not enabled"
        );
      }
      this.logger.success("Quick spin is enabled as expected");
    }

    let completedSpins = 0;
    let previousState = "";
    const unexpectedTransitions: string[] = [];

    const startTime = Date.now();
    const maxWaitTime = spinCount * this.maxWaitTimePerSpin;

    this.logger.spin(`Waiting for ${spinCount} autoplay spins...`);

    while (completedSpins < spinCount && Date.now() - startTime < maxWaitTime) {
      await this.page.waitForTimeout(this.pollInterval);

      const currentState = await this.wheelGamePage.getWheelState();

      // Track and validate state transitions (if enabled)
      if (
        this.trackStateTransitions &&
        currentState !== previousState &&
        previousState !== ""
      ) {
        this.trackStateTransition(
          previousState,
          currentState,
          unexpectedTransitions
        );
      }

      // Detect spin completion: transition from SPINNING/RESOLVING to IDLE/RESOLVED/BREATHE
      if (
        (previousState === WheelState.Spinning ||
          previousState === WheelState.Resolving) &&
        (currentState === WheelState.Idle ||
          currentState === WheelState.Resolved ||
          currentState === WheelState.Breathe)
      ) {
        completedSpins++;
        this.logger.success(
          `Spin ${completedSpins}/${spinCount} completed (${previousState} → ${currentState})`
        );
      }

      previousState = currentState;
    }

    // Verify we detected the expected number of spins
    if (completedSpins < spinCount) {
      const errorMessage = `Expected ${spinCount} spins but only detected ${completedSpins} completed spins`;
      if (this.trackStateTransitions && unexpectedTransitions.length > 0) {
        this.logger.debug(
          `${errorMessage}. Unexpected transitions: ${unexpectedTransitions.join(
            ", "
          )}`
        );
      }
      throw new Error(errorMessage);
    }

    // Report any unexpected transitions even on success
    if (this.trackStateTransitions && unexpectedTransitions.length > 0) {
      this.logger.warn(
        `Autoplay completed but encountered ${
          unexpectedTransitions.length
        } unexpected state transitions: ${unexpectedTransitions.join(", ")}`
      );
    }

    this.logger.success(
      `All ${spinCount} autoplay spins completed successfully`
    );
  }

  /**
   * Track state transition and detect unexpected patterns
   * Separated for clarity and to reduce noise in main verification method
   */
  private trackStateTransition(
    previousState: string,
    currentState: string,
    unexpectedTransitions: string[]
  ): void {
    const transition = `${previousState} → ${currentState}`;
    this.logger.debug(`State transition: ${transition}`);

    // Track unexpected transitions (neither expected completion nor normal flow)
    const isExpectedCompletion =
      (previousState === WheelState.Spinning ||
        previousState === WheelState.Resolving) &&
      (currentState === WheelState.Idle ||
        currentState === WheelState.Resolved ||
        currentState === WheelState.Breathe);

    const isNormalFlow =
      (previousState === WheelState.Idle &&
        currentState === WheelState.Spinning) ||
      (previousState === WheelState.Spinning &&
        currentState === WheelState.Resolving) ||
      (previousState === WheelState.Resolved &&
        currentState === WheelState.Breathe) ||
      (previousState === WheelState.Breathe &&
        currentState === WheelState.Idle);

    if (!isExpectedCompletion && !isNormalFlow) {
      unexpectedTransitions.push(transition);
      this.logger.warn(`Unexpected state transition: ${transition}`);
    }
  }
}
