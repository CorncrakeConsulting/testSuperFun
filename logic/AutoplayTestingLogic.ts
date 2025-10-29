/// <reference path="../types/global.d.ts" />
import { Page } from "@playwright/test";
import { WheelGamePage } from "../pages/WheelGamePage";
import { WheelState } from "../types/WheelState";
import { TestLogger } from "../services/TestLogger";

/**
 * Business logic for autoplay testing
 * Handles verification that autoplay triggers multiple spins
 */
export class AutoplayTestingLogic {
  constructor(
    private readonly page: Page,
    private readonly wheelGamePage: WheelGamePage
  ) {}

  /**
   * Verify that the wheel completes the expected number of automatic spins
   * Tracks wheel state transitions from SPINNING/RESOLVING to IDLE/RESOLVED
   *
   * @param spinCount - Expected number of spins to complete
   * @throws Error if the expected number of spins don't complete in time
   */
  async verifyAutoplaySpins(spinCount: number): Promise<void> {
    let completedSpins = 0;
    let previousState = "";
    const unexpectedTransitions: string[] = [];

    const startTime = Date.now();
    const maxWaitTime = spinCount * 8000; // 8 seconds per spin

    TestLogger.spin(`Waiting for ${spinCount} autoplay spins...`);

    while (completedSpins < spinCount && Date.now() - startTime < maxWaitTime) {
      await this.page.waitForTimeout(50); // Fast polling

      const currentState = await this.page.evaluate(() => {
        const game = (globalThis as any).game;
        return game?.wheel?._state || "";
      });

      // Track and validate state transitions
      if (currentState !== previousState && previousState !== "") {
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
        TestLogger.success(
          `Spin ${completedSpins}/${spinCount} completed (${previousState} → ${currentState})`
        );
      }

      previousState = currentState;
    }

    // Verify we detected the expected number of spins
    if (completedSpins < spinCount) {
      const errorMessage = `Expected ${spinCount} spins but only detected ${completedSpins} completed spins`;
      if (unexpectedTransitions.length > 0) {
        TestLogger.error(
          `${errorMessage}. Unexpected transitions: ${unexpectedTransitions.join(
            ", "
          )}`
        );
      }
      throw new Error(errorMessage);
    }

    // Report any unexpected transitions even on success
    if (unexpectedTransitions.length > 0) {
      TestLogger.warn(
        `Autoplay completed but encountered ${
          unexpectedTransitions.length
        } unexpected state transitions: ${unexpectedTransitions.join(", ")}`
      );
    }

    TestLogger.success(
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
    TestLogger.debug(`State transition: ${transition}`);

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
      TestLogger.warn(`Unexpected state transition: ${transition}`);
    }
  }
}
