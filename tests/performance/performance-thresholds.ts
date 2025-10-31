// Performance thresholds for test assertions
// All values in milliseconds
// Firefox renders 20-30% faster than Chromium/WebKit

export const SpinTimingThresholds = {
  MIN_SPIN_DURATION_MS: 500,
  MAX_NORMAL_SPIN_MS: 12000,

  FIREFOX: {
    MIN_SINGLE_SPIN_MS: 4000,
    MAX_SINGLE_SPIN_MS: 10000,
    MAX_DOUBLE_SPIN_MS: 12000,
  },

  CHROMIUM_WEBKIT: {
    MIN_SINGLE_SPIN_MS: 4000,
    MAX_SINGLE_SPIN_MS: 12000,
    MAX_DOUBLE_SPIN_MS: 16000,
  },

  CONCURRENT_SPIN_ATTEMPT_DELAY_MS: 2000,
} as const;

export const TimingValidators = {
  isSingleSpinOnly(
    totalDurationMs: number,
    browserName: string
  ): { valid: boolean; message: string } {
    const thresholds =
      browserName === "firefox"
        ? SpinTimingThresholds.FIREFOX
        : SpinTimingThresholds.CHROMIUM_WEBKIT;

    if (totalDurationMs >= thresholds.MAX_DOUBLE_SPIN_MS) {
      return {
        valid: false,
        message: `Duration suggests multiple spins: ${totalDurationMs}ms >= ${thresholds.MAX_DOUBLE_SPIN_MS}ms`,
      };
    }

    if (totalDurationMs < thresholds.MIN_SINGLE_SPIN_MS) {
      return {
        valid: false,
        message: `Duration too short for any spin: ${totalDurationMs}ms < ${thresholds.MIN_SINGLE_SPIN_MS}ms`,
      };
    }

    return {
      valid: true,
      message: `Duration consistent with single spin: ${totalDurationMs}ms`,
    };
  },

  formatDuration(ms: number): string {
    const seconds = (ms / 1000).toFixed(2);
    return `${ms}ms (${seconds}s)`;
  },
} as const;
