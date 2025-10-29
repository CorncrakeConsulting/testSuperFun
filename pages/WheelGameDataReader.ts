import { WheelGameLocators } from "./WheelGameLocators";

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
}
