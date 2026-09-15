import { v } from "convex/values";

import { query } from "./_generated/server";
import {
  defaultCodingBackend,
  isCursorApiConfigured,
} from "./lib/codingBackendEnv";
import { codingBackendValidator } from "./validators";

export const getOptions = query({
  args: {},
  handler: () => ({
    cursorConfigured: isCursorApiConfigured(),
    defaultKind: defaultCodingBackend(),
  }),
  returns: v.object({
    cursorConfigured: v.boolean(),
    defaultKind: codingBackendValidator,
  }),
});
