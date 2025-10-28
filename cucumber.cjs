const path = require("node:path");
const fs = require("node:fs");

// Create a single timestamped folder that will be used by both cucumber.cjs and hooks
// This avoids timing issues with environment variables
const timestamp = new Date()
  .toISOString()
  .replaceAll("T", "_")
  .replace(/\..+/, "")
  .replaceAll(":", "-");

const testRunFolder = path.join(
  process.cwd(),
  "test-results",
  `run-${timestamp}`
);

// Ensure the folder exists
if (!fs.existsSync(testRunFolder)) {
  fs.mkdirSync(testRunFolder, { recursive: true });
}

// Write the folder path to a temp file so hooks can read it
const tempFile = path.join(process.cwd(), ".test-run-folder");
fs.writeFileSync(tempFile, testRunFolder, "utf8");

module.exports = {
  default: {
    requireModule: ["ts-node/register"],
    require: ["tests/step-definitions/**/*.ts", "tests/support/**/*.ts"],
    format: [
      "progress",
      `html:${path.join(testRunFolder, "cucumber-report.html")}`,
      `json:${path.join(testRunFolder, "cucumber-report.json")}`,
    ],
    formatOptions: { snippetInterface: "async-await" },
    parallel: 2,
    tags: "not @serial", // Exclude tests that must run serially
  },
  headed: {
    requireModule: ["ts-node/register"],
    require: ["tests/step-definitions/**/*.ts", "tests/support/**/*.ts"],
    format: [
      "progress",
      `html:${path.join(testRunFolder, "cucumber-report.html")}`,
    ],
    formatOptions: { snippetInterface: "async-await" },
    parallel: 1,
  },
};
