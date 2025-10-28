import { test, expect, Page } from "@playwright/test";
import {
  AutoplayTestingLogic,
  AutoplayTestingOptions,
} from "../../logic/AutoplayTestingLogic";
import { WheelGamePage } from "../../pages/WheelGamePage";
import { WheelState } from "../../types/WheelState";

import {
  createMockPage,
  createMockWheelGamePage,
  createMockLogger,
} from "../helpers/testMocks";

/**
 * Unit tests for AutoplayTestingLogic
 * Tests configuration options, spin detection, and state transition tracking
 */

test.describe("AutoplayTestingLogic Unit Tests", () => {
  test.describe("Constructor and Configuration", () => {
    test("should use default options when none provided", () => {
      const mockPage = createMockPage() as Page;
      const mockWheelGamePage = createMockWheelGamePage() as WheelGamePage;

      const logic = new AutoplayTestingLogic(mockPage, mockWheelGamePage);

      expect(logic).toBeDefined();
      // Access private properties to verify defaults
      expect((logic as any).pollInterval).toBe(50);
      expect((logic as any).maxWaitTimePerSpin).toBe(8000);
      expect((logic as any).trackStateTransitions).toBe(true);
    });

    test("should accept custom poll interval", () => {
      const mockPage = createMockPage() as Page;
      const mockWheelGamePage = createMockWheelGamePage() as WheelGamePage;
      const options: AutoplayTestingOptions = { pollInterval: 100 };

      const logic = new AutoplayTestingLogic(
        mockPage,
        mockWheelGamePage,
        options
      );

      expect((logic as any).pollInterval).toBe(100);
      expect((logic as any).maxWaitTimePerSpin).toBe(8000); // Default
    });

    test("should accept custom max wait time per spin", () => {
      const mockPage = createMockPage() as Page;
      const mockWheelGamePage = createMockWheelGamePage() as WheelGamePage;
      const options: AutoplayTestingOptions = { maxWaitTimePerSpin: 5000 };

      const logic = new AutoplayTestingLogic(
        mockPage,
        mockWheelGamePage,
        options
      );

      expect((logic as any).pollInterval).toBe(50); // Default
      expect((logic as any).maxWaitTimePerSpin).toBe(5000);
    });

    test("should accept custom tracking state transitions setting", () => {
      const mockPage = createMockPage() as Page;
      const mockWheelGamePage = createMockWheelGamePage() as WheelGamePage;
      const options: AutoplayTestingOptions = { trackStateTransitions: false };

      const logic = new AutoplayTestingLogic(
        mockPage,
        mockWheelGamePage,
        options
      );

      expect((logic as any).trackStateTransitions).toBe(false);
    });

    test("should accept all custom options together", () => {
      const mockPage = createMockPage() as Page;
      const mockWheelGamePage = createMockWheelGamePage() as WheelGamePage;
      const options: AutoplayTestingOptions = {
        pollInterval: 200,
        maxWaitTimePerSpin: 10000,
        trackStateTransitions: false,
      };

      const logic = new AutoplayTestingLogic(
        mockPage,
        mockWheelGamePage,
        options
      );

      expect((logic as any).pollInterval).toBe(200);
      expect((logic as any).maxWaitTimePerSpin).toBe(10000);
      expect((logic as any).trackStateTransitions).toBe(false);
    });

    test("should accept custom logger", () => {
      const mockPage = createMockPage() as Page;
      const mockWheelGamePage = createMockWheelGamePage() as WheelGamePage;
      const mockLogger = createMockLogger();
      const options: AutoplayTestingOptions = { logger: mockLogger };

      const logic = new AutoplayTestingLogic(
        mockPage,
        mockWheelGamePage,
        options
      );

      expect((logic as any).logger).toBe(mockLogger);
    });

    test("should use default logger when none provided", () => {
      const mockPage = createMockPage() as Page;
      const mockWheelGamePage = createMockWheelGamePage() as WheelGamePage;

      const logic = new AutoplayTestingLogic(mockPage, mockWheelGamePage);

      expect((logic as any).logger).toBeDefined();
    });
  });

  test.describe("verifyAutoplaySpins - Success Cases", () => {
    test("should complete successfully when all spins are detected", async () => {
      const states = [
        WheelState.Idle,
        WheelState.Spinning,
        WheelState.Resolving,
        WheelState.Resolved, // Spin 1 complete
        WheelState.Breathe,
        WheelState.Idle,
        WheelState.Spinning,
        WheelState.Resolving,
        WheelState.Resolved, // Spin 2 complete
        WheelState.Idle,
      ];

      let callCount = 0;
      const mockPage = {
        waitForTimeout: async () => {},
      } as any as Page;

      const mockWheelGamePage = {
        getWheelState: async () => states[callCount++] || WheelState.Idle,
      } as any as WheelGamePage;

      const logic = new AutoplayTestingLogic(mockPage, mockWheelGamePage);

      await expect(logic.verifyAutoplaySpins(2)).resolves.toBeUndefined();
    });

    test("should detect spin completion from SPINNING to IDLE", async () => {
      const states = [
        WheelState.Idle,
        WheelState.Spinning,
        WheelState.Idle, // Completion
      ];

      let callCount = 0;
      const mockPage = {
        waitForTimeout: async () => {},
      } as any as Page;

      const mockWheelGamePage = {
        getWheelState: async () => states[callCount++] || WheelState.Idle,
      } as any as WheelGamePage;

      const logic = new AutoplayTestingLogic(mockPage, mockWheelGamePage);

      await expect(logic.verifyAutoplaySpins(1)).resolves.toBeUndefined();
    });

    test("should detect spin completion from RESOLVING to BREATHE", async () => {
      const states = [
        WheelState.Idle,
        WheelState.Spinning,
        WheelState.Resolving,
        WheelState.Breathe, // Completion
      ];

      let callCount = 0;
      const mockPage = {
        waitForTimeout: async () => {},
      } as any as Page;

      const mockWheelGamePage = {
        getWheelState: async () => states[callCount++] || WheelState.Idle,
      } as any as WheelGamePage;

      const logic = new AutoplayTestingLogic(mockPage, mockWheelGamePage);

      await expect(logic.verifyAutoplaySpins(1)).resolves.toBeUndefined();
    });

    test("should use custom poll interval", async () => {
      const states = [
        WheelState.Idle,
        WheelState.Spinning,
        WheelState.Resolved,
        WheelState.Idle,
      ];

      let callCount = 0;
      const waitTimeoutCalls: number[] = [];

      const mockPage = {
        waitForTimeout: async (ms: number) => {
          waitTimeoutCalls.push(ms);
        },
      } as any as Page;

      const mockWheelGamePage = {
        getWheelState: async () => states[callCount++] || WheelState.Idle,
      } as any as WheelGamePage;

      const logic = new AutoplayTestingLogic(mockPage, mockWheelGamePage, {
        pollInterval: 200,
      });

      await logic.verifyAutoplaySpins(1);

      // Verify waitForTimeout was called with custom interval
      expect(waitTimeoutCalls.includes(200)).toBe(true);
    });
  });

  test.describe("verifyAutoplaySpins - Failure Cases", () => {
    test("should throw error when expected spins not completed", async () => {
      // Only provide 1 spin worth of states when expecting 2
      const states = [
        WheelState.Idle,
        WheelState.Spinning,
        WheelState.Resolved,
        WheelState.Idle,
        WheelState.Idle, // Stays idle, no second spin
      ];

      let callCount = 0;
      const mockPage = {
        waitForTimeout: async () => {},
      } as any as Page;

      const mockWheelGamePage = {
        getWheelState: async () => states[callCount++] || WheelState.Idle,
      } as any as WheelGamePage;

      const logic = new AutoplayTestingLogic(mockPage, mockWheelGamePage, {
        maxWaitTimePerSpin: 100, // Short timeout for fast tests
      });

      await expect(logic.verifyAutoplaySpins(2)).rejects.toThrow(
        "Expected 2 spins but only detected 1 completed spins"
      );
    });

    test("should throw error when timeout is reached", async () => {
      const mockPage = {
        waitForTimeout: async () => {},
      } as any as Page;

      const mockWheelGamePage = {
        getWheelState: async () => WheelState.Idle,
      } as any as WheelGamePage;

      const logic = new AutoplayTestingLogic(mockPage, mockWheelGamePage, {
        maxWaitTimePerSpin: 100,
      });

      await expect(logic.verifyAutoplaySpins(1)).rejects.toThrow(
        "Expected 1 spins but only detected 0 completed spins"
      );
    });

    test("should respect custom max wait time", async () => {
      const startTime = Date.now();

      const mockPage = {
        waitForTimeout: async () => {},
      } as any as Page;

      const mockWheelGamePage = {
        getWheelState: async () => WheelState.Idle,
      } as any as WheelGamePage;

      const logic = new AutoplayTestingLogic(mockPage, mockWheelGamePage, {
        maxWaitTimePerSpin: 200,
        pollInterval: 50,
      });

      await expect(logic.verifyAutoplaySpins(1)).rejects.toThrow();

      const elapsedTime = Date.now() - startTime;
      // Should timeout around 200ms, not default 8000ms
      expect(elapsedTime).toBeLessThan(500);
    });
  });

  test.describe("Edge Cases", () => {
    test("should handle empty state strings", async () => {
      const states = [
        "",
        WheelState.Idle,
        WheelState.Spinning,
        WheelState.Resolved,
      ];

      let callCount = 0;
      const mockPage = {
        waitForTimeout: async () => {},
      } as any as Page;

      const mockWheelGamePage = {
        getWheelState: async () => states[callCount++] || "",
      } as any as WheelGamePage;

      const logic = new AutoplayTestingLogic(mockPage, mockWheelGamePage);

      await expect(logic.verifyAutoplaySpins(1)).resolves.toBeUndefined();
    });

    test("should handle requesting 0 spins", async () => {
      const mockPage = {
        waitForTimeout: async () => {},
      } as any as Page;

      const mockWheelGamePage = {
        getWheelState: async () => WheelState.Idle,
      } as any as WheelGamePage;

      const logic = new AutoplayTestingLogic(mockPage, mockWheelGamePage);

      await expect(logic.verifyAutoplaySpins(0)).resolves.toBeUndefined();
    });

    test("should calculate total wait time based on spin count", async () => {
      const mockPage = {
        waitForTimeout: async () => {},
      } as any as Page;

      const mockWheelGamePage = {
        getWheelState: async () => WheelState.Idle,
      } as any as WheelGamePage;

      const logic = new AutoplayTestingLogic(mockPage, mockWheelGamePage, {
        maxWaitTimePerSpin: 1000,
        pollInterval: 50,
      });

      const startTime = Date.now();
      await expect(logic.verifyAutoplaySpins(3)).rejects.toThrow();
      const elapsedTime = Date.now() - startTime;

      // Should wait approximately 3 * 1000ms = 3000ms
      expect(elapsedTime).toBeGreaterThanOrEqual(2900);
      expect(elapsedTime).toBeLessThan(3500);
    });
  });

  test.describe("Quick Spin Verification", () => {
    test("should accept verifyQuickSpin option in constructor", () => {
      const mockPage = createMockPage() as Page;
      const mockWheelGamePage = createMockWheelGamePage() as WheelGamePage;
      const options: AutoplayTestingOptions = { verifyQuickSpin: true };

      const logic = new AutoplayTestingLogic(
        mockPage,
        mockWheelGamePage,
        options
      );

      expect((logic as any).verifyQuickSpin).toBe(true);
    });

    test("should default verifyQuickSpin to false", () => {
      const mockPage = createMockPage() as Page;
      const mockWheelGamePage = createMockWheelGamePage() as WheelGamePage;

      const logic = new AutoplayTestingLogic(mockPage, mockWheelGamePage);

      expect((logic as any).verifyQuickSpin).toBe(false);
    });

    test("should verify quick spin is enabled before counting spins", async () => {
      const states = [
        WheelState.Idle,
        WheelState.Spinning,
        WheelState.Resolved,
      ];

      let callCount = 0;
      const mockPage = {
        waitForTimeout: async () => {},
      } as any as Page;

      const mockWheelGamePage = {
        getWheelState: async () => states[callCount++] || WheelState.Idle,
        state: {
          isQuickSpinEnabled: async () => true,
        },
      } as any as WheelGamePage;

      const logic = new AutoplayTestingLogic(mockPage, mockWheelGamePage, {
        verifyQuickSpin: true,
      });

      await expect(logic.verifyAutoplaySpins(1)).resolves.toBeUndefined();
    });

    test("should throw error when quick spin verification fails", async () => {
      const mockPage = {
        waitForTimeout: async () => {},
      } as any as Page;

      const mockWheelGamePage = {
        getWheelState: async () => WheelState.Idle,
        state: {
          isQuickSpinEnabled: async () => false, // Quick spin NOT enabled
        },
      } as any as WheelGamePage;

      const logic = new AutoplayTestingLogic(mockPage, mockWheelGamePage, {
        verifyQuickSpin: true,
      });

      await expect(logic.verifyAutoplaySpins(1)).rejects.toThrow(
        "Quick spin verification failed: Quick spin is not enabled"
      );
    });

    test("should not verify quick spin when option is false", async () => {
      const states = [
        WheelState.Idle,
        WheelState.Spinning,
        WheelState.Resolved,
      ];

      let callCount = 0;
      let quickSpinCheckCalled = false;

      const mockPage = {
        waitForTimeout: async () => {},
      } as any as Page;

      const mockWheelGamePage = {
        getWheelState: async () => states[callCount++] || WheelState.Idle,
        state: {
          isQuickSpinEnabled: async () => {
            quickSpinCheckCalled = true;
            return false; // Would fail if checked
          },
        },
      } as any as WheelGamePage;

      const logic = new AutoplayTestingLogic(mockPage, mockWheelGamePage, {
        verifyQuickSpin: false, // Don't verify
      });

      await expect(logic.verifyAutoplaySpins(1)).resolves.toBeUndefined();
      expect(quickSpinCheckCalled).toBe(false); // Should not be called
    });

    test("should verify quick spin before starting spin detection", async () => {
      const executionOrder: string[] = [];
      const states = [
        WheelState.Idle,
        WheelState.Spinning,
        WheelState.Resolved,
      ];

      let callCount = 0;
      const mockPage = {
        waitForTimeout: async () => {
          executionOrder.push("waitForTimeout");
        },
      } as any as Page;

      const mockWheelGamePage = {
        getWheelState: async () => {
          executionOrder.push("getWheelState");
          return states[callCount++] || WheelState.Idle;
        },
        state: {
          isQuickSpinEnabled: async () => {
            executionOrder.push("isQuickSpinEnabled");
            return true;
          },
        },
      } as any as WheelGamePage;

      const logic = new AutoplayTestingLogic(mockPage, mockWheelGamePage, {
        verifyQuickSpin: true,
      });

      await logic.verifyAutoplaySpins(1);

      // Quick spin check should happen before any spin detection
      expect(executionOrder[0]).toBe("isQuickSpinEnabled");
      expect(executionOrder.indexOf("isQuickSpinEnabled")).toBeLessThan(
        executionOrder.indexOf("getWheelState")
      );
    });

    test("should work with all options including verifyQuickSpin", async () => {
      const states = [
        WheelState.Idle,
        WheelState.Spinning,
        WheelState.Resolved,
      ];

      let callCount = 0;
      const mockPage = {
        waitForTimeout: async () => {},
      } as any as Page;

      const mockWheelGamePage = {
        getWheelState: async () => states[callCount++] || WheelState.Idle,
        state: {
          isQuickSpinEnabled: async () => true,
        },
      } as any as WheelGamePage;

      const logic = new AutoplayTestingLogic(mockPage, mockWheelGamePage, {
        pollInterval: 100,
        maxWaitTimePerSpin: 5000,
        trackStateTransitions: false,
        verifyQuickSpin: true,
      });

      expect((logic as any).pollInterval).toBe(100);
      expect((logic as any).maxWaitTimePerSpin).toBe(5000);
      expect((logic as any).trackStateTransitions).toBe(false);
      expect((logic as any).verifyQuickSpin).toBe(true);

      await expect(logic.verifyAutoplaySpins(1)).resolves.toBeUndefined();
    });
  });
});
