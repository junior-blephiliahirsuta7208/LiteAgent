import { randomUUID } from "node:crypto";

import type { SessionRecord } from "../types";

export function createSession(cwd: string): SessionRecord {
  return {
    id: randomUUID(),
    cwd,
    messages: [],
    createdAt: new Date().toISOString(),
  };
}
