/**
 * Centralized logging service for test execution
 * Provides consistent, configurable logging across all test logic
 */
export class TestLogger {
  private static enabled = process.env.TEST_DEBUG === 'true' || false;
  private static verbose = process.env.TEST_VERBOSE === 'true' || false;

  /**
   * Enable or disable logging
   */
  static setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Enable or disable verbose logging
   */
  static setVerbose(verbose: boolean): void {
    this.verbose = verbose;
  }

  /**
   * Log informational message
   */
  static info(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.log(`ℹ️  ${message}`, ...args);
    }
  }

  /**
   * Log success message
   */
  static success(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.log(`✅ ${message}`, ...args);
    }
  }

  /**
   * Log warning message
   */
  static warn(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.warn(`⚠️  ${message}`, ...args);
    }
  }

  /**
   * Log error message (always shown to both console and logger)
   */
  static error(message: string, ...args: any[]): void {
    console.error(`❌ ${message}`, ...args);
  }

  /**
   * Log debug message (only in verbose mode)
   */
  static debug(message: string, ...args: any[]): void {
    if (this.enabled && this.verbose) {
      console.log(`🔍 ${message}`, ...args);
    }
  }

  /**
   * Log test step execution
   */
  static step(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.log(`🎯 ${message}`, ...args);
    }
  }

  /**
   * Log spin-related events
   */
  static spin(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.log(`🎰 ${message}`, ...args);
    }
  }
}
