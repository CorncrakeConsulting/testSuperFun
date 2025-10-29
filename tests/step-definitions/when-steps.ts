import { When, setDefaultTimeout } from "@cucumber/cucumber";
import { CustomWorld } from "../support/world";
import { BalanceTestingLogic } from "../../logic/BalanceTestingLogic";

setDefaultTimeout(60000);

When("the player clicks the spin button", async function (this: CustomWorld) {
  const initialBalance = await this.wheelGamePage.getBalance();
  this.initialBalance = initialBalance;
  this.spinStartTime = Date.now(); // Capture start time for duration measurements
  await this.wheelGamePage.spin();
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

When("the player clicks the autoplay button", async function (this: CustomWorld) {
  await this.wheelGamePage.toggleAutoplay();
});

When(
  "the player balance is set to {int} using test hooks",
  async function (this: CustomWorld, balance: number) {
    await this.wheelGamePage.setPlayerData({ balance });
  }
);

When("the player enables quick spin", async function (this: CustomWorld) {
  await this.wheelGamePage.enableQuickSpin();
});

When("the player disables quick spin", async function (this: CustomWorld) {
  await this.wheelGamePage.disableQuickSpin();
});

When("the player clicks the spin button to calibrate normal speed", async function (this: CustomWorld) {
  this.spinStartTime = Date.now();
  await this.wheelGamePage.spin();
  await this.wheelGamePage.waitForSpinComplete();
  const duration = Date.now() - this.spinStartTime;
  this.normalSpinBaseline = duration;
  this.spinStartTime = undefined;
});

When("the player clicks the spin button to calibrate quick speed", async function (this: CustomWorld) {
  this.spinStartTime = Date.now();
  await this.wheelGamePage.spin();
  await this.wheelGamePage.waitForSpinComplete();
  const duration = Date.now() - this.spinStartTime;
  this.quickSpinBaseline = duration;
  this.spinStartTime = undefined;
});

When(
  "the player spins the wheel {int} times",
  async function (this: CustomWorld, times: number) {
    for (let i = 0; i < times; i++) {
      await this.wheelGamePage.spin();
      await this.wheelGamePage.waitForSpinComplete();
    }
  }
);

When(
  "the player spins the wheel landing on each slice and verifies the results and balance",
  async function (this: CustomWorld, dataTable) {
    const balanceLogic = new BalanceTestingLogic(this.page, this.wheelGamePage);
    
    const sliceTestData = dataTable.hashes().map((row: any) => ({
      sliceIndex: Number.parseInt(row.slice_index, 10),
      expectedSpriteMultiplier: Number.parseFloat(row.sprite_multiplier),
      expectedWin: Number.parseInt(row.expected_win, 10)
    }));
    
    await balanceLogic.validateAllSlices(sliceTestData);
  }
);
