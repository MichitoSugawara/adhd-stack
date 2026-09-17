import {
  convexDeleteProjectActionIds,
  convexDeleteProjectInputs,
} from "./openConnectorActionInputs";

export const isOpenConnectorActionSchemaMismatch = (
  message: string
): boolean => {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("does not match the action schema") ||
    normalized.includes("action input does not match")
  );
};

export const shouldFallThroughOpenConnectorDeleteToProxy = (
  message: string
): boolean =>
  message.startsWith("unknown_action:") ||
  isOpenConnectorActionSchemaMismatch(message);

export type OpenConnectorDeleteFallback =
  | { kind: "already_gone" }
  | { kind: "fail"; message: string }
  | { kind: "proxy" };

export const openConnectorDeleteFallback = (
  errorMessage: string
): OpenConnectorDeleteFallback => {
  if (errorMessage.toLowerCase().includes("404")) {
    return { kind: "already_gone" };
  }
  if (shouldFallThroughOpenConnectorDeleteToProxy(errorMessage)) {
    return { kind: "proxy" };
  }
  return { kind: "fail", message: errorMessage };
};

export interface ConvexOpenConnectorDeleteDeps {
  invoke: (args: {
    actionIds: readonly string[];
    connectionName: string;
    input?: Record<string, unknown>;
  }) => Promise<Record<string, unknown>>;
  proxy: (args: {
    body?: Record<string, unknown>;
    connectionName: string;
    endpoint: string;
    method: string;
    service: string;
  }) => Promise<{ data: Record<string, unknown>; status: number }>;
}

export const deleteConvexProjectViaOpenConnector = async (args: {
  connectionName: string;
  deps: ConvexOpenConnectorDeleteDeps;
  projectId: string;
}): Promise<{
  alreadyGone: boolean;
  data: Record<string, unknown>;
  status: number;
  via: "action" | "proxy";
}> => {
  const { invoke, proxy } = args.deps;
  const inputs = convexDeleteProjectInputs(args.projectId);
  for (const input of inputs) {
    try {
      await invoke({
        actionIds: convexDeleteProjectActionIds,
        connectionName: args.connectionName,
        input,
      });
      return {
        alreadyGone: false,
        data: {},
        status: 200,
        via: "action",
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      const fallback = openConnectorDeleteFallback(message);
      if (fallback.kind === "already_gone") {
        return {
          alreadyGone: true,
          data: {},
          status: 404,
          via: "action",
        };
      }
      if (fallback.kind === "fail") {
        throw new Error(fallback.message, { cause: error });
      }
    }
  }
  const proxied = await proxy({
    connectionName: args.connectionName,
    endpoint: `/projects/${encodeURIComponent(args.projectId)}/delete`,
    method: "POST",
    service: "convex",
  });
  return {
    alreadyGone: proxied.status === 404,
    data: proxied.data,
    status: proxied.status,
    via: "proxy",
  };
};
