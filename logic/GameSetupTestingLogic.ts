import { WheelGamePage } from "../pages/WheelGamePage";

export class GameSetupTestingLogic {
  constructor(private readonly wheelGamePage: WheelGamePage) {}

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
}
