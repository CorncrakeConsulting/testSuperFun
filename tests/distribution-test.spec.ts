import { test, expect } from "@playwright/test";
import { WheelGamePage } from "../pages/WheelGamePage";

test.describe("Wheel Distribution Testing", () => {
  let gamePage: WheelGamePage;

  test.beforeEach(async ({ page }) => {
    gamePage = WheelGamePage.create(page);
    await gamePage.goto();
  });

  test("should validate RTP (Return to Player) over 1000 spins", async () => {
    await gamePage.enableQuickSpin();

    const totalSpins = 1000;
    const betAmount = 10;
    let totalWagered = 0;
    let totalWon = 0;

    console.log("\n💰 Testing RTP (Return to Player) over 1000 spins...\n");

    for (let i = 0; i < totalSpins; i++) {
      await gamePage.testHooks.setPlayerData({
        balance: 100000,
        bet: betAmount,
        win: 0,
      });
      await gamePage.testHooks.setWheelLandingIndex(undefined); // Random

      await gamePage.spin();
      await gamePage.state.waitForWheelToStop();

      const win = await gamePage.data.getWin();
      totalWagered += betAmount;
      totalWon += win;

      if ((i + 1) % 100 === 0) {
        console.log(`   Completed ${i + 1}/${totalSpins} spins...`);
      }
    }

    const rtp = (totalWon / totalWagered) * 100;

    console.log("\n" + "=".repeat(60));
    console.log("💰 RTP ANALYSIS");
    console.log("=".repeat(60));
    console.log(`Total Wagered: ${totalWagered}`);
    console.log(`Total Won: ${totalWon}`);
    console.log(`RTP: ${rtp.toFixed(2)}%`);
    console.log(
      `Net Result: ${totalWon - totalWagered > 0 ? "+" : ""}${
        totalWon - totalWagered
      }`
    );

    // Most slot games have RTP between 85-98%
    // For testing, we expect it to be reasonable
    console.log(
      `\n${rtp >= 80 && rtp <= 120 ? "✅" : "❌"} RTP is ${
        rtp >= 80 && rtp <= 120 ? "within" : "outside"
      } reasonable range (80-120%)`
    );
    console.log("=".repeat(60) + "\n");

    // Expect RTP to be reasonable (with some variance due to sample size)
    expect(rtp).toBeGreaterThan(80);
    expect(rtp).toBeLessThan(120);
  });

  test("should detect if any slice is overly favored (bias test)", async () => {
    await gamePage.enableQuickSpin();

    const totalSpins = 500;
    const sliceCount = await gamePage.state.getSliceCount();
    const biasMargin = 0.1;
    // Initialize slice counters as Record<number, number> with zero values
    const distribution: Record<number, number> = Object.fromEntries(
      Array.from({ length: sliceCount }, (_, i) => [i, 0])
    );

    // Get slice configurations
    const sliceConfig: Record<number, number> = {};
    for (let i = 0; i < sliceCount; i++) {
      await gamePage.testHooks.setPlayerData({
        balance: 1000,
        bet: 10,
        win: 0,
      });
      await gamePage.testHooks.setWheelLandingIndex(i);
      await gamePage.spin();
      await gamePage.state.waitForWheelToStop();
      sliceConfig[i] = await gamePage.data.getWin();
    }

    // Run spins
    for (let i = 0; i < totalSpins; i++) {
      await gamePage.testHooks.setPlayerData({
        balance: 10000,
        bet: 10,
        win: 0,
      });
      await gamePage.testHooks.setWheelLandingIndex(undefined);
      await gamePage.spin();
      await gamePage.state.waitForWheelToStop();

      const win = await gamePage.data.getWin();
      for (let slice = 0; slice < sliceCount; slice++) {
        if (sliceConfig[slice] === win) {
          distribution[slice]++;
          break;
        }
      }
    }

    const maxAllowed = totalSpins * (1 / sliceCount + biasMargin);

    console.log("\n🎯 BIAS DETECTION TEST");
    console.log("=".repeat(60));

    let biasDetected = false;
    for (let i = 0; i < sliceCount; i++) {
      const count = distribution[i];
      const percentage = (count / totalSpins) * 100;
      const isBiased = count > maxAllowed;

      if (isBiased) biasDetected = true;

      console.log(
        `${
          isBiased ? "⚠️ " : "✅ "
        } Slice ${i}: ${count}/${totalSpins} (${percentage.toFixed(1)}%) ` +
          `${isBiased ? "- BIASED!" : ""}`
      );
    }

    console.log("=".repeat(60));
    console.log(biasDetected ? "❌ BIAS DETECTED!" : "✅ NO BIAS DETECTED");
    console.log("=".repeat(60) + "\n");

    expect(biasDetected).toBe(false);
  });
});
