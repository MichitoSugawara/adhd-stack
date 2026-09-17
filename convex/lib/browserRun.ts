import { asList, asRecord, asString, payloadText, readJson } from "./httpJson";
import { looksLikeCfAccountId } from "./jwt";
import { asStoredHttpUrl } from "./publishResult";

export const KITESURF_BROWSER = "kitesurf";

export const BROWSER_RUN_SCREENSHOT_PATHS = [
  "browser-run/screenshot",
  "browser-rendering/screenshot",
] as const;

export type BrowserRunScreenshotPath =
  (typeof BROWSER_RUN_SCREENSHOT_PATHS)[number];

export type PreviewViewport = "desktop" | "mobile";

export type BrowserRunCredentialSource = "missing" | "platform" | "user";

export interface BrowserRunCredentials {
  accountId: string;
  source: Exclude<BrowserRunCredentialSource, "missing">;
  token: string;
}

export type ScreenshotResult =
  | { bytes: Uint8Array; contentType: string; kind: "image" }
  | { kind: "error"; message: string }
  | { kind: "forbidden"; message: string };

export const BROWSER_RUN_SETUP_MESSAGE =
  "ブラウザプレビューには Cloudflare Browser Run（Kitesurf）が必要です。Cloudflare を接続し、Browser Rendering の編集権限があることを確認してください。";

export const BROWSER_RUN_FORBIDDEN_MESSAGE =
  "つながっている Cloudflare では Browser Run（Kitesurf）を使えません。Browser Rendering の編集権限を確認し、つなぎ直してください。";

export const browserRunScreenshotUrl = (
  accountId: string,
  path: BrowserRunScreenshotPath = "browser-run/screenshot"
): string => {
  const url = new URL(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/${path}`
  );
  url.searchParams.set("browser", KITESURF_BROWSER);
  return url.toString();
};

export const viewportFor = (kind: PreviewViewport) =>
  kind === "mobile"
    ? {
        deviceScaleFactor: 2,
        hasTouch: true,
        height: 844,
        isMobile: true,
        width: 390,
      }
    : {
        deviceScaleFactor: 1,
        hasTouch: false,
        height: 800,
        isMobile: false,
        width: 1280,
      };

export const pickBrowserRunCredentials = (args: {
  platformAccountId?: string | null;
  platformToken?: string | null;
  userAccountId?: string | null;
  userToken?: string | null;
}): BrowserRunCredentials | { source: "missing" } => {
  const userAccountId = args.userAccountId ?? undefined;
  const platformAccountId = args.platformAccountId ?? undefined;
  if (args.userToken && looksLikeCfAccountId(userAccountId)) {
    return {
      accountId: userAccountId,
      source: "user",
      token: args.userToken,
    };
  }
  if (args.platformToken && looksLikeCfAccountId(platformAccountId)) {
    return {
      accountId: platformAccountId,
      source: "platform",
      token: args.platformToken,
    };
  }
  if (args.platformToken && looksLikeCfAccountId(userAccountId)) {
    return {
      accountId: userAccountId,
      source: "platform",
      token: args.platformToken,
    };
  }
  return { source: "missing" };
};

export const classifyBrowserRunStatus = (
  status: number
): "error" | "forbidden" =>
  status === 401 || status === 403 ? "forbidden" : "error";

const decodeBase64 = (value: string): Uint8Array => {
  const raw = value.includes(",") ? (value.split(",")[1] ?? value) : value;
  const binary = atob(raw);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.codePointAt(index) ?? 0;
  }
  return bytes;
};

interface BrowserRunErrorPayload {
  error?: string;
  errors?: unknown;
  raw?: string;
  result?: unknown;
}

const messageFromPayload = (payload: BrowserRunErrorPayload): string => {
  const first = asRecord(asList(payload.errors)[0]);
  return (
    asString(first.message) ??
    asString(payload.error) ??
    asString(payload.raw) ??
    payloadText(asRecord(payload))
  );
};

export const screenshotFromResponse = async (
  response: Response
): Promise<ScreenshotResult> => {
  const type = response.headers.get("content-type") ?? "";
  if (response.ok && type.includes("image/")) {
    return {
      bytes: new Uint8Array(await response.arrayBuffer()),
      contentType: type.split(";")[0] ?? "image/png",
      kind: "image",
    };
  }
  const raw = await readJson(response);
  const payload: BrowserRunErrorPayload = {
    error: asString(raw.error),
    errors: raw.errors,
    raw: asString(raw.raw),
    result: raw.result,
  };
  const message = messageFromPayload(payload);
  if (!response.ok) {
    return {
      kind: classifyBrowserRunStatus(response.status),
      message:
        message || `Browser Run が ${String(response.status)} を返しました`,
    };
  }
  const encoded =
    asString(payload.result) ??
    asString(asRecord(payload.result).screenshot) ??
    asString(asRecord(payload.result).image);
  if (encoded) {
    return {
      bytes: decodeBase64(encoded),
      contentType: "image/png",
      kind: "image",
    };
  }
  return {
    kind: "error",
    message: message || "Kitesurf の応答に画像がありませんでした",
  };
};

export const captureKitesurfScreenshot = async (args: {
  accountId: string;
  fetcher?: typeof fetch;
  targetUrl: string;
  token: string;
  viewport: PreviewViewport;
}): Promise<ScreenshotResult> => {
  if (!looksLikeCfAccountId(args.accountId)) {
    return {
      kind: "error",
      message: "Cloudflare アカウントを特定できませんでした。",
    };
  }
  const request = async (path: BrowserRunScreenshotPath) => {
    const response = await (args.fetcher ?? fetch)(
      browserRunScreenshotUrl(args.accountId, path),
      {
        body: JSON.stringify({
          gotoOptions: { timeout: 25_000, waitUntil: "networkidle0" },
          screenshotOptions: { type: "png" },
          url: args.targetUrl,
          viewport: viewportFor(args.viewport),
        }),
        headers: {
          Authorization: `Bearer ${args.token}`,
          "Content-Type": "application/json",
        },
        method: "POST",
      }
    );
    return {
      result: await screenshotFromResponse(response),
      status: response.status,
    };
  };
  const primary = await request("browser-run/screenshot");
  if (primary.result.kind === "image" || primary.status !== 404) {
    return primary.result;
  }
  const fallback = await request("browser-rendering/screenshot");
  return fallback.result;
};

export const setupMessageFor = (source: BrowserRunCredentialSource): string => {
  if (source === "user") {
    return BROWSER_RUN_FORBIDDEN_MESSAGE;
  }
  return BROWSER_RUN_SETUP_MESSAGE;
};

export const isWorkspacePreviewTarget = (
  targetUrl: string,
  workspace: {
    cloudflarePagesUrl?: string;
    cloudflarePreviewUrl?: string;
    cloudflarePreviewUrls?: string[];
  }
): boolean => {
  const wanted = asStoredHttpUrl(targetUrl);
  if (!wanted) {
    return false;
  }
  const allowed = [
    workspace.cloudflarePagesUrl,
    workspace.cloudflarePreviewUrl,
    ...(workspace.cloudflarePreviewUrls ?? []),
  ].flatMap((value) => {
    const href = asStoredHttpUrl(value);
    return href ? [href] : [];
  });
  return allowed.includes(wanted);
};
