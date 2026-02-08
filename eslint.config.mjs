import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Enforce structured logging — no raw console calls
      "no-console": ["warn", { allow: [] }],

      // TypeScript strictness
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      }],
      "@typescript-eslint/no-explicit-any": "warn",

      // React best practices
      "react/no-unescaped-entities": "off",
      "react/jsx-no-target-blank": "error",

      // Import hygiene
      "no-duplicate-imports": "error",

      // Code quality
      "no-var": "error",
      "prefer-const": "warn",
      "eqeqeq": ["error", "always"],
      "no-eval": "error",
      "no-implied-eval": "error",
    },
  },
  {
    // Allow console in logger and seed files only
    files: ["lib/logger.ts", "prisma/seed.mjs"],
    rules: {
      "no-console": "off",
    },
  },
];

export default eslintConfig;
