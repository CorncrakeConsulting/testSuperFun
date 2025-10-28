import { When, Then, setDefaultTimeout } from "@cucumber/cucumber";
import { DistributionTestingLogic } from "../../logic/distributionTestingLogic";
import { WheelGamePage } from "../../pages/WheelGamePage";
import { CustomWorld } from "../support/world";

setDefaultTimeout(300000); // 5 minutes

// Helper function to ensure distribution logic is initialized
function ensureDistributionLogic(world: CustomWorld) {
  if (!world.wheelGamePage) {
    world.wheelGamePage = new WheelGamePage(world.page);
  }
  if (!world.distributionLogic) {
    world.distributionLogic = new DistributionTestingLogic(world);
  }
}

// Action steps
When(
  "the player spins the wheel {int} times without setting landing index",
  async function (this: CustomWorld, times: number) {
    ensureDistributionLogic(this);
    await this.distributionLogic.performRandomSpins(times);
  }
);

// Assertion steps
Then(
  "each slice should be hit approximately equal number of times",
  function (this: CustomWorld) {
    this.distributionLogic.validateEqualDistribution();
  }
);

Then(
  "the distribution should pass the Chi-Square test",
  function (this: CustomWorld) {
    this.distributionLogic.validateChiSquareTest();
  }
);
