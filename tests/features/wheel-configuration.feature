Feature: Wheel Configuration Validation
  As a quality assurance tester
  I want to verify the wheel configuration is correct
  So that players see accurate multipliers for each slice

  Background:
    Given the game is loaded

  Scenario: All wheel slices have sprites matching their multipliers
    Then all wheel slices should have correct sprite-to-multiplier mappings
