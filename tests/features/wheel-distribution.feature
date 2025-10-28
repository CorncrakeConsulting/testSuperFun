Feature: Wheel Distribution Fairness
  As a game operator
  I want to ensure the wheel has fair distribution
  So that players have equal chances on all slices

  Background:
    Given the game is loaded
    And the player has a balance of 100000

  @distribution
  Scenario: Test wheel distribution
    Given the player has placed a bet of 10
    When the player spins the wheel 100 times without setting landing index
    Then each slice should be hit approximately equal number of times
    And the distribution should pass the Chi-Square test
