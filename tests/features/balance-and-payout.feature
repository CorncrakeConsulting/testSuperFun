Feature: Balance and Payout
  As a player
  I want to see my balance updates correctly
  So that I can track my winnings and losses

  Background:
    Given the game is loaded
    And the player enables quick spin

  @broken
  Scenario: Correct winnings for all wheel slices
    Given the player has placed a bet of 100
    When the player spins the wheel landing on each slice and verifies the results and balance
      | slice_index | sprite_multiplier | expected_win |
      | 0           | 10                | 1000         |
      | 1           | 5                 | 500          |
      | 2           | 0                 | 0            |
      | 3           | 2                 | 200          |
      | 4           | 1                 | 100          |
      | 5           | 0.5               | 50           |
      | 6           | 10                | 1000         |
      | 7           | 5                 | 500          |
      | 8           | 0                 | 0            |
      | 9           | 2                 | 200          |
      | 10          | 1                 | 100          |
      | 11          | 0.5               | 50           |
