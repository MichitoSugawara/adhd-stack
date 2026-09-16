export interface PendingOc {
  connectionName: string;
  service: "convex" | "github";
}

const STORAGE_KEY = "adhd-pending-oc-v1";

const isOcService = (value: string): value is PendingOc["service"] =>
  value === "convex" || value === "github";

export const writePendingOc = (value: PendingOc): void => {
  window.sessionStorage.setItem(
    STORAGE_KEY,
    `${value.service}/${value.connectionName}`
  );
};

export const clearPendingOc = (): void => {
  window.sessionStorage.removeItem(STORAGE_KEY);
};

export const readPendingOc = (): PendingOc | null => {
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (raw === null) {
    return null;
  }
  const slash = raw.indexOf("/");
  if (slash <= 0) {
    return null;
  }
  const service = raw.slice(0, slash);
  const connectionName = raw.slice(slash + 1);
  if (!isOcService(service) || connectionName.length === 0) {
    return null;
  }
  return { connectionName, service };
};
