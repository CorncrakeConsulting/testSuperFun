Feature: Autoplay Mode
  As a player
  I want to enable autoplay
  So that the wheel spins automatically

  Background:
    Given the game is loaded
    And the player has a balance of 5000

  Scenario: Enable autoplay
    Given autoplay is off
    When the player clicks the autoplay button
    Then autoplay should be enabled
    And the autoplay display should show "On"

  Scenario: Disable autoplay
    Given autoplay is on
    When the player clicks the autoplay button
    Then autoplay should be disabled
    And the autoplay display should show "Off"

  Scenario: Autoplay spins wheel automatically
    Given the player has a balance of 10000
    And the player has placed a bet of 50
    And autoplay is enabled
    When the player clicks the spin button
    Then the wheel should complete 5 spins automatically

  Scenario: Autoplay spins wheel automatically with quick spin
    Given the player has a balance of 10000
    And the player has placed a bet of 50
    And the player enables quick spin
    And autoplay is enabled
    When the player clicks the spin button
    Then the wheel should complete 5 quick spins automatically
