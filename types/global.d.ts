// Global type declarations for the wheel game test hooks

import { Page } from "@playwright/test";
import { WheelGamePage } from "../pages/WheelGamePage";
import { DistributionTestingLogic } from "../logic/distributionTestingLogic";

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
    game: {
      wheel: {
        slices?: unknown[];
        queue?: unknown[];
        state?: {
          current?: string;
        };
        [key: string]: unknown;
      };
      wheelData?: {
        slices?: unknown[];
        [key: string]: unknown;
      };
      queue?: unknown[];
      [key: string]: unknown;
    };
  }

  // Extend globalThis to match Window for browser context
  var globalThis: typeof globalThis & Window;
}

// Cucumber World interface
declare module "@cucumber/cucumber" {
  interface World {
    page: Page;
    wheelGamePage: WheelGamePage;
    distributionLogic: DistributionTestingLogic;
    initialBalance?: number;
    attach: (data: string | Buffer, mediaType: string) => void;
  }
}

export {}; // Make this a module
