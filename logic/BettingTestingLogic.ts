import { WheelGamePage } from "../pages/WheelGamePage";

export class BettingTestingLogic {
  constructor(private readonly wheelGamePage: WheelGamePage) {}

  async increaseBet(): Promise<void> {
    await this.wheelGamePage.increaseBet();
  }

  async increaseBetMultipleTimes(times: number): Promise<void> {
    for (let i = 0; i < times; i++) {
      await this.wheelGamePage.increaseBet();
    }
  }

  async decreaseBet(): Promise<void> {
    await this.wheelGamePage.decreaseBet();
  }

  async decreaseBetMultipleTimes(times: number): Promise<void> {
    for (let i = 0; i < times; i++) {
      await this.wheelGamePage.decreaseBet();
    }
  }
}
