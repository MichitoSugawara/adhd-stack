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
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const recordFromJson = (value: unknown): Record<string, unknown> => {
  if (Array.isArray(value)) {
    return { items: value };
  }
  return asRecord(value);
};

export const asList = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

export const truncateText = (value: string, max = 900): string =>
  value.length > max ? `${value.slice(0, max)}…` : value;

export const payloadText = (
  payload: Record<string, unknown>,
  max = 900
): string => {
  try {
    return truncateText(JSON.stringify(payload), max);
  } catch {
    return truncateText(asString(payload.raw) ?? "unserializable", max);
  }
};

export const readJson = async (
  response: Response
): Promise<Record<string, unknown>> => {
  const text = await response.text();
  if (text.length === 0) {
    return {};
  }
  try {
    return recordFromJson(JSON.parse(text));
  } catch {
    return { raw: text };
  }
};
