import { WheelGamePage } from "../pages/WheelGamePage";

export class GameSetupTestingLogic {
  constructor(private readonly wheelGamePage: WheelGamePage) {}

  async setBalance(balance: number): Promise<void> {
    await this.wheelGamePage.testHooks.setPlayerData({ balance });
  }

  async setBet(bet: number): Promise<void> {
    await this.wheelGamePage.testHooks.setPlayerData({ bet });
  }

  async ensureAutoplayOff(): Promise<void> {
    const isAutoplayOn = await this.wheelGamePage.data.isAutoplayEnabled();
    if (isAutoplayOn) {
      await this.wheelGamePage.toggleAutoplay();
    }
  }

  async ensureAutoplayOn(): Promise<void> {
    const isAutoplayOn = await this.wheelGamePage.data.isAutoplayEnabled();
    if (!isAutoplayOn) {
      await this.wheelGamePage.toggleAutoplay();
    }
  }

  async enableAutoplay(): Promise<void> {
    await this.wheelGamePage.enableAutoplay();
  }

  async enableQuickSpin(): Promise<void> {
    await this.wheelGamePage.enableQuickSpin();
  }

  async disableQuickSpin(): Promise<void> {
    await this.wheelGamePage.disableQuickSpin();
  }

  async setWheelToLandOnWinningSlice(multiplier: number): Promise<void> {
    await this.wheelGamePage.testHooks.setWheelLandingMultiplier(multiplier);
  }
}
