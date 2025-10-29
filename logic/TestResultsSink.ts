/**
 * Test Results Sink
 * Collects and stores test execution results for non-critical failures
 * Allows tests to continue execution and report all failures at the end
 */

export interface TestResult {
  testName: string;
  passed: boolean;
  error?: string;
  details?: string; // Raw output/details from the test
  timestamp: Date;
}

export class TestResultsSink {
  private results: TestResult[] = [];
  private currentTestDetails: string = '';

  /**
   * Record a test result
   */
  addResult(testName: string, passed: boolean, error?: string, details?: string): void {
    this.results.push({
      testName,
      passed,
      error,
      details,
      timestamp: new Date(),
    });
  }

  /**
   * Start capturing console output for a test
   */
  startCapturingDetails(): void {
    this.currentTestDetails = '';
  }

  /**
   * Append to current test details
   */
  appendDetails(text: string): void {
    this.currentTestDetails += text + '\n';
  }

  /**
   * Get captured details
   */
  getCurrentDetails(): string {
    return this.currentTestDetails;
  }

  /**
   * Clear captured details
   */
  clearCurrentDetails(): void {
    this.currentTestDetails = '';
  }

  /**
   * Check if any tests failed
   */
  hasFailures(): boolean {
    return this.results.some(r => !r.passed);
  }

  /**
   * Get all results
   */
  getResults(): TestResult[] {
    return [...this.results];
  }

  /**
   * Get only failed results
   */
  getFailures(): TestResult[] {
    return this.results.filter(r => !r.passed);
  }

  /**
   * Get count of passed tests
   */
  getPassedCount(): number {
    return this.results.filter(r => r.passed).length;
  }

  /**
   * Get count of failed tests
   */
  getFailedCount(): number {
    return this.results.filter(r => !r.passed).length;
  }

  /**
   * Generate a summary report
   */
  generateSummaryReport(): string {
    const lines: string[] = [
      '='.repeat(80),
      '📋 FINAL TEST RESULTS',
      '='.repeat(80),
      `Total tests: ${this.results.length}`,
      `Passed: ${this.getPassedCount()}`,
      `Failed: ${this.getFailedCount()}`,
      '',
    ];

    if (this.hasFailures()) {
      lines.push('❌ FAILED TESTS:', '');
      
      const failures = this.getFailures();
      for (let i = 0; i < failures.length; i++) {
        const failure = failures[i];
        lines.push(`${i + 1}. ${failure.testName}`);
        if (failure.error) {
          lines.push(`   Error: ${failure.error}`);
        }
        if (failure.details) {
          lines.push('   Details:');
          // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
          lines.push(failure.details.split('\n').map(line => `   ${line}`).join('\n'));
        }
        // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
        lines.push('');
      }
    } else {
      lines.push('✅ ALL TESTS PASSED', '');
      for (const result of this.results) {
        lines.push(`✓ ${result.testName}`);
      }
      // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
      lines.push('');
    }
    
    lines.push('='.repeat(80));
    
    return lines.join('\n');
  }

  /**
   * Generate detailed error message for throwing
   */
  generateErrorMessage(): string {
    const failures = this.getFailures();
    if (failures.length === 0) {
      return '';
    }

    const lines: string[] = [
      `${failures.length} test(s) failed:`,
      '',
    ];
    
    for (let i = 0; i < failures.length; i++) {
      const failure = failures[i];
      lines.push(`${i + 1}. ${failure.testName}:`);
      if (failure.error) {
        lines.push(`   ${failure.error}`);
      }
      // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Clear all results
   */
  clear(): void {
    this.results = [];
    this.currentTestDetails = '';
  }
}
