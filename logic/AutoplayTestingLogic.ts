/// <reference path="../types/global.d.ts" />
import { Page } from "@playwright/test";
import { WheelGamePage } from "../pages/WheelGamePage";
import { WheelState } from "../types/WheelState";

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
    let previousState = '';
    
    const startTime = Date.now();
    const maxWaitTime = spinCount * 8000; // 8 seconds per spin
    
    console.log(`🎰 Waiting for ${spinCount} autoplay spins...`);
    
    while (completedSpins < spinCount && (Date.now() - startTime) < maxWaitTime) {
      await this.page.waitForTimeout(50); // Fast polling
      
      const currentState = await this.page.evaluate(() => {
        const game = (globalThis as any).game;
        return game?.wheel?._state || '';
      });
      
      // Detect spin completion: transition from SPINNING/RESOLVING to IDLE/RESOLVED/BREATHE
      if ((previousState === WheelState.Spinning || previousState === WheelState.Resolving) && 
          (currentState === WheelState.Idle || currentState === WheelState.Resolved || currentState === WheelState.Breathe)) {
        completedSpins++;
        console.log(`✅ Spin ${completedSpins}/${spinCount} completed (${previousState} → ${currentState})`);
      }
      
      previousState = currentState;
    }
    
    // Verify we detected the expected number of spins
    if (completedSpins < spinCount) {
      throw new Error(
        `Expected ${spinCount} spins but only detected ${completedSpins} completed spins`
      );
    }
    
    console.log(`✅ All ${spinCount} autoplay spins completed successfully`);
  }
}
