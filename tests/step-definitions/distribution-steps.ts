import { When, Then, Given } from "@cucumber/cucumber";
import { DistributionTestingLogic } from "../../logic/DistributionTestingLogic";
import { CustomWorld } from "../support/world";
import { sharedDistributionStore } from "../../logic/SharedDistributionStore";

const FEATURE_TAG = 'distribution'; // Tag to identify this feature's data

// Action steps
When(
  "the player spins the wheel {int} times without setting landing index",
  async function (this: CustomWorld, times: number) {
    console.log(`🎡 Starting ${times} spins...`);
    await DistributionTestingLogic.ensureInitialized(this).performRandomSpins(times);
  }
);

// Store the data after spins complete
Then(
  "the distribution data should be stored for analysis",
  function (this: CustomWorld) {
    const logic = DistributionTestingLogic.ensureInitialized(this);
    const data = logic.getDistributionData();
    if (data.totalSpins === 0) {
      throw new Error('No spin data was collected');
    }
    
    sharedDistributionStore.setDistributionData(data, FEATURE_TAG);
    console.log(`✅ Successfully stored data from ${data.totalSpins} spins for validation scenarios`);
  }
);

// Load stored data for validation scenarios
Given(
  "the distribution data is available for analysis",
  function (this: CustomWorld) {
    const data = sharedDistributionStore.getDistributionData(FEATURE_TAG);
    
    if (!data) {
      throw new Error(
        'No distribution data available. Make sure the "Collect distribution data" scenario runs first.'
      );
    }
    
    DistributionTestingLogic.ensureInitialized(this).setDistributionData(data);
    console.log(`✅ Loaded distribution data: ${data.totalSpins} spins`);
  }
);

// Critical validation steps - each runs independently and shows proper pass/fail
Then(
  "each slice should be hit approximately equal number of times",
  function (this: CustomWorld) {
    DistributionTestingLogic.ensureInitialized(this).validateEqualDistribution();
  }
);

Then(
  "the distribution should pass the Chi-Square test",
  function (this: CustomWorld) {
    DistributionTestingLogic.ensureInitialized(this).validateChiSquareTest();
  }
);
