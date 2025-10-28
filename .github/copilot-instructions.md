# Playwright Test Automation for Super Fun Wheel Game

This project contains comprehensive test automation for the spinning wheel casino game using Playwright with TypeScript.

## Project Context
- **Target Application**: Super Fun Wheel gambling game (React + PixiJS)
- **Test Framework**: Playwright with TypeScript
- **Test Patterns**: Page Object Model, data-driven testing
- **Game Features**: Spinning wheel, balance management, betting, autoplay, win scenarios

## Project Status: ✅ COMPLETED
- ✅ Project structure created with TypeScript configuration
- ✅ Playwright dependencies installed and browsers configured
- ✅ Page Object Model implemented for game interactions
- ✅ Comprehensive test suites covering all game functionality
- ✅ Test hooks integration for deterministic testing
- ✅ Complete documentation and setup instructions

## Test Coverage
- Game initialization and UI loading
- Player controls (balance, bet adjustment, spin button)
- Wheel spinning mechanics and animations
- Win calculation and display
- Autoplay functionality
- Quick spin mode
- Test hooks integration (setPlayerData, setWheelLandIndex)
- Edge cases and error scenarios

## Quick Start
1. Ensure the wheel game is running: `cd ../super-fun-wheel-project && npm start`
2. Install dependencies: `npm install`
3. Install browsers: `npx playwright install`
4. Run tests: `npm test`

## Development Guidelines
- Use TypeScript for all test files
- Implement Page Object Model for maintainable tests
- Leverage game's built-in test hooks for deterministic testing
- Focus on visual and functional validation
- Test both happy path and edge cases

## Files Structure
- `tests/` - Test specifications organized by functionality
- `pages/` - Page Object Model classes
- `utils/` - Test utilities and constants
- `types/` - TypeScript type declarations
- `playwright.config.ts` - Test configuration
- `README.md` - Comprehensive setup and usage guide