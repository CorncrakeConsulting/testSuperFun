/**
 * String Utilities
 * Common string manipulation functions to avoid duplication
 */

/**
 * Sanitize a string for use in filenames or URLs
 * Converts to lowercase, replaces spaces with hyphens, removes special characters
 *
 * @example
 * sanitizeForFilename("My Test Feature!") // "my-test-feature"
 * sanitizeForFilename("Balance: $100") // "balance-100"
 */
export function sanitizeForFilename(input: string): string {
  return input
    .toLowerCase()
    .replaceAll(/\s+/g, "-")
    .replaceAll(/[^a-z0-9-]/g, "")
    .replaceAll(/-+/g, "-");
}

/**
 * Create a filesystem-safe timestamp string
 * Format: YYYY-MM-DD_HH-MM-SS
 *
 * @example
 * createTimestamp() // "2025-10-30_16-23-45"
 */
export function createTimestamp(date: Date = new Date()): string {
  return date
    .toISOString()
    .replace(/T/, "_")
    .replace(/\..+/, "")
    .replaceAll(":", "-");
}

/**
 * Create a timestamped filename
 *
 * @example
 * createTimestampedFilename("error", "log") // "error-2025-10-30_16-23-45.log"
 */
export function createTimestampedFilename(
  baseName: string,
  extension: string,
  date: Date = new Date()
): string {
  const sanitized = sanitizeForFilename(baseName);
  const timestamp = createTimestamp(date);
  return `${sanitized}-${timestamp}.${extension}`;
}

/**
 * Parse numeric value from text (handles various formats)
 *
 * @example
 * parseNumericValue("Balance: $1,000") // 1000
 * parseNumericValue("Bet: 10") // 10
 * parseNumericValue("Win: 0") // 0
 */
export function parseNumericValue(text: string): number {
  const cleaned = text.replaceAll(/[^0-9.-]/g, "");
  return Number.parseFloat(cleaned) || 0;
}

/**
 * Format a number as currency
 *
 * @example
 * formatCurrency(1000) // "$1,000"
 * formatCurrency(10.5) // "$10.50"
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}
