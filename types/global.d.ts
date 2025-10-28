/**
 * Global TypeScript type declarations for the wheel game test suite
 *
 * This file provides type safety for:
 * 1. Browser window objects - Test hooks (setPlayerData, setWheelLandIndex) and game state
 *    accessed via page.evaluate() in Playwright tests
 * 2. Cucumber World context - Custom properties available in step definitions (this.wheelGamePage, etc.)
 *
 * Without these declarations, TypeScript would show errors when accessing browser context
 * or custom Cucumber World properties.
 */

import { Page } from "@playwright/test";
import { WheelGamePage } from "../pages/WheelGamePage";
import { DistributionTestingLogic } from "../logic/DistributionTestingLogic";

/**
 * Wheel slice configuration
 */
interface WheelSlice {
  winMultiplier: number;
  sprite?: string;
  [key: string]: unknown;
}

/**
 * Wheel configuration
 */
interface WheelConfig {
  slices?: WheelSlice[];
  [key: string]: unknown;
}

/**
 * Game wheel object
 */
interface GameWheel {
  _config?: WheelConfig;
  _state?: string;
  slices?: WheelSlice[];
  container?: {
    rotation?: number;
    [key: string]: unknown;
  };
  queue?: unknown[];
  state?: {
    current?: string;
  };
  [key: string]: unknown;
}

/**
 * Game object structure
 */
interface GameObject {
  wheel?: GameWheel;
  wheelData?: {
    slices?: WheelSlice[];
    [key: string]: unknown;
  };
  queue?: unknown[];
  [key: string]: unknown;
}

declare global {
  interface Window {
    setPlayerData: (
      data: Partial<{
        balance: number;
        bet: number;
        autoplay: boolean;
        win: number;
        quickSpin: boolean;
      }>
    ) => void;
    setWheelLandIndex: (index: number | undefined) => void;
    game: GameObject;
  }
}

// Cucumber World interface
declare module "@cucumber/cucumber" {
  interface World {
    page: Page;
    wheelGamePage: WheelGamePage;
    distributionLogic: DistributionTestingLogic;
    attach: (data: string | Buffer, mediaType: string) => Promise<void>;
  }
}

export {}; // Make this a module
