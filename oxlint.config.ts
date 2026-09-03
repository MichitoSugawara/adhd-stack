import { defineConfig } from "oxlint";
import antiSlop from "ultracite/oxlint/anti-slop";
import core from "ultracite/oxlint/core";
import { jsPluginSettings, selectJsPlugins } from "ultracite/oxlint/js-plugins";
import next from "ultracite/oxlint/next";
import nextJsPlugins from "ultracite/oxlint/next/js-plugins";

const jsPlugins = selectJsPlugins(["react-doctor"]);

export default defineConfig({
  extends: [core, next, nextJsPlugins, antiSlop, jsPlugins],
  ignorePatterns: [
    ...core.ignorePatterns,
    ".cursor/skills/**",
    "convex/_generated/**",
    "design-system/**",
  ],
  jsPlugins: jsPlugins.jsPlugins,
  overrides: [
    {
      files: [
        "apps/web/components/desktop-connect-screen.tsx",
        "apps/web/components/editor-screen.tsx",
      ],
      rules: {
        // Kumo's icon-only Button API requires the `shape` prop.
        "anti-slop/no-shape-in-symbol-names": "off",
      },
    },
    {
      files: ["convex/**/*.ts"],
      rules: {
        // Convex public API paths follow the file name; keep camelCase modules.
        "unicorn/filename-case": "off",
      },
    },
    {
      files: [
        "convex/auth.ts",
        "convex/http.ts",
        "convex/lib/oauthExchange.ts",
        "convex/lib/providers.ts",
        "convex/workspaceActions.ts",
      ],
      rules: {
        // Third-party OAuth / platform JSON is parsed at the HTTP boundary.
        "anti-slop/no-known-value-widening": "off",
        "anti-slop/no-runtime-typeof": "off",
        "anti-slop/no-unknown-parameters": "off",
        "anti-slop/no-unsafe-dictionary-type": "off",
        "anti-slop/require-safety-comment-for-type-assertion": "off",
      },
    },
  ],
  settings: jsPluginSettings,
});
