import { WheelGamePage } from "../pages/WheelGamePage";

export class GameControlTestingLogic {
  constructor(private readonly wheelGamePage: WheelGamePage) {}

  async toggleAutoplay(): Promise<void> {
    await this.wheelGamePage.toggleAutoplay();
  }

  async setBalanceUsingTestHook(balance: number): Promise<void> {
    await this.wheelGamePage.testHooks.setPlayerData({ balance });
  }

  async enableQuickSpin(): Promise<void> {
    await this.wheelGamePage.enableQuickSpin();
  }

  async disableQuickSpin(): Promise<void> {
    await this.wheelGamePage.disableQuickSpin();
  }
}
