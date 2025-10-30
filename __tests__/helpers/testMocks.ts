/**
 * Shared Mock Factories for Unit Tests
 * Centralized location for creating test mocks to follow DRY principle
 */

import { Page } from "@playwright/test";
import { WheelGamePage } from "../../pages/WheelGamePage";
import { WheelState } from "../../types/WheelState";
import { ILogger } from "../../services/TestLogger";

/**
 * Create a mock Playwright Page with common methods
 */
export function createMockPage(overrides?: Partial<Page>): Partial<Page> {
  const defaultMock = {
    goto: async () => {},
    waitForSelector: async () => {},
    waitForTimeout: async () => {},
    locator: () => ({
      waitFor: async () => {},
      click: async () => {},
      textContent: async () => "0",
    }),
    evaluate: async () => ({}),
  } as any;

  return { ...defaultMock, ...overrides };
}

/**
 * Create a mock Page with evaluate function that returns specific data
 */
export function createMockPageWithEvaluate(
  evaluateResult: any = {},
  overrides?: Partial<Page>
): Partial<Page> {
  return createMockPage({
    evaluate: async () => evaluateResult,
    ...overrides,
  });
}

/**
 * Create a mock WheelGamePage with configurable wheel state
 */
export function createMockWheelGamePage(
  wheelState: string = WheelState.Idle,
  overrides?: Partial<WheelGamePage>
): Partial<WheelGamePage> {
  const defaultMock = {
    getWheelState: async () => wheelState,
  } as Partial<WheelGamePage>;

  return { ...defaultMock, ...overrides };
}

/**
 * Create a mock WheelGamePage with balance, bet, and win data
 */
export function createMockWheelGamePageWithData(
  balance: number = 1000,
  bet: number = 10,
  win: number = 0,
  overrides?: Partial<WheelGamePage>
): Partial<WheelGamePage> {
  return {
    data: {
      getBalance: async () => balance,
      getBet: async () => bet,
      getWin: async () => win,
      isAutoplayEnabled: async () => false,
      getAutoplayText: async () => "Off",
    } as any,
    testHooks: {
      setWheelLandingIndex: async () => {},
      setPlayerData: async () => {},
    } as any,
    spin: async () => {},
    state: {
      waitForSpinComplete: async () => {},
      isSpinning: async () => false,
    } as any,
    ...overrides,
  } as any;
}

/**
 * Create a mock logger that implements ILogger interface
 * Use TestLogger.createMockLogger() if you need call tracking
 */
export function createMockLogger(overrides?: Partial<ILogger>): ILogger {
  const defaultMock: ILogger = {
    info: () => {},
    success: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
    step: () => {},
    spin: () => {},
    logToFile: () => {},
  };

  return { ...defaultMock, ...overrides };
}

/**
 * Create mock locators for WheelGamePage
 */
export function createMockLocators() {
  return {
    balanceDisplay: {
      waitFor: async () => {},
      textContent: async () => "Balance: 1000",
    },
    betDisplay: {
      waitFor: async () => {},
      textContent: async () => "Bet: 10",
    },
    winDisplay: {
      waitFor: async () => {},
      textContent: async () => "Win: 0",
    },
    spinButton: {
      waitFor: async () => {},
      click: async () => {},
    },
    incrementBetButton: {
      click: async () => {},
    },
    decrementBetButton: {
      click: async () => {},
    },
    autoplayButton: {
      click: async () => {},
    },
    quickSpinCheckbox: {
      click: async () => {},
    },
    wheel: {
      waitFor: async () => {},
    },
  };
}

/**
 * Create mock data reader for WheelGamePage
 */
export function createMockDataReader(overrides?: {
  balance?: number;
  bet?: number;
  win?: number;
  autoplayEnabled?: boolean;
  autoplayText?: string;
}) {
  return {
    getBalance: async () => overrides?.balance ?? 1000,
    getBet: async () => overrides?.bet ?? 10,
    getWin: async () => overrides?.win ?? 0,
    isAutoplayEnabled: async () => overrides?.autoplayEnabled ?? false,
    getAutoplayText: async () => overrides?.autoplayText ?? "Off",
  };
}
