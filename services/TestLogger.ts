/**
 * Logger interface for dependency injection
 */
export interface ITestLogger {
  info(message: string, ...args: any[]): void;
  success(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  debug(message: string, ...args: any[]): void;
  step(message: string, ...args: any[]): void;
  spin(message: string, ...args: any[]): void;
}

/**
 * Centralized logging service for test execution
 * Provides consistent, configurable logging across all test logic
 *
 * Can be used as:
 * 1. Static class (backward compatible): TestLogger.info(...)
 * 2. Instance via factory: TestLogger.create()
 * 3. Injected dependency: new DistributionTestingLogic(world, logger)
 */
export class TestLogger implements ITestLogger {
  private static enabled = process.env.TEST_DEBUG === "true" || false;
  private static verbose = process.env.TEST_VERBOSE === "true" || false;
  private static defaultInstance: TestLogger;

  private enabled: boolean;
  private verbose: boolean;

  /**
   * Private constructor for dependency injection pattern
   */
  private constructor(enabled?: boolean, verbose?: boolean) {
    this.enabled = enabled ?? TestLogger.enabled;
    this.verbose = verbose ?? TestLogger.verbose;
  }

  /**
   * Create a new logger instance with custom settings
   */
  static create(enabled?: boolean, verbose?: boolean): ITestLogger {
    return new TestLogger(enabled, verbose);
  }

  /**
   * Get the default singleton instance
   */
  static getDefault(): ITestLogger {
    if (!TestLogger.defaultInstance) {
      TestLogger.defaultInstance = new TestLogger();
    }
    return TestLogger.defaultInstance;
  }

  /**
   * Enable or disable logging (static configuration)
   */
  static setEnabled(enabled: boolean): void {
    TestLogger.enabled = enabled;
    if (TestLogger.defaultInstance) {
      TestLogger.defaultInstance.enabled = enabled;
    }
  }

  /**
   * Enable or disable verbose logging (static configuration)
   */
  static setVerbose(verbose: boolean): void {
    TestLogger.verbose = verbose;
    if (TestLogger.defaultInstance) {
      TestLogger.defaultInstance.verbose = verbose;
    }
  }

  /**
   * Log informational message
   */
  info(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.log(`ℹ️  ${message}`, ...args);
    }
  }

  /**
   * Log success message
   */
  success(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.log(`✅ ${message}`, ...args);
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.warn(`⚠️  ${message}`, ...args);
    }
  }

  /**
   * Log error message (always shown to both console and logger)
   */
  error(message: string, ...args: any[]): void {
    console.error(`❌ ${message}`, ...args);
  }

  /**
   * Log debug message (only in verbose mode)
   */
  debug(message: string, ...args: any[]): void {
    if (this.enabled && this.verbose) {
      console.log(`🔍 ${message}`, ...args);
    }
  }

  /**
   * Log test step execution
   */
  step(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.log(`🎯 ${message}`, ...args);
    }
  }

  /**
   * Log spin-related events
   */
  spin(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.log(`🎰 ${message}`, ...args);
    }
  }

  // Static methods for backward compatibility
  static info(message: string, ...args: any[]): void {
    TestLogger.getDefault().info(message, ...args);
  }

  static success(message: string, ...args: any[]): void {
    TestLogger.getDefault().success(message, ...args);
  }

  static warn(message: string, ...args: any[]): void {
    TestLogger.getDefault().warn(message, ...args);
  }

  static error(message: string, ...args: any[]): void {
    TestLogger.getDefault().error(message, ...args);
  }

  static debug(message: string, ...args: any[]): void {
    TestLogger.getDefault().debug(message, ...args);
  }

  static step(message: string, ...args: any[]): void {
    TestLogger.getDefault().step(message, ...args);
  }

  static spin(message: string, ...args: any[]): void {
    TestLogger.getDefault().spin(message, ...args);
  }
}
