import { When, setDefaultTimeout } from "@cucumber/cucumber";
import { CustomWorld } from "../support/world";

setDefaultTimeout(60000);

When("the player clicks the spin button", async function (this: CustomWorld) {
  const initialBalance = await this.wheelGamePage.getBalance();
  this.initialBalance = initialBalance;
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

When(
  "the player spins the wheel {int} times",
  async function (this: CustomWorld, times: number) {
    for (let i = 0; i < times; i++) {
      await this.wheelGamePage.spin();
      await this.wheelGamePage.waitForSpinComplete();
    }
  }
);
