/**
 * Test data and constants for wheel game testing
 */

export const GameConstants = {
  DEFAULT_BALANCE: 1000,
  DEFAULT_BET: 10,
  MIN_BET: 10,
  BET_INCREMENT: 10,
  GAME_URL: "http://localhost:3000",

  // Timeouts
  GAME_LOAD_TIMEOUT: 30000,
  WHEEL_SPIN_TIMEOUT: 10000,
  ANIMATION_TIMEOUT: 5000,
} as const;

export const TestData = {
  VALID_PLAYER_DATA: {
    balance: 1000,
    bet: 50,
    autoplay: false,
    win: 0,
    quickSpin: false,
  },

  LOW_BALANCE_SCENARIO: {
    balance: 20,
    bet: 10,
    autoplay: false,
    win: 0,
    quickSpin: false,
  },

  HIGH_BET_SCENARIO: {
    balance: 5000,
    bet: 100,
    autoplay: false,
    win: 0,
    quickSpin: true,
  },
} as const;

/**
 * Player data interface matching the game's PlayerData type
 */
export interface PlayerData {
  balance: number;
  bet: number;
  autoplay: boolean;
  win: number;
  quickSpin: boolean;
}

/**
 * Wheel slice configuration interface
 */
export interface WheelSlice {
  sprite: unknown;
  winMultiplier: number;
  [key: string]: unknown;
}

/**
 * Test utility functions
 */
export class TestUtils {
  /**
   * Generate random wheel landing index
   */
  static getRandomWheelIndex(maxSlices: number = 8): number {
    return Math.floor(Math.random() * maxSlices);
  }

  /**
   * Calculate expected balance after spin
   */
  static calculateExpectedBalance(initialBalance: number, bet: number): number {
    return initialBalance - bet;
  }

  /**
   * Wait for a specific condition with polling
   */
  static async waitForCondition(
    condition: () => Promise<boolean>,
    timeout: number = 5000,
    interval: number = 100
  ): Promise<void> {
    const start = Date.now();

    while (Date.now() - start < timeout) {
      if (await condition()) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    throw new Error(`Condition not met within ${timeout}ms`);
  }

  /**
   * Generate test scenarios for data-driven testing
   */
  static generateBetScenarios(): Array<{
    bet: number;
    balance: number;
    description: string;
  }> {
    return [
      { bet: 10, balance: 100, description: "minimum bet with low balance" },
      { bet: 50, balance: 500, description: "medium bet with medium balance" },
      { bet: 100, balance: 1000, description: "high bet with high balance" },
      { bet: 10, balance: 20, description: "minimum bet with minimum balance" },
    ];
  }

  /**
   * Validate wheel slice configuration
   */
  static validateWheelConfig(slices: WheelSlice[]): boolean {
    return (
      slices.length > 0 &&
      slices.every(
        (slice) =>
          "sprite" in slice &&
          "winMultiplier" in slice &&
          typeof slice.winMultiplier === "number"
      )
    );
  }
}
