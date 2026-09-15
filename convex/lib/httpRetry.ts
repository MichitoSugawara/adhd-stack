const sleep = async (ms: number): Promise<void> => {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

export const isRetryableHttpStatus = (status: number): boolean =>
  status === 408 ||
  status === 425 ||
  status === 429 ||
  status === 502 ||
  status === 503 ||
  status === 504;

export const isRetryableError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return (
    message.includes("429") ||
    message.includes("rate") ||
    message.includes("too many") ||
    message.includes("503") ||
    message.includes("502") ||
    message.includes("timeout") ||
    message.includes("混んで")
  );
};

export const withHttpRetries = async <T extends { status: number }>(
  run: () => Promise<T>,
  attempts = 4
): Promise<T> => {
  let last: T | undefined;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    last = await run();
    if (!isRetryableHttpStatus(last.status)) {
      return last;
    }
    if (attempt < attempts - 1) {
      await sleep(400 * 2 ** attempt);
    }
  }
  return last as T;
};

export const busyHttpMessage = (status: number): string => {
  if (status === 429 || status === 503) {
    return "相手側が混んでいます。少し待ってからやり直してください";
  }
  return `HTTP ${String(status)}`;
};

export const OPENCONNECTOR_FETCH_TIMEOUT_MS = 15_000;

export const OPENCONNECTOR_TIMEOUT_MESSAGE =
  "接続アプリが応答しません。もう一度試してください。";

export const isAbortLikeError = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }
  return (
    error.name === "AbortError" ||
    error.name === "TimeoutError" ||
    error.message.includes("The operation was aborted")
  );
};

const timeoutSignal = (timeoutMs: number): AbortSignal => {
  if (typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(timeoutMs);
  }
  const controller = new AbortController();
  setTimeout(() => {
    controller.abort();
  }, timeoutMs);
  return controller.signal;
};

export const fetchWithTimeout = async (
  url: string,
  init: RequestInit | undefined,
  timeoutMs: number,
  timeoutMessage = OPENCONNECTOR_TIMEOUT_MESSAGE
): Promise<Response> => {
  try {
    return await fetch(url, {
      ...init,
      signal: timeoutSignal(timeoutMs),
    });
  } catch (error) {
    if (isAbortLikeError(error)) {
      throw new Error(timeoutMessage, { cause: error });
    }
    throw error;
  }
};
