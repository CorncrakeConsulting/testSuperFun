import { Page } from "@playwright/test";
import { WheelGamePage } from "../pages/WheelGamePage";

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
   * Tracks game state transitions to count completed spins
   * 
   * @param spinCount - Expected number of spins to complete
   * @throws Error if the expected number of spins don't complete in time
   */
  /**
   * Verify that the wheel completes the expected number of automatic spins
   * Tracks game state transitions to count completed spins
   * 
   * @param spinCount - Expected number of spins to complete
   * @throws Error if the expected number of spins don't complete in time
   */
  async verifyAutoplaySpins(spinCount: number): Promise<void> {
    let completedSpins = 0;
    let lastState = '';
    
    const startTime = Date.now();
    const maxWaitTime = spinCount * 6000; // 6 seconds per spin
    
    while (completedSpins < spinCount && (Date.now() - startTime) < maxWaitTime) {
      await this.page.waitForTimeout(100);
      
      const currentState = await this.page.evaluate(() => {
        const game = (globalThis as any).game;
        return game?.wheel?._state || '';
      });
      
      // Detect transition from SPINNING/RESOLVING to RESOLVED/IDLE/BREATHE (spin completed)
      if ((lastState === 'SPINNING' || lastState === 'RESOLVING') && 
          (currentState === 'RESOLVED' || currentState === 'IDLE' || currentState === 'BREATHE')) {
        completedSpins++;
      }
      
      lastState = currentState;
    }
    
    // Verify we detected the expected number of spins
    if (completedSpins < spinCount) {
      throw new Error(
        `Expected ${spinCount} spins but only detected ${completedSpins} completed spins`
      );
    }
  }
}
