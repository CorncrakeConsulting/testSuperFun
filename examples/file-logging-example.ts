/**
 * Example: Using TestLogger's file logging capabilities
 *
 * Demonstrates how to log test execution details to files
 * with synchronized writes to prevent race conditions.
 */

import { TestLogger } from "../services/TestLogger";
import * as path from "path";

// Example 1: Basic file logging
async function basicFileLogging() {
  const logger = TestLogger.create(true, false);
  const logPath = path.join(
    process.cwd(),
    "test-results",
    "test-execution.log"
  );

  logger.info("Starting test execution");
  logger.logToFile(logPath, "Test started at " + new Date().toISOString());

  // Simulate test steps
  logger.step("Navigating to game page");
  logger.logToFile(logPath, "Navigation completed successfully");

  logger.step("Clicking spin button");
  logger.logToFile(logPath, "Spin initiated");

  logger.success("Test completed");
  logger.logToFile(logPath, "Test completed successfully");
}

// Example 2: Logging to timestamped folder
async function timestampedFolderLogging() {
  // Initialize test run (creates timestamped folder)
  const testRunFolder = TestLogger.initializeTestRun();

  const logger = TestLogger.getDefault();
  const logPath = path.join(testRunFolder, "detailed-execution.log");

  logger.info("Logging to timestamped folder");
  logger.logToFile(logPath, "=== Test Execution Log ===");
  logger.logToFile(logPath, "Test Run Folder: " + testRunFolder);

  // Log test details
  logger.logToFile(logPath, "Browser: chromium");
  logger.logToFile(logPath, "Test Type: E2E");
  logger.logToFile(logPath, "Feature: Wheel Mechanics");
}

// Example 3: Logging test results with feature context
async function featureContextLogging() {
  const testRunFolder = TestLogger.initializeTestRun();
  TestLogger.setCurrentFeature("bet-management");

  const logger = TestLogger.getDefault();
  const logPath = path.join(testRunFolder, "bet-management-results.log");

  logger.logToFile(logPath, "=== Bet Management Feature Tests ===");
  logger.logToFile(logPath, "Scenario: Increase bet above balance");
  logger.logToFile(logPath, "Status: PASS");
  logger.logToFile(logPath, "Duration: 2.5s");

  logger.logToFile(logPath, "Scenario: Decrease bet below minimum");
  logger.logToFile(logPath, "Status: PASS");
  logger.logToFile(logPath, "Duration: 1.8s");
}

// Example 4: Parallel logging (synchronized writes)
async function parallelLogging() {
  const testRunFolder = TestLogger.initializeTestRun();
  const logger = TestLogger.getDefault();
  const logPath = path.join(testRunFolder, "parallel-tests.log");

  // Simulate parallel test execution
  // File writes are queued and synchronized automatically
  const promises = [];

  for (let i = 1; i <= 10; i++) {
    promises.push(
      (async () => {
        logger.logToFile(logPath, `Test ${i} started`);
        // Simulate test work
        await new Promise((resolve) =>
          setTimeout(resolve, Math.random() * 100)
        );
        logger.logToFile(logPath, `Test ${i} completed`);
      })()
    );
  }

  await Promise.all(promises);
  logger.logToFile(logPath, "All parallel tests completed");
}

// Example 5: Static method usage
async function staticMethodLogging() {
  const testRunFolder = TestLogger.initializeTestRun();
  const logPath = path.join(testRunFolder, "static-logging.log");

  // Using static methods (backward compatible)
  TestLogger.info("Using static methods");
  TestLogger.logToFile(logPath, "Static method logging example");

  TestLogger.step("Step 1: Initialize game");
  TestLogger.logToFile(logPath, "Game initialized");

  TestLogger.success("Operation successful");
  TestLogger.logToFile(logPath, "Operation completed successfully");
}

// Example 6: Custom log file per test
async function customLogPerTest() {
  const testRunFolder = TestLogger.initializeTestRun();
  const logger = TestLogger.getDefault();

  // Each test gets its own log file
  const tests = ["game-init", "wheel-spin", "balance-check"];

  for (const testName of tests) {
    const logPath = path.join(testRunFolder, `${testName}.log`);

    logger.logToFile(logPath, `=== ${testName} Test Log ===`);
    logger.logToFile(logPath, `Start time: ${new Date().toISOString()}`);

    // Simulate test execution
    logger.logToFile(logPath, "Test executing...");
    logger.logToFile(logPath, "Test completed");
    logger.logToFile(logPath, `End time: ${new Date().toISOString()}`);
  }
}

// Example 7: Error logging to file
async function errorLoggingExample() {
  const testRunFolder = TestLogger.initializeTestRun();
  const logger = TestLogger.getDefault();
  const errorLogPath = path.join(testRunFolder, "errors.log");

  try {
    logger.step("Attempting risky operation");
    logger.logToFile(errorLogPath, "Starting risky operation");

    // Simulate error
    throw new Error("Something went wrong");
  } catch (error) {
    logger.error("Error occurred: " + error);
    logger.logToFile(errorLogPath, `ERROR: ${error}`);
    logger.logToFile(errorLogPath, `Stack: ${(error as Error).stack}`);
  }
}

// Run examples
if (require.main === module) {
  (async () => {
    console.log("📝 File Logging Examples\n");

    console.log("1. Basic File Logging");
    await basicFileLogging();

    console.log("\n2. Timestamped Folder Logging");
    await timestampedFolderLogging();

    console.log("\n3. Feature Context Logging");
    await featureContextLogging();

    console.log("\n4. Parallel Logging (Synchronized)");
    await parallelLogging();

    console.log("\n5. Static Method Logging");
    await staticMethodLogging();

    console.log("\n6. Custom Log Per Test");
    await customLogPerTest();

    console.log("\n7. Error Logging");
    await errorLoggingExample();

    console.log(
      "\n✅ All examples completed. Check test-results/ folder for log files."
    );
  })();
}

export {
  basicFileLogging,
  timestampedFolderLogging,
  featureContextLogging,
  parallelLogging,
  staticMethodLogging,
  customLogPerTest,
  errorLoggingExample,
};
