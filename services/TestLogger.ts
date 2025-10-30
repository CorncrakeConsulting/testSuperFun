import * as fs from "fs";
import * as path from "path";
import { sanitizeForFilename, createTimestamp } from "../utils/stringUtils";

/**
 * Logger interface for dependency injection
 */
export interface ILogger {
  info(message: string, ...args: any[]): void;
  success(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  debug(message: string, ...args: any[]): void;
  step(message: string, ...args: any[]): void;
  spin(message: string, ...args: any[]): void;
  logToFile(filePath: string, message: string): void;
}

/**
 * @deprecated Use ILogger instead
 */
export type ITestLogger = ILogger;

/**
 * Centralized logging service for test execution
 * Provides consistent, configurable logging across all test logic
 *
 * Can be used as:
 * 1. Static class (backward compatible): TestLogger.info(...)
 * 2. Instance via factory: TestLogger.create()
 * 3. Injected dependency: new DistributionTestingLogic(world, logger)
 */
export class TestLogger implements ILogger {
  private static enabled = process.env.TEST_DEBUG === "true" || false;
  private static verbose = process.env.TEST_VERBOSE === "true" || false;
  private static defaultInstance: TestLogger;
  private static testRunFolder: string;
  private static currentFeatureName: string;
  private static fileWriteQueue: Promise<void> = Promise.resolve();

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
   * Initialize or retrieve the timestamped folder for the current test run
   * First checks for .test-run-folder file created by cucumber.cjs
   * Falls back to creating a new timestamped folder if file doesn't exist
   * Format: test-results/run-YYYY-MM-DD_HH-MM-SS
   */
  static initializeTestRun(): string {
    // Check if cucumber.cjs already created the folder
    const tempFile = path.join(process.cwd(), ".test-run-folder");
    if (fs.existsSync(tempFile)) {
      TestLogger.testRunFolder = fs.readFileSync(tempFile, "utf8").trim();
      TestLogger.info(`📁 Using test run folder: ${TestLogger.testRunFolder}`);
      return TestLogger.testRunFolder;
    }

    // Fallback: create new timestamped folder
    const timestamp = createTimestamp();

    TestLogger.testRunFolder = path.join(
      process.cwd(),
      "test-results",
      `run-${timestamp}`
    );

    if (!fs.existsSync(TestLogger.testRunFolder)) {
      fs.mkdirSync(TestLogger.testRunFolder, { recursive: true });
    }

    TestLogger.info(`📁 Test run folder created: ${TestLogger.testRunFolder}`);
    return TestLogger.testRunFolder;
  }

  /**
   * Set the current feature being tested
   */
  static setCurrentFeature(featureName: string): void {
    TestLogger.currentFeatureName = featureName;
  }

  /**
   * Get the current test run folder
   */
  static getTestRunFolder(): string {
    if (!TestLogger.testRunFolder) {
      return TestLogger.initializeTestRun();
    }
    return TestLogger.testRunFolder;
  }

  /**
   * Get the report path for the current feature
   */
  static getFeatureReportPath(extension: string = "html"): string {
    const runFolder = TestLogger.getTestRunFolder();
    const featureName = TestLogger.currentFeatureName || "report";
    const sanitizedName = sanitizeForFilename(featureName);

    return path.join(runFolder, `${sanitizedName}.${extension}`);
  }

  /**
   * Create a new logger instance with custom settings
   */
  static create(enabled?: boolean, verbose?: boolean): ILogger {
    return new TestLogger(enabled, verbose);
  }

  /**
   * Get the default singleton instance
   */
  static getDefault(): ILogger {
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

  /**
   * Write a message to a file with synchronized writes to prevent race conditions
   * Ensures file writes are queued and executed sequentially
   * @param filePath - Absolute or relative path to the log file
   * @param message - Message to write to the file (will append newline)
   */
  logToFile(filePath: string, message: string): void {
    // Queue the file write to prevent race conditions
    TestLogger.fileWriteQueue = TestLogger.fileWriteQueue.then(async () => {
      const resolvedPath = path.isAbsolute(filePath)
        ? filePath
        : path.join(process.cwd(), filePath);

      // Ensure directory exists
      const dir = path.dirname(resolvedPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Append message with timestamp
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] ${message}\n`;

      try {
        fs.appendFileSync(resolvedPath, logEntry, "utf8");
      } catch (error) {
        console.error(`❌ Failed to write to log file ${resolvedPath}:`, error);
      }
    });
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

  static logToFile(filePath: string, message: string): void {
    TestLogger.getDefault().logToFile(filePath, message);
  }

  /**
   * Create a mock logger for testing (tracks all method calls)
   */
  static createMockLogger(): ILogger & {
    calls: {
      info: any[][];
      success: any[][];
      warn: any[][];
      error: any[][];
      debug: any[][];
      step: any[][];
      spin: any[][];
      logToFile: any[][];
    };
  } {
    const calls = {
      info: [] as any[][],
      success: [] as any[][],
      warn: [] as any[][],
      error: [] as any[][],
      debug: [] as any[][],
      step: [] as any[][],
      spin: [] as any[][],
      logToFile: [] as any[][],
    };

    return {
      calls,
      info: (...args: any[]) => calls.info.push(args),
      success: (...args: any[]) => calls.success.push(args),
      warn: (...args: any[]) => calls.warn.push(args),
      error: (...args: any[]) => calls.error.push(args),
      debug: (...args: any[]) => calls.debug.push(args),
      step: (...args: any[]) => calls.step.push(args),
      spin: (...args: any[]) => calls.spin.push(args),
      logToFile: (...args: any[]) => calls.logToFile.push(args),
    };
  }
}
