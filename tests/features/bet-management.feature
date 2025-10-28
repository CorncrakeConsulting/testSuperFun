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

  Scenario: Bet adjustment updates display
    Given the player bet is 50
    When the player clicks the increment bet button
    Then the bet display should show 60
