import { WheelGameLocators } from "./WheelGameLocators";

/**
 * Core game state data
 */
export interface GameCoreData {
  balance: number;
  bet: number;
  win: number;
}

/**
 * Complete game state data including autoplay
 */
export interface GameFullData extends GameCoreData {
  autoplayEnabled: boolean;
  autoplayText: string;
}

/**
 * Data Reader for the Wheel Game
 * Single Responsibility: Parse and extract data from UI elements
 */
export class WheelGameDataReader {
  constructor(private readonly locators: WheelGameLocators) {}

  /**
   * Get current balance value
   */
  async getBalance(): Promise<number> {
    const balanceText = await this.locators.balanceDisplay.textContent();
    const match = balanceText?.match(/Balance: (\d+)/);
    return match ? Number.parseInt(match[1]) : 0;
  }

  /**
   * Get current bet value
   */
  async getBet(): Promise<number> {
    const betText = await this.locators.betDisplay.textContent();
    const match = betText?.match(/Bet: (\d+)/);
    return match ? Number.parseInt(match[1]) : 0;
  }

  /**
   * Get current win value
   */
  async getWin(): Promise<number> {
    const winText = await this.locators.winDisplay.textContent();
    const match = winText?.match(/Win: (\d+)/);
    return match ? Number.parseInt(match[1]) : 0;
  }

  /**
   * Get autoplay button text
   */
  async getAutoplayText(): Promise<string> {
    const text = await this.locators.autoplayButton.textContent();
    return text || "";
  }

  /**
   * Check if autoplay is enabled
   */
  async isAutoplayEnabled(): Promise<boolean> {
    const autoplayText = await this.getAutoplayText();
    return autoplayText.includes("On");
  }

  /**
   * Get core player data (balance, bet, win) in parallel
   * More efficient than calling individual methods sequentially
   * @returns Promise resolving to object with balance, bet, and win
   */
  async getCoreData(): Promise<GameCoreData> {
    const [balance, bet, win] = await Promise.all([
      this.getBalance(),
      this.getBet(),
      this.getWin(),
    ]);

    return { balance, bet, win };
  }

  /**
   * Get all player data including autoplay state in parallel
   * @returns Promise resolving to complete game state
   */
  async getFullData(): Promise<GameFullData> {
    const [balance, bet, win, autoplayEnabled, autoplayText] =
      await Promise.all([
        this.getBalance(),
        this.getBet(),
        this.getWin(),
        this.isAutoplayEnabled(),
        this.getAutoplayText(),
      ]);

    return { balance, bet, win, autoplayEnabled, autoplayText };
  }
}
