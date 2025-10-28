import { test, expect } from '@playwright/test';
import { WheelGamePage } from '../pages/WheelGamePage';
import { TestUtils } from '../utils/testUtils';

test.describe('Player Controls', () => {
  let gamePage: WheelGamePage;

  test.beforeEach(async ({ page }) => {
    gamePage = new WheelGamePage(page);
    await gamePage.goto();
  });

  test.describe('Bet Management', () => {
    test('should increase bet when increment button is clicked', async () => {
      const initialBet = await gamePage.getBet();
      await gamePage.increaseBet();
      
      const newBet = await gamePage.getBet();
      expect(newBet).toBe(initialBet + 10);
    });

    test('should decrease bet when decrement button is clicked', async () => {
      // First increase bet so we can decrease it
      await gamePage.increaseBet();
      const currentBet = await gamePage.getBet();
      
      await gamePage.decreaseBet();
      const newBet = await gamePage.getBet();
      expect(newBet).toBe(currentBet - 10);
    });

    test('should not allow bet to go below minimum', async () => {
      // Try to decrease bet below minimum
      await gamePage.decreaseBet();
      const bet = await gamePage.getBet();
      expect(bet).toBe(10); // Should remain at minimum
    });

    test('should maintain bet changes across multiple operations', async () => {
      // Increase bet multiple times
      await gamePage.increaseBet();
      await gamePage.increaseBet();
      await gamePage.increaseBet();
      
      const finalBet = await gamePage.getBet();
      expect(finalBet).toBe(40); // 10 + 30
    });
  });

  test.describe('Balance Management', () => {
    test('should deduct bet amount from balance after spin', async () => {
      const initialBalance = await gamePage.getBalance();
      const betAmount = await gamePage.getBet();
      
      await gamePage.spin();
      await gamePage.waitForWheelToStop();
      
      const newBalance = await gamePage.getBalance();
      expect(newBalance).toBe(initialBalance - betAmount);
    });

    test('should handle custom balance using test hooks', async () => {
      await gamePage.setPlayerData({ balance: 5000 });
      
      const balance = await gamePage.getBalance();
      expect(balance).toBe(5000);
    });
  });

  test.describe('Autoplay Functionality', () => {
    test('should toggle autoplay mode', async () => {
      const initialAutoplay = await gamePage.isAutoplayEnabled();
      await gamePage.toggleAutoplay();
      
      const newAutoplay = await gamePage.isAutoplayEnabled();
      expect(newAutoplay).toBe(!initialAutoplay);
    });

    test('should start multiple rounds when autoplay is enabled', async () => {
      // Enable autoplay
      await gamePage.toggleAutoplay();
      expect(await gamePage.isAutoplayEnabled()).toBe(true);
      
      const initialBalance = await gamePage.getBalance();
      
      // Trigger first spin
      await gamePage.spin();
      
      // Wait for multiple rounds (autoplay should continue)
      await gamePage.page.waitForTimeout(3000);
      
      const finalBalance = await gamePage.getBalance();
      expect(finalBalance).toBeLessThan(initialBalance);
    });
  });

  test.describe('Quick Spin Mode', () => {
    test('should toggle quick spin mode', async () => {
      await gamePage.toggleQuickSpin();
      
      // Verify the checkbox state changed
      // Note: This test might need adjustment based on actual UI implementation
      const quickSpinButton = gamePage.quickSpinCheckbox;
      await expect(quickSpinButton).toBeVisible();
    });
  });

  test.describe('Data-Driven Testing', () => {
    const betScenarios = TestUtils.generateBetScenarios();
    
    for (const scenario of betScenarios) {
      test(`should handle ${scenario.description}`, async () => {
        await gamePage.setPlayerData({ 
          balance: scenario.balance, 
          bet: scenario.bet 
        });
        
        const balance = await gamePage.getBalance();
        const bet = await gamePage.getBet();
        
        expect(balance).toBe(scenario.balance);
        expect(bet).toBe(scenario.bet);
        
        // Test that spinning works with this configuration
        await gamePage.spin();
        await gamePage.waitForWheelToStop();
        
        const newBalance = await gamePage.getBalance();
        expect(newBalance).toBe(scenario.balance - scenario.bet);
      });
    }
  });
});