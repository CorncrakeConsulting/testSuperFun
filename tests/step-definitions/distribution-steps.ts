import { When, Then, Given } from "@cucumber/cucumber";
import { DistributionTestingLogic } from "../../logic/DistributionTestingLogic";
import { WheelGamePage } from "../../pages/WheelGamePage";
import { CustomWorld } from "../support/world";
import { sharedDistributionStore } from "../../logic/SharedDistributionStore";

const FEATURE_TAG = 'distribution'; // Tag to identify this feature's data

// Helper function to ensure distribution logic is initialized
function ensureDistributionLogic(world: CustomWorld): DistributionTestingLogic {
  if (!world.wheelGamePage) {
    world.wheelGamePage = new WheelGamePage(world.page);
  }
  if (!world.distributionLogic) {
    world.distributionLogic = new DistributionTestingLogic(world);
  }
  return world.distributionLogic;
}

// Action steps
When(
  "the player spins the wheel {int} times without setting landing index",
  async function (this: CustomWorld, times: number) {
    const logic = ensureDistributionLogic(this);
    console.log(`🎡 Starting ${times} spins...`);
    await logic.performRandomSpins(times);
  }
);

// Store the data after spins complete
Then(
  "the distribution data should be stored for analysis",
  function (this: CustomWorld) {
    const data = this.distributionLogic.getDistributionData();
    if (data.totalSpins === 0) {
      throw new Error('No spin data was collected');
    }
    
    // Store the data globally for other scenarios to use
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
    
    // Create a logic instance and inject the stored data
    ensureDistributionLogic(this);
    // Replace the distribution data with the stored data
    (this.distributionLogic as any).distributionData = data;
    
    console.log(`✅ Loaded distribution data: ${data.totalSpins} spins`);
  }
);

// Critical validation steps - each runs independently and shows proper pass/fail
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
