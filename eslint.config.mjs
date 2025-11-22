import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";

export default [
    { files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"] },
    { languageOptions: { globals: globals.browser } },
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
    {
        plugins: {
            react: reactPlugin,
        },
        rules: {
            "react/react-in-jsx-scope": "off",
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/no-unused-vars": "warn",
            "@typescript-eslint/ban-ts-comment": "warn"
        },
        settings: {
            react: {
                version: "detect"
            }
        }
    },
    {
        ignores: [
            "node_modules/",
            "android/",
            "ios/",
            "dist/",
            "build/",
            "patches/",
            "scripts/",
            "*.config.js",
            "**/*.json",
            "src/lib/database.types.ts"
        ]
    }
];
