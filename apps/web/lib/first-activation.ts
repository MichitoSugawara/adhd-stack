export const FIRST_ACTIVATION_STORAGE_KEY = "adhd-first-activation-v1";
export const FIRST_CREATE_HREF = "/new?welcome=1";

const CONSUMED_VALUE = "consumed";
const CHANGE_EVENT = "adhd-first-activation";

export interface FirstActivationGate {
  allConnected: boolean;
  consumed: boolean;
  hasLastWorkspace: boolean;
  workspaceCount: number | null;
}

export const shouldAdvanceToFirstCreate = (
  gate: FirstActivationGate
): boolean => {
  if (!gate.allConnected || gate.consumed || gate.hasLastWorkspace) {
    return false;
  }
  return gate.workspaceCount === 0;
};

export const firstCreateHref = (): string => FIRST_CREATE_HREF;

export const destinationAfterConnect = ({
  lastPath,
  resumeWorkspace,
  workspaceCount,
}: {
  lastPath: string | null;
  resumeWorkspace: boolean;
  workspaceCount: number;
}): string => {
  if (resumeWorkspace && lastPath) {
    return lastPath;
  }
  if (lastPath === null && workspaceCount === 0) {
    return FIRST_CREATE_HREF;
  }
  return "/new";
};

let memoryConsumed = false;
let storageBlocked = false;

const readStoredConsumed = (): boolean | null => {
  if (!globalThis.window) {
    return false;
  }
  if (storageBlocked) {
    return null;
  }
  try {
    return (
      window.localStorage.getItem(FIRST_ACTIVATION_STORAGE_KEY) ===
      CONSUMED_VALUE
    );
  } catch {
    storageBlocked = true;
    return null;
  }
};

export const readFirstActivationConsumed = (): boolean =>
  readStoredConsumed() ?? memoryConsumed;

export const markFirstActivationConsumed = (): void => {
  if (!globalThis.window) {
    return;
  }
  memoryConsumed = true;
  if (!storageBlocked) {
    try {
      window.localStorage.setItem(FIRST_ACTIVATION_STORAGE_KEY, CONSUMED_VALUE);
    } catch {
      storageBlocked = true;
    }
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
};
