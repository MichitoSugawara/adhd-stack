"use client";

import { useAction, useConvexAuth, useMutation, useQuery } from "convex/react";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

export const useWorkspaceList = () => {
  const { isAuthenticated } = useConvexAuth();
  return useQuery(api.workspaces.listMine, isAuthenticated ? {} : "skip");
};

export const useWorkspaceBySlug = (slug: string) => {
  const { isAuthenticated } = useConvexAuth();
  return useQuery(
    api.workspaces.getBySlug,
    isAuthenticated ? { slug } : "skip"
  );
};

export const useCreateNamedApp = () =>
  useMutation(api.workspaceProvision.createAndProvision);

export const useRetryProvision = () =>
  useMutation(api.workspaceProvision.retryProvision);

export const useChatMessages = (workspaceId?: Id<"workspaces">) => {
  const { isAuthenticated } = useConvexAuth();
  return useQuery(
    api.chat.listRecent,
    isAuthenticated && workspaceId ? { workspaceId } : "skip"
  );
};

export const useSendChat = () => useMutation(api.chat.send);

export const usePublishApp = () => useAction(api.workspacePublish.publish);

export const useRefreshPages = () =>
  useAction(api.workspacePublish.refreshPages);

export const useDeleteApp = () => useAction(api.workspaceTeardown.deleteApp);
