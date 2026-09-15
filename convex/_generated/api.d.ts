/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accountMerge from "../accountMerge.js";
import type * as auth from "../auth.js";
import type * as chat from "../chat.js";
import type * as chatActions from "../chatActions.js";
import type * as codingBackends from "../codingBackends.js";
import type * as codingTurns from "../codingTurns.js";
import type * as connections from "../connections.js";
import type * as http from "../http.js";
import type * as oauth from "../oauth.js";
import type * as oauthInternal from "../oauthInternal.js";
import type * as oauthStore from "../oauthStore.js";
import type * as publishActions from "../publishActions.js";
import type * as workspaceActions from "../workspaceActions.js";
import type * as workspaceInternal from "../workspaceInternal.js";
import type * as workspaceProvision from "../workspaceProvision.js";
import type * as workspacePublish from "../workspacePublish.js";
import type * as workspaces from "../workspaces.js";
import type { ApiFromModules, FilterApi, FunctionReference } from "convex/server";

declare const fullApi: ApiFromModules<{
  accountMerge: typeof accountMerge;
  auth: typeof auth;
  chat: typeof chat;
  chatActions: typeof chatActions;
  codingBackends: typeof codingBackends;
  codingTurns: typeof codingTurns;
  connections: typeof connections;
  http: typeof http;
  oauth: typeof oauth;
  oauthInternal: typeof oauthInternal;
  oauthStore: typeof oauthStore;
  publishActions: typeof publishActions;
  workspaceActions: typeof workspaceActions;
  workspaceInternal: typeof workspaceInternal;
  workspaceProvision: typeof workspaceProvision;
  workspacePublish: typeof workspacePublish;
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
