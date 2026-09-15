"use client";

import { useMutation, useQuery } from "convex/react";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

export const useWorkspaceList = () => useQuery(api.workspaces.listMine);

export const useWorkspaceBySlug = (slug: string) =>
  useQuery(api.workspaces.getBySlug, { slug });

export const useCreateNamedApp = () =>
  useMutation(api.workspaceProvision.createAndProvision);

export const useRetryProvision = () =>
  useMutation(api.workspaceProvision.retryProvision);

export const useChatMessages = (workspaceId?: Id<"workspaces">) =>
  useQuery(
    api.chat.listRecent,
    workspaceId ? { workspaceId } : "skip"
  );

export const useSendChat = () => useMutation(api.chat.send);
