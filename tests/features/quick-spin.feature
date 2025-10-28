Feature: Quick Spin Mode
  As a player
  I want to enable quick spin mode
  So that wheel animations are faster

  Background:
    Given the game is loaded

  @smoke @quickspin
  Scenario: Enable quick spin
    Given quick spin is disabled
    When the player enables quick spin
    Then quick spin should be enabled

  @smoke @quickspin
  Scenario: Disable quick spin
    Given quick spin is enabled
    When the player disables quick spin
    Then quick spin should be disabled

  @regression @quickspin
  Scenario: Quick spin affects wheel animation speed
    Given the player has placed a bet of 50
    And quick spin is enabled
    When the player clicks the spin button
    Then the wheel should spin faster than normal

  @regression @quickspin @performance
  Scenario: Spin animation duration meets performance requirements
    Given the player has placed a bet of 50
    When the player clicks the spin button
    Then the normal spin should complete in less than 10 seconds
    When the player enables quick spin
    And the player clicks the spin button
    Then the quick spin should complete in less than 4 seconds

  @regression @quickspin
  @broken
  Scenario: Quick spin can be toggled during gameplay
    Given the player has placed a bet of 50
    When the player clicks the spin button to calibrate normal speed
    When the player enables quick spin
    And the player clicks the spin button to calibrate quick speed
    And the player spins the wheel 2 times
    Then all spins should be quick
    When the player disables quick spin
    And the player clicks the spin button
    Then the wheel should return to normal speed

