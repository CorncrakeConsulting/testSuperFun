/**
 * Window type helpers for accessing browser global objects in page.evaluate()
 * This provides type-safe access to the game object and other Window properties
 * that are defined in types/global.d.ts
 * 
 * The issue: When using ts-node (like in cucumber-js), the global Window interface
 * extensions from types/global.d.ts may not be recognized inside page.evaluate()
 * 
 * Solution: Import this GameWindow type and use it for casting:
 * ```typescript
 * import { GameWindow } from '../utils/windowHelpers';
 * 
 * await page.evaluate(() => {
 *   const game = (globalThis as unknown as GameWindow).game;
 *   return game?.wheel?._state;
 * });
 * ```
 */

/**
 * Re-export the Window interface with game properties
 * This ensures the type is always available even when global.d.ts isn't loaded
 */
export interface GameWindow extends Window {
  game?: {
    wheel?: {
      _config?: {
        slices?: Array<{
          winMultiplier: number;
          sprite?: string;
          [key: string]: unknown;
        }>;
        [key: string]: unknown;
      };
      _state?: string;
      slices?: Array<{
        winMultiplier: number;
        sprite?: string;
        [key: string]: unknown;
      }>;
      container?: {
        rotation?: number;
        [key: string]: unknown;
      };
      queue?: unknown[];
      state?: {
        current?: string;
      };
      [key: string]: unknown;
    };
    wheelData?: {
      slices?: Array<{
        winMultiplier: number;
        sprite?: string;
        [key: string]: unknown;
      }>;
      [key: string]: unknown;
    };
    queue?: unknown[];
    [key: string]: unknown;
  };
  setPlayerData?: (
    data: Partial<{
      balance: number;
      bet: number;
      autoplay: boolean;
      win: number;
      quickSpin: boolean;
    }>
  ) => void;
  setWheelLandIndex?: (index: number | undefined) => void;
}
