import { Given, setDefaultTimeout, World } from "@cucumber/cucumber";
import { WheelGamePage } from "../../pages/WheelGamePage";

setDefaultTimeout(60000);

Given("the game is loaded", async function (this: World) {
  const page = this.page;
  this.wheelGamePage = new WheelGamePage(page);
  await this.wheelGamePage.goto();
});

Given(
  "the player has a balance of {int}",
  async function (this: World, balance: number) {
    await this.wheelGamePage.setPlayerData({ balance });
  }
);

Given(
  "the player has placed a bet of {int}",
  async function (this: World, bet: number) {
    await this.wheelGamePage.setPlayerData({ bet });
  }
);

Given("the player bet is {int}", async function (this: World, bet: number) {
  await this.wheelGamePage.setPlayerData({ bet });
});

Given(
  "the wheel is set to land on slice {int}",
  async function (this: World, sliceIndex: number) {
    await this.wheelGamePage.setWheelLandingIndex(sliceIndex);
  }
);

Given("autoplay is off", async function (this: World) {
  const isAutoplayOn = await this.wheelGamePage.isAutoplayEnabled();
  if (isAutoplayOn) {
    await this.wheelGamePage.toggleAutoplay();
  }
});

Given("autoplay is on", async function (this: World) {
  const isAutoplayOn = await this.wheelGamePage.isAutoplayEnabled();
  if (!isAutoplayOn) {
    await this.wheelGamePage.toggleAutoplay();
  }
});

Given("autoplay is enabled", async function (this: World) {
  await this.wheelGamePage.enableAutoplay();
});

Given("quick spin is enabled", async function (this: World) {
  await this.wheelGamePage.enableQuickSpin();
});

Given("quick spin is disabled", async function (this: World) {
  await this.wheelGamePage.disableQuickSpin();
});

Given(
  "the wheel lands on a winning slice with {int}x multiplier",
  async function (this: World) {
    // This would require finding a slice with the specified multiplier
    // For now, we'll set a default slice
    await this.wheelGamePage.setWheelLandingIndex(0);
  }
);
