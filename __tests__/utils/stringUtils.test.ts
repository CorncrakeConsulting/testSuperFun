import { test, expect } from "@playwright/test";
import {
  sanitizeForFilename,
  createTimestamp,
  createTimestampedFilename,
  parseNumericValue,
  formatCurrency,
} from "../../utils/stringUtils";

test.describe("String Utilities", () => {
  test.describe("sanitizeForFilename", () => {
    test("should convert to lowercase", () => {
      expect(sanitizeForFilename("MyTestFile")).toBe("mytestfile");
      expect(sanitizeForFilename("UPPERCASE")).toBe("uppercase");
    });

    test("should replace spaces with hyphens", () => {
      expect(sanitizeForFilename("my test file")).toBe("my-test-file");
      expect(sanitizeForFilename("multiple  spaces")).toBe("multiple-spaces");
    });

    test("should remove special characters", () => {
      expect(sanitizeForFilename("test@file!")).toBe("testfile");
      expect(sanitizeForFilename("$100-bet")).toBe("100-bet");
      expect(sanitizeForFilename("name (copy)")).toBe("name-copy");
    });

    test("should handle complex scenarios", () => {
      expect(sanitizeForFilename("My Test Feature!")).toBe("my-test-feature");
      expect(sanitizeForFilename("Balance: $100")).toBe("balance-100");
      expect(sanitizeForFilename("Test #1 - Part A")).toBe("test-1-part-a");
    });

    test("should handle empty string", () => {
      expect(sanitizeForFilename("")).toBe("");
    });

    test("should preserve hyphens and numbers", () => {
      expect(sanitizeForFilename("test-123-abc")).toBe("test-123-abc");
    });
  });

  test.describe("createTimestamp", () => {
    test("should create timestamp in correct format", () => {
      const date = new Date("2025-10-30T16:23:45.123Z");
      const result = createTimestamp(date);

      expect(result).toBe("2025-10-30_16-23-45");
    });

    test("should handle different dates", () => {
      const date1 = new Date("2024-01-01T00:00:00.000Z");
      expect(createTimestamp(date1)).toBe("2024-01-01_00-00-00");

      const date2 = new Date("2025-12-31T23:59:59.999Z");
      expect(createTimestamp(date2)).toBe("2025-12-31_23-59-59");
    });

    test("should use current date if no parameter provided", () => {
      const result = createTimestamp();

      // Should match format YYYY-MM-DD_HH-MM-SS
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/);
    });

    test("should not contain colons or dots (filesystem safe)", () => {
      const result = createTimestamp();

      expect(result).not.toContain(":");
      expect(result).not.toContain(".");
    });
  });

  test.describe("createTimestampedFilename", () => {
    test("should combine base name and timestamp", () => {
      const date = new Date("2025-10-30T16:23:45.123Z");
      const result = createTimestampedFilename("error", "log", date);

      expect(result).toBe("error-2025-10-30_16-23-45.log");
    });

    test("should sanitize base name", () => {
      const date = new Date("2025-10-30T16:23:45.123Z");
      const result = createTimestampedFilename("My Error Log!", "txt", date);

      expect(result).toBe("my-error-log-2025-10-30_16-23-45.txt");
    });

    test("should handle different extensions", () => {
      const date = new Date("2025-10-30T16:23:45.123Z");

      expect(createTimestampedFilename("test", "json", date)).toBe(
        "test-2025-10-30_16-23-45.json"
      );
      expect(createTimestampedFilename("test", "png", date)).toBe(
        "test-2025-10-30_16-23-45.png"
      );
    });

    test("should use current date if no parameter provided", () => {
      const result = createTimestampedFilename("test", "log");

      expect(result).toMatch(/^test-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.log$/);
    });
  });

  test.describe("parseNumericValue", () => {
    test("should parse plain numbers", () => {
      expect(parseNumericValue("123")).toBe(123);
      expect(parseNumericValue("10.5")).toBe(10.5);
      expect(parseNumericValue("0")).toBe(0);
    });

    test("should extract numbers from formatted text", () => {
      expect(parseNumericValue("Balance: $1,000")).toBe(1000);
      expect(parseNumericValue("Bet: 10")).toBe(10);
      expect(parseNumericValue("Win: 0")).toBe(0);
    });

    test("should handle currency symbols", () => {
      expect(parseNumericValue("$100")).toBe(100);
      expect(parseNumericValue("€50.25")).toBe(50.25);
      expect(parseNumericValue("£1,234.56")).toBe(1234.56);
    });

    test("should handle negative numbers", () => {
      expect(parseNumericValue("-100")).toBe(-100);
      expect(parseNumericValue("Loss: -$50")).toBe(-50);
    });

    test("should return 0 for non-numeric text", () => {
      expect(parseNumericValue("No numbers here")).toBe(0);
      expect(parseNumericValue("")).toBe(0);
      expect(parseNumericValue("N/A")).toBe(0);
    });

    test("should handle decimal numbers", () => {
      expect(parseNumericValue("10.50")).toBe(10.5);
      expect(parseNumericValue("0.99")).toBe(0.99);
      expect(parseNumericValue("1234.5678")).toBe(1234.5678);
    });
  });

  test.describe("formatCurrency", () => {
    test("should format integers as currency", () => {
      expect(formatCurrency(1000)).toBe("$1,000.00");
      expect(formatCurrency(100)).toBe("$100.00");
      expect(formatCurrency(0)).toBe("$0.00");
    });

    test("should format decimals as currency", () => {
      expect(formatCurrency(10.5)).toBe("$10.50");
      expect(formatCurrency(99.99)).toBe("$99.99");
      expect(formatCurrency(1234.56)).toBe("$1,234.56");
    });

    test("should add thousands separators", () => {
      expect(formatCurrency(1000)).toBe("$1,000.00");
      expect(formatCurrency(1000000)).toBe("$1,000,000.00");
      expect(formatCurrency(1234567.89)).toBe("$1,234,567.89");
    });

    test("should handle negative values", () => {
      expect(formatCurrency(-100)).toBe("-$100.00");
      expect(formatCurrency(-50.25)).toBe("-$50.25");
    });

    test("should always show two decimal places", () => {
      expect(formatCurrency(10)).toBe("$10.00");
      expect(formatCurrency(10.1)).toBe("$10.10");
      expect(formatCurrency(10.999)).toBe("$11.00"); // Rounds
    });
  });

  test.describe("Integration scenarios", () => {
    test("should work together for filename generation", () => {
      const featureName = "Balance Testing!";
      const sanitized = sanitizeForFilename(featureName);
      const timestamp = createTimestamp(new Date("2025-10-30T16:00:00Z"));
      const filename = `${sanitized}-${timestamp}.log`;

      expect(filename).toBe("balance-testing-2025-10-30_16-00-00.log");
    });

    test("should handle screenshot naming scenario", () => {
      const scenarioName = "Cannot increase bet above balance";
      const sanitized = sanitizeForFilename(scenarioName);
      const filename = `failed-${sanitized}-${Date.now()}.png`;

      expect(filename).toMatch(
        /^failed-cannot-increase-bet-above-balance-\d+\.png$/
      );
    });

    test("should parse and format currency values", () => {
      const text = "Balance: $1,234.56";
      const value = parseNumericValue(text);
      const formatted = formatCurrency(value);

      expect(formatted).toBe("$1,234.56");
    });
  });
});
