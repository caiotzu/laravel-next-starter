import { dirname } from "path";
import { fileURLToPath } from "url";

import { FlatCompat } from "@eslint/eslintrc";
import importPlugin from "eslint-plugin-import";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  {
    plugins: {
      import: importPlugin,
    },

    rules: {
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
          pathGroups: [
            // React sempre primeiro
            {
              pattern: "react",
              group: "external",
              position: "before",
            },

            // Next
            {
              pattern: "next/**",
              group: "external",
              position: "before",
            },

            // Types globais
            {
              pattern: "@/types/**",
              group: "internal",
              position: "before",
            },

            // Layouts (app layer)
            {
              pattern: "@/app/**",
              group: "internal",
              position: "before",
            },

            // Shared components
            {
              pattern: "@/components/**",
              group: "internal",
              position: "before",
            },

            // Features por último dentro de internal
            {
              pattern: "@/features/**",
              group: "internal",
              position: "after",
            },
          ],
          pathGroupsExcludedImportTypes: ["react"],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],
    },
  },

  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
