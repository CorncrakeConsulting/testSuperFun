# Unit Tests Directory

This directory contains **true unit tests** - fast, isolated tests that don't require browser instances.

## Directory Structure

```
__tests__/
├── pages/              # Unit tests for page object models
│   └── WheelGamePage.test.ts
├── logic/              # Unit tests for business logic classes
└── utils/              # Unit tests for utility functions
```

## TypeScript Industry Standards

This follows **TypeScript/Jest conventions**:

- ✅ **`__tests__/`** directory at project root
- ✅ **`.test.ts`** suffix for test files
- ✅ **Mirrors source structure** (`pages/`, `logic/`, etc.)
- ✅ **Co-located** with source code conceptually

## Alternative Patterns

Other valid TypeScript conventions:

```
src/
  pages/
    WheelGamePage.ts
    WheelGamePage.test.ts       # Co-located (alternative)
    __tests__/
      WheelGamePage.test.ts     # Nested (alternative)

test/                           # Separate test directory (alternative)
  pages/
    WheelGamePage.test.ts
```

**We use `__tests__/` at root** because:

- Clear separation from E2E tests (`tests/`)
- Standard Jest convention
- Works well with Playwright's test runner
- Easy to configure test patterns

## Unit vs Integration vs E2E

### Unit Tests (`__tests__/`)

- **Fast** (<1ms per test)
- **Isolated** (mocked dependencies)
- **No browser** required
- Tests: Builder pattern, DI, business logic
- Example: `WheelGamePage.test.ts`

### Integration Tests (`tests/*.spec.ts`)

- **Medium speed** (~1-2s per test)
- **Real browser** (headless)
- Tests: UI interactions, game mechanics
- Example: `game-initialization.spec.ts`

### E2E Tests (`tests/features/*.feature`)

- **Slow** (~5-30s per scenario)
- **Full stack** (browser + backend)
- **BDD format** (human-readable)
- Tests: Complete user workflows
- Example: `balance-and-payout.feature`

## Running Unit Tests

```bash
# Run all unit tests (fast)
npx playwright test __tests__/

# Run specific test file
npx playwright test __tests__/pages/WheelGamePage.test.ts

# Watch mode (runs on file changes)
npx playwright test __tests__/ --ui

# With coverage (if configured)
npx playwright test __tests__/ --coverage
```

## Writing Unit Tests

### Good Unit Test Example:

```typescript
test("should use injected data reader", async () => {
  const mockPage = createMockPage();
  const mockData = { getBalance: async () => 9999 };

  const gamePage = WheelGamePage.builder()
    .withPage(mockPage as any)
    .withDataReader(mockData as any)
    .build();

  expect(await gamePage.data.getBalance()).toBe(9999);
});
```

### Characteristics:

- ✅ Fast (no browser)
- ✅ Isolated (mocked dependencies)
- ✅ Focused (tests one thing)
- ✅ Deterministic (same result every time)

## Test Naming Convention

```typescript
test.describe("ClassName", () => {
  test.describe("methodName", () => {
    test("should do something when condition", () => {
      // Arrange, Act, Assert
    });
  });
});
```

## Mock Factories

Keep mock creation DRY with factory functions:

```typescript
function createMockPage() {
  return {
    goto: async () => {},
    locator: () => ({ click: async () => {} }),
  };
}
```

## Benefits of Unit Tests

1. **Fast feedback** - Run 100s of tests in seconds
2. **Catch bugs early** - Before browser tests
3. **Refactoring confidence** - Tests break immediately
4. **Documentation** - Show how to use classes
5. **Design feedback** - Hard to test = bad design
