import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Rule 1 of "Built to change safely": features are sealed boxes.
const featureBoundary = {
  group: ["@/features/*/*", "**/features/*/*"],
  message: 'Import a feature only through its front door, e.g. "@/features/dashboard".',
};

// Design system rule: no raw colors outside the token file and the logo.
const noRawColors = [
  {
    selector: "Literal[value=/\\[#[0-9a-fA-F]{3,8}\\]/]",
    message: "Use a design token (bg-pine, text-ink...) instead of a raw color.",
  },
  {
    selector: "TemplateElement[value.raw=/\\[#[0-9a-fA-F]{3,8}\\]/]",
    message: "Use a design token (bg-pine, text-ink...) instead of a raw color.",
  },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [featureBoundary] }],
      // A leading underscore marks an argument that must exist but isn't used (e.g. form actions).
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["core/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            featureBoundary,
            { group: ["@/features", "@/features/*"], message: "core/ is shared and must not depend on any feature." },
          ],
        },
      ],
    },
  },
  {
    files: ["app/**/*.{ts,tsx}", "features/**/*.{ts,tsx}"],
    rules: { "no-restricted-syntax": ["error", ...noRawColors] },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
