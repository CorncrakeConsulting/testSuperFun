# Code Redundancy Review

## 🔴 CRITICAL: Delete These Completely Redundant Files

### 1. **BettingTestingLogic.ts** - 100% Redundant Wrapper

**Location:** `logic/BettingTestingLogic.ts`
**Issue:** Thin wrapper that only calls WheelGamePage methods
**Used by:** 4 Cucumber step definitions

```typescript
// Current (redundant):
await new BettingTestingLogic(this.wheelGamePage).increaseBet();

// Should be:
await this.wheelGamePage.increaseBet();
```

**Savings:** 26 lines, removes unnecessary abstraction layer

---

### 2. **GameControlTestingLogic.ts** - 100% Redundant Wrapper

**Location:** `logic/GameControlTestingLogic.ts`
**Issue:** Every method just forwards to WheelGamePage
**Used by:** 4 Cucumber step definitions

```typescript
// Current (redundant):
await new GameControlTestingLogic(this.wheelGamePage).toggleAutoplay();

// Should be:
await this.wheelGamePage.toggleAutoplay();
```

**Savings:** 21 lines, removes unnecessary abstraction layer

---

### 3. **GameSetupTestingLogic.ts** - 90% Redundant Wrapper

**Location:** `logic/GameSetupTestingLogic.ts`
**Issue:** Almost all methods just forward to WheelGamePage
**Used by:** 7 Cucumber step definitions

```typescript
// Current (redundant):
await new GameSetupTestingLogic(this.wheelGamePage).setBalance(1000);

// Should be:
await this.wheelGamePage.testHooks.setPlayerData({ balance: 1000 });
```

**Exceptions:** `ensureAutoplayOff()` and `ensureAutoplayOn()` have minimal logic
**Recommendation:** Keep only these 2 methods, delete the rest
**Savings:** ~35 lines

---

### 4. **SpinTestingLogic.ts** - Partially Redundant

**Location:** `logic/SpinTestingLogic.ts`
**Issue:** Mix of useful methods and redundant wrappers

**Delete these methods (redundant):**

- `spinWithTargetSlice()` - just calls WheelGamePage methods
- `calibrateNormalSpeed()` / `calibrateQuickSpeed()` - thin wrappers

**Keep these methods (useful):**

- `spinWithContext()` - captures initial balance (useful abstraction)
- `spinMultipleTimes()` - contains loop logic

**Savings:** ~15 lines

---

### 5. **TestResultsSink.ts** - Completely Unused

**Location:** `logic/TestResultsSink.ts`
**Issue:** 173 lines of code that's NEVER used
**Used by:** Only instantiated in `world.ts`, never actually called

```typescript
// In world.ts - instantiated but never used
this.testResultsSink = new TestResultsSink();

// NO calls to:
// - addResult()
// - generateSummaryReport()
// - hasFailures()
// etc.
```

**Savings:** 173 lines of dead code

---

## 🟡 MEDIUM: Redundant Methods in WheelGamePage

### 6. **Duplicate Quick Spin Methods**

**Location:** `pages/WheelGamePage.ts`

```typescript
// Three methods that do almost the same thing:
async toggleQuickSpin() { ... }
async enableQuickSpin() { ... }  // Redundant - calls setQuickSpin(true)
async disableQuickSpin() { ... } // Redundant - calls setQuickSpin(false)
```

**Recommendation:** Keep `setQuickSpin(enabled: boolean)`, delete enable/disable helpers
**Savings:** 12 lines

---

### 7. **Duplicate Autoplay Methods**

**Location:** `pages/WheelGamePage.ts`

```typescript
// Two helper methods that just wrap toggleAutoplay():
async enableAutoplay() { ... }  // Check + toggle
async disableAutoplay() { ... } // Check + toggle
```

**Recommendation:** Delete these, use `toggleAutoplay()` directly
**Savings:** 14 lines

---

## 🟢 LOW: Minor Redundancy

### 8. **TestUtils.calculateExpectedBalance()** - Too Simple

**Location:** `utils/testUtils.ts`

```typescript
static calculateExpectedBalance(initialBalance: number, bet: number): number {
  return initialBalance - bet;  // Just subtraction!
}
```

**Recommendation:** Delete, use inline subtraction
**Savings:** 4 lines

---

### 9. **Empty Folders**

**Location:** `tests/logic/` - Empty folder
**Location:** `src/` - Empty folder

**Recommendation:** Delete empty directories
**Savings:** Cleaner project structure

---

## 📊 Summary

| File/Method                        | Lines          | Status       | Priority |
| ---------------------------------- | -------------- | ------------ | -------- |
| BettingTestingLogic.ts             | 26             | DELETE       | HIGH     |
| GameControlTestingLogic.ts         | 21             | DELETE       | HIGH     |
| GameSetupTestingLogic.ts           | 43             | REDUCE to 10 | HIGH     |
| SpinTestingLogic.ts                | 47             | REDUCE to 20 | MEDIUM   |
| TestResultsSink.ts                 | 173            | DELETE       | HIGH     |
| WheelGamePage quick spin helpers   | 12             | DELETE       | MEDIUM   |
| WheelGamePage autoplay helpers     | 14             | DELETE       | MEDIUM   |
| TestUtils.calculateExpectedBalance | 4              | DELETE       | LOW      |
| **TOTAL SAVINGS**                  | **~330 lines** |              |          |

---

## 🎯 Recommended Action Plan

### Phase 1: Delete Dead Code (HIGH Priority)

1. ✅ Delete `TestResultsSink.ts` (173 lines, never used)
2. ✅ Delete `BettingTestingLogic.ts` (26 lines)
3. ✅ Delete `GameControlTestingLogic.ts` (21 lines)
4. ✅ Update step definitions to call `wheelGamePage` directly
5. ✅ Delete empty folders (`tests/logic/`, `src/`)

**Impact:** Removes 220+ lines of unused/wrapper code
**Time:** 30 minutes
**Risk:** LOW - these are just pass-through wrappers

---

### Phase 2: Simplify GameSetupTestingLogic (HIGH Priority)

1. ✅ Keep only `ensureAutoplayOff()` and `ensureAutoplayOn()`
2. ✅ Delete all other methods (they're just wrappers)
3. ✅ Update step definitions to use `wheelGamePage` directly

**Impact:** Removes 33 lines
**Time:** 15 minutes
**Risk:** LOW

---

### Phase 3: Clean Up WheelGamePage (MEDIUM Priority)

1. ✅ Delete `enableQuickSpin()` and `disableQuickSpin()`
2. ✅ Delete `enableAutoplay()` and `disableAutoplay()`
3. ✅ Update callers to use `setQuickSpin(boolean)` and `toggleAutoplay()`

**Impact:** Removes 26 lines, cleaner API
**Time:** 15 minutes
**Risk:** LOW - only 2-3 call sites

---

### Phase 4: Refine SpinTestingLogic (MEDIUM Priority)

1. ✅ Delete `calibrateNormalSpeed()` and `calibrateQuickSpeed()`
2. ✅ Keep `spinWithContext()` and `spinMultipleTimes()`
3. ✅ Update callers to use direct methods

**Impact:** Removes 15 lines
**Time:** 10 minutes
**Risk:** LOW

---

### Phase 5: Minor Cleanup (LOW Priority)

1. Delete `TestUtils.calculateExpectedBalance()`
2. Use inline `initialBalance - bet` in tests

**Impact:** Removes 4 lines
**Time:** 5 minutes
**Risk:** MINIMAL

---

## 🏆 Expected Results

- **~330 lines removed** (15% code reduction)
- **Simpler architecture** - fewer layers of indirection
- **Easier maintenance** - less code to maintain
- **Clearer code** - direct calls instead of wrappers
- **Faster execution** - fewer function calls
- **Better demo** - cleaner, more professional codebase

---

## ⚠️ What NOT to Delete

### Keep These (They Have Value)

- ✅ **AssertionLogic** - Complex wait/assertion logic
- ✅ **BalanceTestingLogic** - Win calculation validation
- ✅ **DistributionTestingLogic** - Statistical analysis
- ✅ **AutoplayTestingLogic** - Complex autoplay state management
- ✅ **SharedDistributionStore** - Feature-level data sharing
- ✅ **WheelGamePage core methods** - Core page interactions

These files contain actual logic, not just pass-through wrappers.
