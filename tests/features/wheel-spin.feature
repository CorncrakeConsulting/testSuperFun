Feature: Spinning the Wheel
  As a player
  I want to spin the wheel
  So that I can win prizes

  Background:
    Given the game is loaded
    And the player has a balance of 1000

  Scenario: Wheel starts at initial position
    Then the wheel should be at position 0
    And the wheel should be in idle state

  Scenario: Successfully spin the wheel
    Given the player has placed a bet of 50
    And the wheel is set to land on slice 3
    When the player clicks the spin button
    Then the wheel should start spinning
    And the player balance should be updated

  Scenario: Spin wheel with insufficient balance
    Given the player has a balance of 5
    And the player has placed a bet of 10
    When the player clicks the spin button
    Then the wheel should not spin

  @broken
  Scenario: Force wheel to land on specific slice
    Given the player has placed a bet of 100
    And the wheel is set to land on slice 3
    When the player clicks the spin button
    Then the wheel should land on slice 3
    And the win amount should be calculated correctly
