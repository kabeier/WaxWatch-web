module.exports = {
  root: true,
  ignorePatterns: ["dist/", "node_modules/", "*.config.js", "next-env.d.ts", ".next/"],

  env: {
    browser: true,
    es2021: true,
  },

  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },

  settings: {
    react: { version: "detect" },
  },

  plugins: ["@typescript-eslint", "react", "react-hooks", "jsx-a11y"],

  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended",
    "prettier",
  ],

  rules: {
    "react/react-in-jsx-scope": "off",
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
  },

  overrides: [
    {
      files: ["src/lib/**/*.{ts,tsx,js,jsx}"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              {
                group: ["../logger", "../../logger", "../../../logger", "../../../../logger", "../../../../../logger"],
                message: "Use '@/lib/logger' for cross-folder logger imports.",
              },
              {
                group: ["@/lib/logger/*"],
                message: "Import directly from '@/lib/logger'.",
              },
            ],
          },
        ],
      },
    },
    {
      files: ["src/lib/api/**/*.{ts,tsx,js,jsx}"],
      excludedFiles: ["**/*.test.*", "**/*.spec.*"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              {
                group: ["react", "react/*"],
                message: "api core must remain platform-agnostic (no React imports).",
              },
              {
                group: ["next", "next/*"],
                message: "api core must remain platform-agnostic (no Next.js imports).",
              },
              {
                group: ["@/components", "@/components/*"],
                message: "api core cannot import UI modules.",
              },
              {
                group: ["@/lib/query", "@/lib/query/*", "@web-query", "@web-query/*"],
                message: "api core cannot depend on the web query layer.",
              },
              {
                group: ["client-only", "client-only/*"],
                message: "api core cannot depend on browser-only modules.",
              },
              {
                group: ["../logger", "../../logger", "../../../logger", "../../../../logger", "../../../../../logger"],
                message: "Use '@/lib/logger' for cross-folder logger imports.",
              },
              {
                group: ["@/lib/logger/*"],
                message: "Import directly from '@/lib/logger'.",
              },
            ],
          },
        ],
        "no-restricted-globals": [
          "error",
          { name: "window", message: "Inject browser access behind adapters in the web layer." },
          { name: "document", message: "Inject browser access behind adapters in the web layer." },
          {
            name: "localStorage",
            message: "Inject browser access behind adapters in the web layer.",
          },
          {
            name: "sessionStorage",
            message: "Inject browser access behind adapters in the web layer.",
          },
        ],
      },
    },
  ],
};
