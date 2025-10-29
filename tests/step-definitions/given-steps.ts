import { Given, setDefaultTimeout } from "@cucumber/cucumber";
import { WheelGamePage } from "../../pages/WheelGamePage";
import { AutoplayTestingLogic } from "../../logic/AutoplayTestingLogic";
import { CustomWorld } from "../support/world";

setDefaultTimeout(60000);

Given("the game is loaded", async function (this: CustomWorld) {
  const page = this.page;
  this.wheelGamePage = new WheelGamePage(page);
  this.autoplayLogic = new AutoplayTestingLogic(page, this.wheelGamePage);
  await this.wheelGamePage.goto();
});

Given(
  "the player has a balance of {int}",
  async function (this: CustomWorld, balance: number) {
    await this.wheelGamePage.setPlayerData({ balance });
  }
);

Given(
  "the player has placed a bet of {int}",
  async function (this: CustomWorld, bet: number) {
    await this.wheelGamePage.setPlayerData({ bet });
  }
);

Given("the player bet is {int}", async function (this: CustomWorld, bet: number) {
  await this.wheelGamePage.setPlayerData({ bet });
});

Given(
  "the wheel is set to land on slice {int}",
  async function (this: CustomWorld, sliceIndex: number) {
    await this.wheelGamePage.setWheelLandingIndex(sliceIndex);
  }
);

Given("autoplay is off", async function (this: CustomWorld) {
  const isAutoplayOn = await this.wheelGamePage.isAutoplayEnabled();
  if (isAutoplayOn) {
    await this.wheelGamePage.toggleAutoplay();
  }
});

Given("autoplay is on", async function (this: CustomWorld) {
  const isAutoplayOn = await this.wheelGamePage.isAutoplayEnabled();
  if (!isAutoplayOn) {
    await this.wheelGamePage.toggleAutoplay();
  }
});

Given("autoplay is enabled", async function (this: CustomWorld) {
  await this.wheelGamePage.enableAutoplay();
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
    // TODO: Find a slice with the specified multiplier from wheel data
    // For now, use slice index 2 which typically has a winning multiplier
    // Index 0 and 1 are often 0x or 1x (no net win)
    await this.wheelGamePage.setWheelLandingIndex(2);
  }
);
