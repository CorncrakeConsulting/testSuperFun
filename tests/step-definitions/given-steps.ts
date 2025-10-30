import { Given, setDefaultTimeout } from "@cucumber/cucumber";
import { WheelGamePage } from "../../pages/WheelGamePage";
import { AutoplayTestingLogic } from "../../logic/AutoplayTestingLogic";
import { GameSetupTestingLogic } from "../../logic/GameSetupTestingLogic";
import { CustomWorld } from "../support/world";

setDefaultTimeout(60000);

Given("the game is loaded", async function (this: CustomWorld) {
  const page = this.page;
  this.wheelGamePage = WheelGamePage.create(page);
  this.autoplayLogic = new AutoplayTestingLogic(page, this.wheelGamePage);
  await this.wheelGamePage.goto();
});

Given(
  "the player has a balance of {int}",
  async function (this: CustomWorld, balance: number) {
    await this.wheelGamePage.testHooks.setPlayerData({ balance });
  }
);

Given(
  "the player balance is set to {int} using test hooks",
  async function (this: CustomWorld, balance: number) {
    await this.wheelGamePage.testHooks.setPlayerData({ balance });
  }
);

Given(
  "the player has placed a bet of {int}",
  async function (this: CustomWorld, bet: number) {
    await this.wheelGamePage.testHooks.setPlayerData({ bet });
  }
);

Given(
  "the player bet is {int}",
  async function (this: CustomWorld, bet: number) {
    await this.wheelGamePage.testHooks.setPlayerData({ bet });
  }
);

Given(
  "the wheel is set to land on slice {int}",
  async function (this: CustomWorld, sliceIndex: number) {
    // Store the target slice index for the next spin
    this.targetSliceIndex = sliceIndex;
  }
);

Given("autoplay is off", async function (this: CustomWorld) {
  await new GameSetupTestingLogic(this.wheelGamePage).ensureAutoplayOff();
});

Given("autoplay is on", async function (this: CustomWorld) {
  await new GameSetupTestingLogic(this.wheelGamePage).ensureAutoplayOn();
});

Given("autoplay is enabled", async function (this: CustomWorld) {
  const isEnabled = await this.wheelGamePage.data.isAutoplayEnabled();
  if (!isEnabled) {
    await this.wheelGamePage.toggleAutoplay();
  }
});

Given("quick spin is enabled", async function (this: CustomWorld) {
  await this.wheelGamePage.enableQuickSpin();
});

Given("quick spin is disabled", async function (this: CustomWorld) {
  await this.wheelGamePage.disableQuickSpin();
});

Given(
  "the wheel lands on a winning slice with {int}x multiplier",
  async function (this: CustomWorld, multiplier: number) {
    await this.wheelGamePage.testHooks.setWheelLandingMultiplier(multiplier);
  }
);
