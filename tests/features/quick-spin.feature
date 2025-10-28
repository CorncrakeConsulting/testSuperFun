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

  @skip @wip
  Scenario: Quick spin persists across spins
    Given quick spin is enabled
    When the player spins the wheel 3 times
    Then quick spin should remain enabled
