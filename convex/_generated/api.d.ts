/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as chat from "../chat.js";
import type * as connections from "../connections.js";
import type * as http from "../http.js";
import type * as oauth from "../oauth.js";
import type * as oauthInternal from "../oauthInternal.js";
import type * as oauthStore from "../oauthStore.js";
import type * as workspaceActions from "../workspaceActions.js";
import type * as workspaceInternal from "../workspaceInternal.js";
import type * as workspaceProvision from "../workspaceProvision.js";
import type * as workspaces from "../workspaces.js";
import type { ApiFromModules, FilterApi, FunctionReference } from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  chat: typeof chat;
  connections: typeof connections;
  http: typeof http;
  oauth: typeof oauth;
  oauthInternal: typeof oauthInternal;
  oauthStore: typeof oauthStore;
  workspaceActions: typeof workspaceActions;
  workspaceInternal: typeof workspaceInternal;
  workspaceProvision: typeof workspaceProvision;
  workspaces: typeof workspaces;
}>;

export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
