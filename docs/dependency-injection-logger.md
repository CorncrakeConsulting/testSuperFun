# TestLogger Dependency Injection

## Overview

The `TestLogger` service now supports both static usage (backward compatible) and dependency injection for better testability and flexibility.

## Features

### 1. Interface-Based Design

```typescript
export interface ITestLogger {
  info(message: string, ...args: any[]): void;
  success(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  debug(message: string, ...args: any[]): void;
  step(message: string, ...args: any[]): void;
  spin(message: string, ...args: any[]): void;
}
```

### 2. Three Usage Patterns

#### Static (Backward Compatible)

```typescript
// Existing code still works
TestLogger.info("This is an info message");
TestLogger.success("Operation completed!");
```

#### Factory Method

```typescript
// Create a custom logger instance
const logger = TestLogger.create(true, true); // enabled, verbose
logger.info("Custom logger message");
```

#### Dependency Injection

```typescript
// Inject logger into classes
const customLogger = TestLogger.create(true, false);
const logic = new DistributionTestingLogic(world, customLogger);
```

## Example: DistributionTestingLogic

### Before (Static)

```typescript
export class DistributionTestingLogic {
  constructor(world: CustomWorld) {
    this.world = world;
    this.wheelGamePage = world.wheelGamePage;
  }

  public async performRandomSpins(times: number): Promise<void> {
    TestLogger.info(`Starting ${times} spins...`); // Hard-coded dependency
  }
}
```

### After (Injected)

```typescript
export class DistributionTestingLogic {
  private readonly logger: ITestLogger;

  constructor(world: CustomWorld, logger?: ITestLogger) {
    this.world = world;
    this.wheelGamePage = world.wheelGamePage;
    this.logger = logger ?? TestLogger.getDefault(); // Default fallback
  }

  public async performRandomSpins(times: number): Promise<void> {
    this.logger.info(`Starting ${times} spins...`); // Injected dependency
  }
}
```

## Benefits

### 1. **Testability**

Mock the logger in unit tests:

```typescript
const mockLogger: ITestLogger = {
  info: jest.fn(),
  success: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  step: jest.fn(),
  spin: jest.fn(),
};

const logic = new DistributionTestingLogic(world, mockLogger);
// Verify logger calls
expect(mockLogger.info).toHaveBeenCalledWith("Expected message");
```

### 2. **Flexibility**

Different logging configurations per instance:

```typescript
// Silent logger for background tasks
const silentLogger = TestLogger.create(false, false);
const backgroundLogic = new DistributionTestingLogic(world, silentLogger);

// Verbose logger for debugging
const verboseLogger = TestLogger.create(true, true);
const debugLogic = new DistributionTestingLogic(world, verboseLogger);
```

### 3. **Backward Compatibility**

All existing code continues to work without changes:

```typescript
// Old code still works
TestLogger.info("Message");

// New code uses injection
const logic = new DistributionTestingLogic(world); // Uses default logger
```

### 4. **Single Responsibility**

Classes depend on interface, not concrete implementation:

```typescript
// Can swap implementations easily
class CustomLogger implements ITestLogger {
  info(message: string) {
    // Custom logging logic (e.g., to file, database, etc.)
  }
  // ... other methods
}

const customLogger = new CustomLogger();
const logic = new DistributionTestingLogic(world, customLogger);
```

## Migration Strategy

### Phase 1: ✅ COMPLETED

- Add `ITestLogger` interface
- Make `TestLogger` implement interface with private constructor
- Add factory methods: `create()`, `getDefault()`
- Add backward-compatible static methods
- Update `DistributionTestingLogic` to accept injected logger

### Phase 2: OPTIONAL

Other logic classes can be updated incrementally:

- `AutoplayTestingLogic`
- `BalanceTestingLogic`
- `AssertionLogic`
- Step definition files

### Phase 3: FUTURE

Consider creating specialized loggers:

- `FileLogger` - Write to files
- `BufferedLogger` - Collect messages for test assertions
- `FilteredLogger` - Only log certain levels
- `StructuredLogger` - JSON output for machine parsing

## Configuration

### Environment Variables (Still Supported)

```bash
TEST_DEBUG=true npm test        # Enable logging
TEST_VERBOSE=true npm test      # Enable verbose mode
```

### Programmatic (New)

```typescript
// Global configuration (affects default instance)
TestLogger.setEnabled(true);
TestLogger.setVerbose(true);

// Instance configuration (independent)
const logger = TestLogger.create(true, false);
```

## Best Practices

1. **Default to injection**: New classes should accept logger parameter
2. **Provide fallback**: Use `logger ?? TestLogger.getDefault()` pattern
3. **Use interface**: Always type as `ITestLogger`, not `TestLogger`
4. **Static for convenience**: Use static methods in simple scripts/tests
5. **Instance for control**: Use injected instances when you need control

## Testing Examples

### Unit Test with Mock Logger

```typescript
test("should log progress during spins", async () => {
  const mockLogger = {
    info: jest.fn(),
    success: jest.fn(),
    // ... other methods
  };

  const logic = new DistributionTestingLogic(world, mockLogger);
  await logic.performRandomSpins(10);

  expect(mockLogger.info).toHaveBeenCalledWith(
    expect.stringContaining("Starting distribution test")
  );
});
```

### Integration Test with Silent Logger

```typescript
test("should perform spins without console output", async () => {
  const silentLogger = TestLogger.create(false, false);
  const logic = new DistributionTestingLogic(world, silentLogger);

  // No console output during test
  await logic.performRandomSpins(100);

  // Verify results
  const data = logic.getDistributionData();
  expect(data.totalSpins).toBe(100);
});
```

## Future Enhancements

1. **Structured Logging**: Add context/metadata to log entries
2. **Log Levels**: Add TRACE, FATAL levels
3. **Log Filtering**: Filter by component/category
4. **Log Aggregation**: Collect and analyze logs across tests
5. **Custom Formatters**: Different output formats (JSON, XML, etc.)
