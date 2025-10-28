import { When, Then, Given } from "@cucumber/cucumber";
import { DistributionTestingLogic } from "../../logic/DistributionTestingLogic";
import { CustomWorld } from "../support/world";

// Action steps
When(
  "the player spins the wheel {int} times without setting landing index",
  async function (this: CustomWorld, times: number) {
    await DistributionTestingLogic.ensureInitialized(this).performRandomSpins(
      times
    );
  }
);

// Store the data after spins complete
Then(
  "the distribution data should be stored for analysis",
  function (this: CustomWorld) {
    DistributionTestingLogic.ensureInitialized(
      this
    ).storeDistributionDataForAnalysis();
  }
);

// Load stored data for validation scenarios
Given(
  "the distribution data is available for analysis",
  function (this: CustomWorld) {
    DistributionTestingLogic.ensureInitialized(
      this
    ).loadStoredDistributionData();
  }
);

// Critical validation steps - each runs independently and shows proper pass/fail
Then(
  "each slice should be hit approximately equal number of times",
  function (this: CustomWorld) {
    DistributionTestingLogic.ensureInitialized(
      this
    ).validateEqualDistribution();
  }
);

Then(
  "the distribution should pass the Chi-Square test",
  function (this: CustomWorld) {
    DistributionTestingLogic.ensureInitialized(this).validateChiSquareTest();
  }
);
