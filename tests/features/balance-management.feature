Feature: Balance Management
  As a player
  I want to see my balance updates
  So that I can track my winnings and losses

  Background:
    Given the game is loaded

  Scenario: Initial balance is displayed
    Given the player has a balance of 1000
    Then the balance display should show 1000

  Scenario: Balance decreases after bet
    Given the player has a balance of 1000
    And the player has placed a bet of 100
    When the player clicks the spin button
    Then the balance should decrease by 100

  Scenario: Balance increases after win
    Given the player has a balance of 1000
    And the player has placed a bet of 50
    And the wheel lands on a winning slice with 5x multiplier
    When the player clicks the spin button
    Then the balance should increase by the win amount

  Scenario: Set custom balance using test hooks
    When the player balance is set to 5000 using test hooks
    Then the balance display should show 5000
