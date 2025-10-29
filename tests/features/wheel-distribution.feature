Feature: Wheel Distribution Fairness
  As a game operator
  I want to ensure the wheel has fair distribution
  So that players have equal chances on all slices

  # NOTE: These scenarios MUST run in order - the first collects data, the others validate it
  # npm run test:cucumber:serial -- --tags "@distribution"
  
  @distribution @order-1
  Scenario: Collect distribution data from 1000 spins
    Given the game is loaded
    And the player has a balance of 100000
    And the player has placed a bet of 10
    And quick spin is enabled
    When the player spins the wheel 100 times without setting landing index
    Then the distribution data should be stored for analysis

  @distribution @order-2
  Scenario: Validate equal distribution across slices
    Given the distribution data is available for analysis
    Then each slice should be hit approximately equal number of times

  @distribution @order-3
  Scenario: Validate Chi-Square randomness test
    Given the distribution data is available for analysis
    Then the distribution should pass the Chi-Square test
