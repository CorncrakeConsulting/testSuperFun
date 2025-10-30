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

Then("the wheel should land on a slice", async function (this: CustomWorld) {
  await this.wheelGamePage.state.waitForWheelToStop();
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

Then(
  "the player balance should decrease by {int}",
  async function (this: CustomWorld, amount: number) {
    await new AssertionLogic(
      this.page,
      this.wheelGamePage
    ).assertBalanceDecreasedBy(this.initialBalance ?? 0, amount);
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

Then("the wheel should spin", async function (this: CustomWorld) {
  await new AssertionLogic(this.page, this.wheelGamePage).waitForWheelSpin();
});

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

Then(
  "the bet display should show {int}",
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

Then(
  "another spin should start automatically after the first completes",
  async function (this: CustomWorld) {
    await new AssertionLogic(
      this.page,
      this.wheelGamePage
    ).assertAnotherSpinStartsAutomatically();
  }
);

Then(
  "the balance display should show {int}",
  async function (this: CustomWorld, expectedBalance: number) {
    await new AssertionLogic(this.page, this.wheelGamePage).assertBalanceEquals(
      expectedBalance
    );
  }
);

Then(
  "the balance should decrease by {int}",
  async function (this: CustomWorld, amount: number) {
    await new AssertionLogic(
      this.page,
      this.wheelGamePage
    ).assertBalanceDecreasedBy(this.initialBalance ?? 0, amount);
  }
);

Then(
  "the balance should increase by the win amount",
  async function (this: CustomWorld) {
    await new AssertionLogic(
      this.page,
      this.wheelGamePage
    ).assertBalanceIncreasedByWin(this.initialBalance ?? 0);
  }
);

Then(
  "the balance should decrease after the first spin",
  async function (this: CustomWorld) {
    this.initialBalance = await new AssertionLogic(
      this.page,
      this.wheelGamePage
    ).assertBalanceDecreasedAfterFirstSpin(this.initialBalance ?? 0);
  }
);

Then(
  "the balance should decrease again after autoplay triggers another spin",
  async function (this: CustomWorld) {
    await new AssertionLogic(
      this.page,
      this.wheelGamePage
    ).assertBalanceChangedAfterAutoplaySecondSpin(this.initialBalance ?? 0);
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

Then("quick spin should remain enabled", async function (this: CustomWorld) {
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
  "the wheel should spin at normal speed",
  async function (this: CustomWorld) {
    await new AssertionLogic(
      this.page,
      this.wheelGamePage
    ).assertNormalSpinSpeed(this.spinStartTime);
    this.spinStartTime = undefined;
  }
);

Then(
  "the normal spin should complete in less than 10 seconds",
  async function (this: CustomWorld) {
    await new AssertionLogic(
      this.page,
      this.wheelGamePage
    ).assertNormalSpinWithinMaxDuration(10000);
  }
);

Then(
  "the quick spin should complete in less than 4 seconds",
  async function (this: CustomWorld) {
    await new AssertionLogic(
      this.page,
      this.wheelGamePage
    ).assertQuickSpinWithinMaxDuration(4000);
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
  "all spins should be faster than normal",
  async function (this: CustomWorld) {
    await new AssertionLogic(
      this.page,
      this.wheelGamePage
    ).assertAllSpinsFasterThanNormal(3);
  }
);

Then(
  "all slice winnings should match their sprite multipliers",
  async function (this: CustomWorld) {
    new AssertionLogic(
      this.page,
      this.wheelGamePage
    ).assertAllSliceWinningsMatchSprites(
      this.multiplierTestResults || [],
      this.attach.bind(this)
    );
  }
);
