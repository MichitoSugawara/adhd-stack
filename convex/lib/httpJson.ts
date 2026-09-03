export const asString = (value: unknown): string | undefined =>
  typeof value === "string" && value.length > 0 ? value : undefined;

export const asNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  const parsed = Number(asString(value));
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};

export const asList = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

export const readJson = async (
  response: Response
): Promise<Record<string, unknown>> => {
  const text = await response.text();
  if (text.length === 0) {
    return {};
  }
  try {
    return asRecord(JSON.parse(text));
  } catch {
    return { raw: text };
  }
};
