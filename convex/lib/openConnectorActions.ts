import {
  busyHttpMessage,
  withHttpRetries,
} from "./httpRetry";
import { asRecord, asString, readJson } from "./httpJson";
import { publicConnectError } from "./openConnectorParse";

export interface OpenConnectorActionResult {
  payload: Record<string, unknown>;
  status: number;
}

const requireRuntime = (): { baseUrl: string; token: string } => {
  const baseUrl = process.env.OPENCONNECTOR_BASE_URL?.trim().replace(
    /\/$/u,
    ""
  );
  const token = process.env.OPENCONNECTOR_RUNTIME_TOKEN?.trim();
  if (!(baseUrl && token)) {
    throw new Error("接続アプリの実行トークンがありません");
  }
  return { baseUrl, token };
};

const runtimeFetch = async (
  path: string,
  init: RequestInit & { connectionName?: string }
): Promise<OpenConnectorActionResult> => {
  const { baseUrl, token } = requireRuntime();
  const headers = new Headers(init.headers);
  headers.set("authorization", `Bearer ${token}`);
  if (!headers.has("content-type") && init.body) {
    headers.set("content-type", "application/json");
  }
  if (init.connectionName) {
    headers.set("x-oo-connector-alias", init.connectionName);
  }
  const response = await fetch(`${baseUrl}${path}`, {
    body: init.body,
    headers,
    method: init.method ?? "GET",
  });
  return {
    payload: await readJson(response),
    status: response.status,
  };
};

const unwrapData = (payload: Record<string, unknown>): Record<string, unknown> => {
  const data = asRecord(payload.data);
  const nested = asRecord(data.data);
  if (Object.keys(nested).length > 0) {
    return nested;
  }
  if (Object.keys(data).length > 0) {
    return data;
  }
  return payload;
};

export const invokeOpenConnectorAction = async (args: {
  actionId: string;
  connectionName: string;
  input?: Record<string, unknown>;
}): Promise<Record<string, unknown>> => {
  const result = await withHttpRetries(() =>
    runtimeFetch(`/v1/actions/${encodeURIComponent(args.actionId)}`, {
      body: JSON.stringify({ input: args.input ?? {} }),
      connectionName: args.connectionName,
      method: "POST",
    })
  );
  if (result.status === 429 || result.status === 503) {
    throw new Error(busyHttpMessage(result.status));
  }
  if (result.status === 404) {
    throw new Error(`unknown_action:${args.actionId}`);
  }
  if (result.status >= 400) {
    const detail =
      asString(result.payload.message) ??
      asString(result.payload.error) ??
      asString(asRecord(result.payload.data).message) ??
      busyHttpMessage(result.status);
    throw new Error(
      publicConnectError(new Error(detail), "接続アプリの実行に失敗しました")
    );
  }
  return unwrapData(result.payload);
};

export const invokeOpenConnectorActionIds = async (args: {
  actionIds: readonly string[];
  connectionName: string;
  input?: Record<string, unknown>;
}): Promise<Record<string, unknown>> => {
  const ids = args.actionIds.filter((id) => id.length > 0);
  let last: Error | undefined;
  for (const actionId of ids) {
    try {
      return await invokeOpenConnectorAction({
        actionId,
        connectionName: args.connectionName,
        input: args.input,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message.startsWith("unknown_action:")) {
        last = error instanceof Error ? error : new Error(message);
        continue;
      }
      throw error;
    }
  }
  throw last ?? new Error("接続アプリの実行に失敗しました");
};

export const proxyOpenConnector = async (args: {
  body?: Record<string, unknown>;
  connectionName: string;
  endpoint: string;
  method: string;
  service: string;
}): Promise<{ data: Record<string, unknown>; status: number }> => {
  const result = await withHttpRetries(() =>
    runtimeFetch(`/v1/proxy/${encodeURIComponent(args.service)}`, {
      body: JSON.stringify({
        body: args.body,
        endpoint: args.endpoint,
        method: args.method,
      }),
      connectionName: args.connectionName,
      method: "POST",
    })
  );
  if (result.status === 429 || result.status === 503) {
    throw new Error(busyHttpMessage(result.status));
  }
  const data = unwrapData(result.payload);
  const upstream = asRecord(data);
  const status =
    typeof upstream.status === "number" ? upstream.status : result.status;
  const payload = asRecord(upstream.data);
  if (result.status >= 400) {
    throw new Error(
      publicConnectError(
        new Error(asString(result.payload.message) ?? `HTTP ${String(result.status)}`),
        "接続アプリの実行に失敗しました"
      )
    );
  }
  return { data: Object.keys(payload).length > 0 ? payload : upstream, status };
};
