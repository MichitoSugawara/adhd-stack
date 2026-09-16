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
    "apps/web/app/beautifui/**",
    "apps/web/components/primitives/**",
    "apps/web/scripts/**",
  ],
  jsPlugins: jsPlugins.jsPlugins,
  overrides: [
    {
      files: ["apps/web/app/beautifui/**", "apps/web/components/primitives/**"],
      rules: {
        // Beautiful UI registry files keep upstream names and demo traces.
        "eslint/complexity": "off",
        "eslint/max-lines": "off",
        "react-doctor/no-giant-component": "off",
        "unicorn/filename-case": "off",
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
        "convex/lib/cloudflareAccount.ts",
        "convex/lib/cloudflarePages.ts",
        "convex/lib/codexCloud.ts",
        "convex/lib/codexDevice.ts",
        "convex/lib/convexFromOpenConnector.ts",
        "convex/lib/convexFunctionPush.ts",
        "convex/lib/convexProject.ts",
        "convex/lib/githubFromOpenConnector.ts",
        "convex/lib/openConnectorActionInputs.ts",
        "convex/lib/githubProvision.ts",
        "convex/lib/githubRepo.ts",
        "convex/lib/httpJson.ts",
        "convex/lib/httpRetry.ts",
        "convex/lib/pagesEnv.ts",
        "convex/lib/publishResult.ts",
        "convex/lib/appTemplate.ts",
        "convex/lib/openConnectorActions.ts",
        "convex/lib/jwt.ts",
        "convex/lib/oauthExchange.ts",
        "convex/lib/openConnector.ts",
        "convex/lib/openConnectorParse.ts",
        "convex/lib/providers.ts",
        "convex/lib/tokenRefresh.ts",
        "convex/oauthInternal.ts",
        "convex/publishActions.ts",
        "convex/workspaceActions.ts",
        "convex/workspaceProvision.ts",
        "convex/codingTurns.ts",
        "apps/web/lib/chat-tasks.ts",
        "apps/web/lib/chat-view.ts",
        "apps/web/lib/coding-port.ts",
        "apps/web/lib/connect-copy.ts",
        "apps/web/lib/connect-error.ts",
        "apps/web/lib/connections-port.ts",
        "apps/web/lib/last-workspace.ts",
        "apps/web/lib/publish-flow.ts",
        "apps/web/lib/publish-steps.ts",
        "apps/web/lib/shell-state.ts",
        "apps/web/components/shell/session-effects.tsx",
      ],
      rules: {
        // Third-party OAuth / platform JSON is parsed at the HTTP boundary.
        // Shell localStorage is the same shape of untrusted JSON at the client boundary.
        "anti-slop/no-conditional-empty-object-spread": "off",
        "anti-slop/no-known-value-widening": "off",
        "anti-slop/no-runtime-typeof": "off",
        "anti-slop/no-unknown-parameters": "off",
        "anti-slop/no-unsafe-dictionary-type": "off",
        "anti-slop/require-safety-comment-for-type-assertion": "off",
        "eslint/complexity": "off",
        "eslint/no-await-in-loop": "off",
        "eslint/require-await": "off",
        "node/callback-return": "off",
        "promise/avoid-new": "off",
        "promise/prefer-await-to-then": "off",
        "react-doctor/async-await-in-loop": "off",
        "react-doctor/nextjs-no-client-side-redirect": "off",
        "react-doctor/only-export-components": "off",
        "typescript/no-unsafe-assignment": "off",
        "typescript/no-unsafe-member-access": "off",
        "typescript/no-unsafe-type-assertion": "off",
      },
    },
  ],
  settings: jsPluginSettings,
});
