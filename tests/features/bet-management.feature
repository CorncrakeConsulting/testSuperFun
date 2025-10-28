Feature: Bet Management
  As a player
  I want to adjust my bet amount
  So that I can control my wager

  Background:
    Given the game is loaded

  Scenario: Increase bet amount
    Given the player bet is 10
    When the player clicks the increment bet button 3 times
    Then the bet amount should be 40

  Scenario: Decrease bet amount
    Given the player bet is 100
    When the player clicks the decrement bet button 5 times
    Then the bet amount should be 50

  Scenario: Cannot decrease bet below minimum
    Given the player bet is 10
    When the player clicks the decrement bet button
    Then the bet amount should remain 10

  @broken
  Scenario: Cannot increase bet above balance
    Given the player balance is set to 100 using test hooks
    And the player bet is 50
    When the player clicks the increment bet button 10 times
    Then the bet amount should be 100

  Scenario: Cannot spin when bet exceeds balance
    Given the player balance is set to 5 using test hooks
    And the player bet is 10
    When the player clicks the spin button
    Then the wheel should not spin

  Scenario: Cannot autoplay when bet exceeds balance
    Given the player balance is set to 5 using test hooks
    And the player bet is 10
    When the player clicks the autoplay button
    Then the wheel should not spin
