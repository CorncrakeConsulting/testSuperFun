import { When, setDefaultTimeout, DataTable } from "@cucumber/cucumber";
import { CustomWorld } from "../support/world";
import { BalanceTestingLogic } from "../../logic/BalanceTestingLogic";
import { SpinTestingLogic } from "../../logic/SpinTestingLogic";

setDefaultTimeout(60000);

When("the player clicks the spin button", async function (this: CustomWorld) {
  this.spinStartTime = Date.now();
  const { initialBalance } = await new SpinTestingLogic(
    this.page,
    this.wheelGamePage
  ).spinWithContext(this.targetSliceIndex);
  this.initialBalance = initialBalance;
  this.targetSliceIndex = undefined;
});

When(
  "the player clicks the increment bet button",
  async function (this: CustomWorld) {
    await this.wheelGamePage.increaseBet();
  }
);

When(
  "the player clicks the increment bet button {int} times",
  async function (this: CustomWorld, times: number) {
    for (let i = 0; i < times; i++) {
      await this.wheelGamePage.increaseBet();
    }
  }
);

When(
  "the player clicks the decrement bet button",
  async function (this: CustomWorld) {
    await this.wheelGamePage.decreaseBet();
  }
);

When(
  "the player clicks the decrement bet button {int} times",
  async function (this: CustomWorld, times: number) {
    for (let i = 0; i < times; i++) {
      await this.wheelGamePage.decreaseBet();
    }
  }
);

When(
  "the player clicks the autoplay button",
  async function (this: CustomWorld) {
    await this.wheelGamePage.toggleAutoplay();
  }
);

When("the player enables quick spin", async function (this: CustomWorld) {
  await this.wheelGamePage.enableQuickSpin();
});

When("the player disables quick spin", async function (this: CustomWorld) {
  await this.wheelGamePage.disableQuickSpin();
});

When(
  "the player clicks the spin button to calibrate normal speed",
  async function (this: CustomWorld) {
    const startTime = Date.now();
    await this.wheelGamePage.spin();
    await this.wheelGamePage.state.waitForSpinComplete();
    this.normalSpinBaseline = Date.now() - startTime;
    this.spinStartTime = undefined;
  }
);

When(
  "the player clicks the spin button to calibrate quick speed",
  async function (this: CustomWorld) {
    const startTime = Date.now();
    await this.wheelGamePage.spin();
    await this.wheelGamePage.state.waitForSpinComplete();
    this.quickSpinBaseline = Date.now() - startTime;
    this.spinStartTime = undefined;
  }
);

When(
  "the player spins the wheel {int} times",
  async function (this: CustomWorld, times: number) {
    await new SpinTestingLogic(this.page, this.wheelGamePage).spinMultipleTimes(
      times
    );
  }
);

When(
  "the player spins the wheel landing on each slice and verifies the results and balance",
  async function (this: CustomWorld, dataTable: DataTable) {
    await new BalanceTestingLogic(
      this.page,
      this.wheelGamePage
    ).validateAllSlicesFromDataTable(dataTable);
  }
);
