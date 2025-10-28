import { WheelGamePage } from "../pages/WheelGamePage";

/**
 * Test constants for wheel game testing
 */
export const GameConstants = {
  DEFAULT_BALANCE: 1000,
  DEFAULT_BET: 10,
} as const;

/**
 * Set up deterministic spin by configuring player data and wheel landing index
 * Eliminates repetitive test hook setup pattern
 *
 * @param gamePage - The WheelGamePage instance
 * @param sliceIndex - The wheel slice index to land on (0-7)
 * @param playerData - Optional player data overrides (defaults: balance=1000, bet=10)
 * @returns Promise that resolves when setup is complete
 *
 * @example
 * await setupDeterministicSpin(gamePage, 2, { balance: 500, bet: 25 });
 * await gamePage.spinAndWait();
 */
export async function setupDeterministicSpin(
  gamePage: WheelGamePage,
  sliceIndex: number,
  playerData?: Partial<{ balance: number; bet: number }>
): Promise<void> {
  await gamePage.testHooks.setPlayerData({
    balance: playerData?.balance ?? 1000,
    bet: playerData?.bet ?? 10,
    win: 0,
  });
  await gamePage.testHooks.setWheelLandingIndex(sliceIndex);
}

/**
 * Find wheel slice index by win multiplier
 * Searches through all slices to find one matching the target multiplier
 *
 * @param gamePage - The WheelGamePage instance
 * @param multiplier - The win multiplier to search for (e.g., 2 for 2X)
 * @param balance - Balance to use for testing (default: 1000)
 * @param bet - Bet amount to use for testing (default: 10)
 * @returns Promise resolving to slice index or undefined if not found
 *
 * @example
 * const twoXSlice = await findSliceByMultiplier(gamePage, 2, 1000, 50);
 * if (twoXSlice !== undefined) {
 *   await setupDeterministicSpin(gamePage, twoXSlice);
 * }
 */
export async function findSliceByMultiplier(
  gamePage: WheelGamePage,
  multiplier: number,
  balance: number = 1000,
  bet: number = 10
): Promise<number | undefined> {
  // Get the actual slice count from the game
  const sliceCount = await gamePage.state.getSliceCount();

  for (let sliceIndex = 0; sliceIndex < sliceCount; sliceIndex++) {
    await gamePage.testHooks.setPlayerData({ balance, bet, win: 0 });
    await gamePage.testHooks.setWheelLandingIndex(sliceIndex);
    await gamePage.spinAndWait();
    const win = await gamePage.data.getWin();

    if (win === bet * multiplier) {
      return sliceIndex;
    }
  }
  return undefined;
}
