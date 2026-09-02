import { defineConfig } from "oxlint";
import antiSlop from "ultracite/oxlint/anti-slop";
import core from "ultracite/oxlint/core";
import { jsPluginSettings, selectJsPlugins } from "ultracite/oxlint/js-plugins";
import next from "ultracite/oxlint/next";
import nextJsPlugins from "ultracite/oxlint/next/js-plugins";

const jsPlugins = selectJsPlugins(["react-doctor"]);

export default defineConfig({
  extends: [core, next, nextJsPlugins, antiSlop, jsPlugins],
  ignorePatterns: core.ignorePatterns,
  jsPlugins: jsPlugins.jsPlugins,
  overrides: [
    {
      files: ["apps/web/components/frontend-mock.tsx"],
      rules: {
        // Kumo's icon-only Button API requires the `shape` prop.
        "anti-slop/no-shape-in-symbol-names": "off",
      },
    },
  ],
  settings: jsPluginSettings,
});
