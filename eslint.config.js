import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import sonarjs from "eslint-plugin-sonarjs";

export default tseslint.config(
  // Base configurations
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,

  {
    // Global settings
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },

    // Global rules
    rules: {
      // TypeScript specific rules
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/consistent-type-assertions": "error",

      // Code complexity and quality rules
      complexity: ["error", 15],
      "max-depth": ["error", 4],
      "max-lines-per-function": ["error", 75],
      "max-params": ["error", 5],
      "no-duplicate-imports": "error",
      "no-unreachable": "error",
    },
  },

  // SonarJS configuration
  {
    plugins: {
      sonarjs,
    },
    rules: {
      "sonarjs/cognitive-complexity": ["error", 15],
      "sonarjs/no-duplicate-string": "error",
      "sonarjs/no-identical-functions": "error",
      "sonarjs/prefer-immediate-return": "error",
    },
  },

  // Test files configuration
  {
    files: [
      "tests/**/*.ts",
      "__tests__/**/*.ts",
      "**/*.spec.ts",
      "**/*.test.ts",
    ],
    rules: {
      // Relax some rules for test files
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "max-lines-per-function": ["error", 200],
      "sonarjs/no-duplicate-string": "off",
    },
  },

  // Ignore patterns
  {
    ignores: [
      "node_modules/**",
      "test-results/**",
      "playwright-report/**",
      "coverage/**",
      "eslint-report.json",
      "dist/**",
      "build/**",
      "__tests__/**",
      "*.config.js",
      "*.cjs",
      "*.log",
    ],
  }
);
