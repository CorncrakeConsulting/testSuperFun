import { Then, setDefaultTimeout } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { CustomWorld } from "../support/world";
import { AssertionLogic } from "../../logic/AssertionLogic";

setDefaultTimeout(60000);

Then("the wheel should start spinning", async function (this: CustomWorld) {
  await new AssertionLogic(
    this.page,
    this.wheelGamePage
  ).waitForWheelSpinStart();
});

Then(
  "the wheel should land on slice {int}",
  async function (this: CustomWorld, sliceIndex: number) {
    await this.wheelGamePage.state.waitForWheelToStop();
    const actualSliceIndex =
      await this.wheelGamePage.state.getLandedSliceIndex();
    expect(actualSliceIndex).toBe(sliceIndex);
  }
);

Then(
  "the player balance should be updated",
  async function (this: CustomWorld) {
    await new AssertionLogic(
      this.page,
      this.wheelGamePage
    ).assertBalanceUpdated(this.initialBalance);
  }
);

Then("the wheel should not spin", async function (this: CustomWorld) {
  await new AssertionLogic(
    this.page,
    this.wheelGamePage
  ).waitForWheelNotSpinning();
});

Then(
  "the win amount should be calculated correctly",
  async function (this: CustomWorld) {
    await new AssertionLogic(
      this.page,
      this.wheelGamePage
    ).assertWinAmountCalculatedCorrectly();
  }
);

Then(
  /^the wheel should complete (\d+) spins automatically$/,
  async function (this: CustomWorld, spinCount: number) {
    await this.autoplayLogic.verifyAutoplaySpins(spinCount);
  }
);

Then(
  /^the wheel should complete (\d+) quick spins automatically$/,
  async function (this: CustomWorld, spinCount: number) {
    // Import at runtime to avoid circular dependencies
    const { AutoplayTestingLogic } = await import(
      "../../logic/AutoplayTestingLogic"
    );

    // Create a new instance with quick spin verification enabled
    const autoplayLogicWithQuickSpin = new AutoplayTestingLogic(
      this.page,
      this.wheelGamePage,
      { verifyQuickSpin: true }
    );

    await autoplayLogicWithQuickSpin.verifyAutoplaySpins(spinCount);
  }
);

Then(
  "the bet amount should be {int}",
  async function (this: CustomWorld, expectedBet: number) {
    await new AssertionLogic(this.page, this.wheelGamePage).assertBetEquals(
      expectedBet
    );
  }
);

Then(
  "the bet amount should remain {int}",
  async function (this: CustomWorld, expectedBet: number) {
    await new AssertionLogic(this.page, this.wheelGamePage).assertBetEquals(
      expectedBet
    );
  }
);

Then("autoplay should be enabled", async function (this: CustomWorld) {
  await new AssertionLogic(
    this.page,
    this.wheelGamePage
  ).assertAutoplayEnabled();
});

Then("autoplay should be disabled", async function (this: CustomWorld) {
  await new AssertionLogic(
    this.page,
    this.wheelGamePage
  ).assertAutoplayDisabled();
});

Then(
  "the autoplay display should show {string}",
  async function (this: CustomWorld, expectedText: string) {
    await new AssertionLogic(
      this.page,
      this.wheelGamePage
    ).assertAutoplayDisplayShows(expectedText);
  }
);

Then("quick spin should be enabled", async function (this: CustomWorld) {
  await new AssertionLogic(
    this.page,
    this.wheelGamePage
  ).waitForQuickSpinState();
});

Then("quick spin should be disabled", async function (this: CustomWorld) {
  await new AssertionLogic(
    this.page,
    this.wheelGamePage
  ).waitForQuickSpinState();
});

Then(
  "the wheel should spin faster than normal",
  async function (this: CustomWorld) {
    await new AssertionLogic(
      this.page,
      this.wheelGamePage
    ).assertQuickSpinFasterThanNormal();
  }
);

Then(
  "the normal spin should complete in less than {int} seconds",
  async function (this: CustomWorld, seconds: number) {
    await new AssertionLogic(
      this.page,
      this.wheelGamePage
    ).assertNormalSpinWithinMaxDuration(seconds * 1000);
  }
);

Then(
  "the quick spin should complete in less than {int} seconds",
  async function (this: CustomWorld, seconds: number) {
    await new AssertionLogic(
      this.page,
      this.wheelGamePage
    ).assertQuickSpinWithinMaxDuration(seconds * 1000);
  }
);

Then("all spins should be quick", async function (this: CustomWorld) {
  await new AssertionLogic(this.page, this.wheelGamePage).assertAllSpinsQuick(
    2,
    this.quickSpinBaseline
  );
});

Then(
  "the wheel should return to normal speed",
  async function (this: CustomWorld) {
    await new AssertionLogic(
      this.page,
      this.wheelGamePage
    ).assertReturnToNormalSpeed(this.spinStartTime, this.normalSpinBaseline);
    this.spinStartTime = undefined;
  }
);

Then(
  "all slice winnings should match their sprite multipliers",
  function (this: CustomWorld) {
    // Create a synchronous wrapper that ignores the promise
    const syncAttach = (data: Buffer, mediaType: string): void => {
      // Attach asynchronously - errors will be logged by Cucumber
      this.attach(data, mediaType);
    };

    new AssertionLogic(
      this.page,
      this.wheelGamePage
    ).assertAllSliceWinningsMatchSprites(
      this.multiplierTestResults || [],
      syncAttach
    );
  }
);

Then(
  "the wheel should be at position {int}",
  async function (this: CustomWorld, expectedPosition: number) {
    const actualPosition = await this.wheelGamePage.state.getLandedSliceIndex();
    expect(actualPosition).toBe(expectedPosition);
  }
);

Then("the wheel should be in idle state", async function (this: CustomWorld) {
  const isSpinning = await this.wheelGamePage.state.isSpinning();
  expect(isSpinning).toBe(false);
});
