import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import importPlugin from "eslint-plugin-import";

const eslintConfig = [
  ...nextVitals,
  ...nextTs,

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
    // Regras do React Compiler (eslint-plugin-react-hooks 7, incluído no eslint-config-next 16).
    // Mantidas como aviso para não alterar o resultado do `npm run lint` existente.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/static-components": "warn",
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
