#!/usr/bin/env node

/**
 * Check test coverage for logic files
 *
 * This script ensures that all logic files are tested (either via unit tests or Cucumber).
 * It validates that critical logic classes have adequate test coverage.
 */

import { readdirSync, readFileSync } from "fs";
import { join } from "path";

const LOGIC_DIR = "./logic";
const TEST_DIR = "./tests";
const REQUIRED_COVERAGE_FILES = [
  "AssertionLogic",
  "AutoplayTestingLogic",
  "BalanceTestingLogic",
  "DistributionTestingLogic",
];

const MINIMUM_REFERENCES = {
  AssertionLogic: 10,
  AutoplayTestingLogic: 3,
  BalanceTestingLogic: 3,
  DistributionTestingLogic: 5,
};

/**
 * Get all test-related files recursively
 */
function getTestFiles(dir, fileList = []) {
  try {
    const files = readdirSync(dir, { withFileTypes: true });
    files.forEach((file) => {
      const filePath = join(dir, file.name);
      if (file.isDirectory() && !file.name.includes("node_modules")) {
        getTestFiles(filePath, fileList);
      } else if (file.name.endsWith(".spec.ts") || file.name.endsWith(".ts")) {
        fileList.push(filePath);
      }
    });
    return fileList;
  } catch (error) {
    return fileList;
  }
}

/**
 * Count references and usage of a logic class across all test files
 */
function countReferencesForClass(className, testFiles) {
  let totalReferences = 0;
  let foundInFiles = [];

  for (const testFile of testFiles) {
    try {
      const content = readFileSync(testFile, "utf-8");

      // Count imports
      const importPattern = new RegExp(`import.*${className}`, "g");
      const imports = content.match(importPattern) || [];

      // Count new instances
      const newPattern = new RegExp(`new\\s+${className}`, "g");
      const instances = content.match(newPattern) || [];

      // Count method calls (approximation)
      const usagePattern = new RegExp(
        `${className}\\.|await.*${className}`,
        "g"
      );
      const usages = content.match(usagePattern) || [];

      const fileReferences = imports.length + instances.length + usages.length;

      if (fileReferences > 0) {
        totalReferences += fileReferences;
        foundInFiles.push({ file: testFile, count: fileReferences });
      }
    } catch (error) {
      // Skip files that can't be read
    }
  }

  return { totalReferences, foundInFiles };
}

/**
 * Main coverage check
 */
async function checkCoverage() {
  console.log("📊 Checking test coverage for logic files...\n");

  const testFiles = getTestFiles(TEST_DIR);
  const logicFiles = readdirSync(LOGIC_DIR).filter(
    (f) => f.endsWith(".ts") && !f.endsWith(".d.ts")
  );

  const errors = [];
  const warnings = [];
  let totalLogicFiles = logicFiles.length;
  let testedFiles = 0;

  console.log(`Found ${testFiles.length} test files to analyze\n`);

  // Check each required logic file
  for (const className of REQUIRED_COVERAGE_FILES) {
    const { totalReferences, foundInFiles } = countReferencesForClass(
      className,
      testFiles
    );
    const minRequired = MINIMUM_REFERENCES[className] || 0;

    if (totalReferences === 0) {
      errors.push(`❌ REQUIRED: ${className} has no test references`);
    } else if (totalReferences < minRequired) {
      errors.push(
        `❌ ${className} has ${totalReferences} references but requires at least ${minRequired}`
      );
      testedFiles++;
    } else {
      testedFiles++;
      console.log(
        `✅ ${className} - ${totalReferences} references in ${foundInFiles.length} file(s)`
      );
      if (foundInFiles.length <= 3) {
        foundInFiles.forEach((f) =>
          console.log(
            `   ${f.file.replace(TEST_DIR + "/", "")}: ${f.count} refs`
          )
        );
      }
    }
  }

  // Check other logic files
  const otherLogicFiles = logicFiles.filter(
    (f) => !REQUIRED_COVERAGE_FILES.includes(f.replace(".ts", ""))
  );

  for (const logicFile of otherLogicFiles) {
    const className = logicFile.replace(".ts", "");
    const { totalReferences, foundInFiles } = countReferencesForClass(
      className,
      testFiles
    );

    if (totalReferences === 0) {
      warnings.push(`⚠️  ${className} has no test references`);
    } else {
      console.log(
        `✅ ${className} - ${totalReferences} references in ${foundInFiles.length} file(s)`
      );
      testedFiles++;
    }
  }

  // Print summary
  const coveragePercent = Math.round((testedFiles / totalLogicFiles) * 100);
  console.log("\n📈 Coverage Summary:");
  console.log(`   Logic files: ${totalLogicFiles}`);
  console.log(`   Tested files: ${testedFiles}`);
  console.log(`   Coverage: ${coveragePercent}%`);

  if (coveragePercent >= 80) {
    console.log(`   Status: ✅ EXCELLENT (>= 80%)`);
  } else if (coveragePercent >= 60) {
    console.log(`   Status: ⚠️  GOOD (>= 60%)`);
  } else {
    console.log(`   Status: ❌ NEEDS IMPROVEMENT (< 60%)`);
  }
  console.log("");

  // Print warnings
  if (warnings.length > 0) {
    console.log("⚠️  Warnings:");
    warnings.forEach((w) => console.log(`   ${w}`));
    console.log("");
  }

  // Print errors
  if (errors.length > 0) {
    console.log("❌ Errors:");
    errors.forEach((e) => console.log(`   ${e}`));
    console.log("");
    console.log(
      "💡 Tip: Import and use logic classes in your test files (Cucumber or unit tests)"
    );
    process.exit(1);
  }

  console.log("✅ All required coverage checks passed!\n");
  process.exit(0);
}

// Run the check
checkCoverage().catch((error) => {
  console.error("Error running coverage check:", error);
  process.exit(1);
});
