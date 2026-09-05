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
    "design_handoff/**",
  ],
  jsPlugins: jsPlugins.jsPlugins,
  overrides: [
    {
      files: ["apps/web/components/editor-screen.tsx"],
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
        "convex/accountMerge.ts",
        "convex/auth.ts",
        "convex/chatActions.ts",
        "convex/http.ts",
        "convex/lib/accountLinking.ts",
        "convex/lib/accountMatch.ts",
        "convex/lib/actionAuth.ts",
        "convex/lib/cloudflarePages.ts",
        "convex/lib/codexCloud.ts",
        "convex/lib/codexDevice.ts",
        "convex/lib/convexProject.ts",
        "convex/lib/githubRepo.ts",
        "convex/lib/httpJson.ts",
        "convex/lib/jwt.ts",
        "convex/lib/oauthExchange.ts",
        "convex/lib/providers.ts",
        "convex/lib/tokenRefresh.ts",
        "convex/oauthInternal.ts",
        "convex/publishActions.ts",
        "convex/workspaceActions.ts",
        "apps/web/lib/mock-store.ts",
      ],
      rules: {
        // Third-party OAuth / platform JSON is parsed at the HTTP boundary.
        "anti-slop/no-conditional-empty-object-spread": "off",
        "anti-slop/no-known-value-widening": "off",
        "anti-slop/no-runtime-typeof": "off",
        "anti-slop/no-unknown-parameters": "off",
        "anti-slop/no-unsafe-dictionary-type": "off",
        "anti-slop/require-safety-comment-for-type-assertion": "off",
        "eslint/complexity": "off",
        "eslint/no-await-in-loop": "off",
        "node/callback-return": "off",
        "promise/avoid-new": "off",
        "react-doctor/async-await-in-loop": "off",
      },
    },
  ],
  settings: jsPluginSettings,
});
