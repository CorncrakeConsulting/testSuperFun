import { Page } from "@playwright/test";
import { WheelGamePage } from "../pages/WheelGamePage";
import { WheelState } from "../types/WheelState";
import { TestLogger, ILogger } from "../services/TestLogger";

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
  logger?: ILogger;
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
  private readonly logger: ILogger;

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
    await this.verifyQuickSpinIfRequired();

    const result = await this.waitForSpinCompletions(spinCount);

    this.validateSpinCount(
      spinCount,
      result.completedSpins,
      result.unexpectedTransitions
    );
    this.reportUnexpectedTransitions(result.unexpectedTransitions);

    this.logger.success(
      `All ${spinCount} autoplay spins completed successfully`
    );
  }

  /**
   * Verify quick spin is enabled if required by configuration
   */
  private async verifyQuickSpinIfRequired(): Promise<void> {
    if (!this.verifyQuickSpin) return;

    const isQuickSpinEnabled =
      await this.wheelGamePage.state.isQuickSpinEnabled();
    if (!isQuickSpinEnabled) {
      throw new Error(
        "Quick spin verification failed: Quick spin is not enabled"
      );
    }
    this.logger.success("Quick spin is enabled as expected");
  }

  /**
   * Poll wheel state and count completed spins
   */
  private async waitForSpinCompletions(
    spinCount: number
  ): Promise<{ completedSpins: number; unexpectedTransitions: string[] }> {
    let completedSpins = 0;
    let previousState = "";
    const unexpectedTransitions: string[] = [];

    const startTime = Date.now();
    const maxWaitTime = spinCount * this.maxWaitTimePerSpin;

    this.logger.spin(`Waiting for ${spinCount} autoplay spins...`);

    while (completedSpins < spinCount && Date.now() - startTime < maxWaitTime) {
      await this.page.waitForTimeout(this.pollInterval);

      const currentState = await this.wheelGamePage.getWheelState();

      if (this.shouldTrackTransition(currentState, previousState)) {
        this.trackStateTransition(
          previousState,
          currentState,
          unexpectedTransitions
        );
      }

      if (this.isSpinCompletion(previousState, currentState)) {
        completedSpins++;
        this.logger.success(
          `Spin ${completedSpins}/${spinCount} completed (${previousState} → ${currentState})`
        );
      }

      previousState = currentState;
    }

    return { completedSpins, unexpectedTransitions };
  }

  /**
   * Check if we should track this state transition
   */
  private shouldTrackTransition(
    currentState: string,
    previousState: string
  ): boolean {
    return (
      this.trackStateTransitions &&
      currentState !== previousState &&
      previousState !== ""
    );
  }

  /**
   * Detect if a spin has completed based on state transition
   */
  private isSpinCompletion(
    previousState: string,
    currentState: string
  ): boolean {
    const spinningState = WheelState.Spinning as string;
    const resolvingState = WheelState.Resolving as string;
    const idleState = WheelState.Idle as string;
    const resolvedState = WheelState.Resolved as string;
    const breatheState = WheelState.Breathe as string;

    const isSpinningOrResolving =
      previousState === spinningState || previousState === resolvingState;

    const isCompletionState =
      currentState === idleState ||
      currentState === resolvedState ||
      currentState === breatheState;

    return isSpinningOrResolving && isCompletionState;
  }

  /**
   * Validate that the expected number of spins completed
   */
  private validateSpinCount(
    expected: number,
    actual: number,
    unexpectedTransitions: string[]
  ): void {
    if (actual >= expected) return;

    const errorMessage = `Expected ${expected} spins but only detected ${actual} completed spins`;

    if (this.trackStateTransitions && unexpectedTransitions.length > 0) {
      this.logger.debug(
        `${errorMessage}. Unexpected transitions: ${unexpectedTransitions.join(
          ", "
        )}`
      );
    }

    throw new Error(errorMessage);
  }

  /**
   * Report unexpected state transitions if any were detected
   */
  private reportUnexpectedTransitions(unexpectedTransitions: string[]): void {
    if (!this.trackStateTransitions || unexpectedTransitions.length === 0) {
      return;
    }

    this.logger.warn(
      `Autoplay completed but encountered ${
        unexpectedTransitions.length
      } unexpected state transitions: ${unexpectedTransitions.join(", ")}`
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

    if (this.isExpectedTransition(previousState, currentState)) {
      return;
    }

    unexpectedTransitions.push(transition);
    this.logger.warn(`Unexpected state transition: ${transition}`);
  }

  /**
   * Check if the transition is expected (completion or normal flow)
   */
  private isExpectedTransition(
    previousState: string,
    currentState: string
  ): boolean {
    return (
      this.isExpectedCompletionTransition(previousState, currentState) ||
      this.isNormalFlowTransition(previousState, currentState)
    );
  }

  /**
   * Check if this is an expected completion transition
   */
  private isExpectedCompletionTransition(
    previousState: string,
    currentState: string
  ): boolean {
    const spinningState = WheelState.Spinning as string;
    const resolvingState = WheelState.Resolving as string;
    const idleState = WheelState.Idle as string;
    const resolvedState = WheelState.Resolved as string;
    const breatheState = WheelState.Breathe as string;

    return (
      (previousState === spinningState || previousState === resolvingState) &&
      (currentState === idleState ||
        currentState === resolvedState ||
        currentState === breatheState)
    );
  }

  /**
   * Check if this is a normal flow transition
   */
  private isNormalFlowTransition(
    previousState: string,
    currentState: string
  ): boolean {
    const idleState = WheelState.Idle as string;
    const spinningState = WheelState.Spinning as string;
    const resolvingState = WheelState.Resolving as string;
    const resolvedState = WheelState.Resolved as string;
    const breatheState = WheelState.Breathe as string;

    return (
      (previousState === idleState && currentState === spinningState) ||
      (previousState === spinningState && currentState === resolvingState) ||
      (previousState === resolvedState && currentState === breatheState) ||
      (previousState === breatheState && currentState === idleState)
    );
  }
}
