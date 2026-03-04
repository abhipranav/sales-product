import nextConfig from "eslint-config-next";

const eslintConfig = [
  ...nextConfig,
  {
    rules: {
      "no-console": "warn",
      "no-duplicate-imports": "error",
      "no-var": "error",
      "prefer-const": "warn",
      eqeqeq: ["error", "always"],
      "no-eval": "error",
      "no-implied-eval": "error"
    }
  },
  {
    files: ["lib/logger.ts", "prisma/seed.mjs"],
    rules: {
      "no-console": "off"
    }
  }
];

export default eslintConfig;
