import { Page } from "@playwright/test";
import { WheelGamePage } from "../pages/WheelGamePage";

export interface SpinWithContextResult {
  initialBalance: number;
}

export class SpinTestingLogic {
  constructor(
    private readonly page: Page,
    private readonly wheelGamePage: WheelGamePage
  ) {}

  async spinWithContext(
    targetSliceIndex: number | undefined
  ): Promise<SpinWithContextResult> {
    const initialBalance = await this.wheelGamePage.data.getBalance();
    await this.spinWithTargetSlice(targetSliceIndex);
    return { initialBalance };
  }

  async spinWithTargetSlice(
    targetSliceIndex: number | undefined
  ): Promise<void> {
    // Apply test hook if a target slice has been set
    if (targetSliceIndex !== undefined) {
      console.log(`🎯 Setting wheel to land on slice ${targetSliceIndex}`);
      await this.wheelGamePage.testHooks.setWheelLandingIndex(targetSliceIndex);
      await this.page.waitForTimeout(100); // Small delay to ensure hook is registered
    }

    await this.wheelGamePage.spin();
  }

  async spinMultipleTimes(times: number): Promise<void> {
    for (let i = 0; i < times; i++) {
      await this.wheelGamePage.spin();
      await this.wheelGamePage.state.waitForSpinComplete();
    }
  }
}
