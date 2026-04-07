import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { SessionRecord } from "../types";

export type SessionSummary = {
  id: string;
  cwd: string;
  createdAt: string;
  lastActivityAt: string;
  messageCount: number;
};

export type SessionStore = {
  save(session: SessionRecord): Promise<void>;
  load(id: string): Promise<SessionRecord | null>;
  list(): Promise<SessionSummary[]>;
  loadLatest(): Promise<SessionRecord | null>;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSessionRecord(value: unknown): value is SessionRecord {
  if (!isObject(value)) {
    return false;
  }

  if (
    typeof value.id !== "string" ||
    typeof value.cwd !== "string" ||
    typeof value.createdAt !== "string" ||
    !Array.isArray(value.messages)
  ) {
    return false;
  }

  return value.messages.every((message) => {
    return (
      isObject(message) &&
      typeof message.role === "string" &&
      typeof message.content === "string" &&
      typeof message.createdAt === "string"
    );
  });
}

function toSessionSummary(session: SessionRecord): SessionSummary {
  const lastActivityAt = session.messages.reduce((latest, message) => {
    return message.createdAt > latest ? message.createdAt : latest;
  }, session.createdAt);

  return {
    id: session.id,
    cwd: session.cwd,
    createdAt: session.createdAt,
    lastActivityAt,
    messageCount: session.messages.length,
  };
}

async function readSessionRecord(filePath: string): Promise<SessionRecord | null> {
  try {
    const content = await readFile(filePath, "utf8");
    const parsed = JSON.parse(content) as unknown;

    return isSessionRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function createSessionStore(baseDir: string): SessionStore {
  return {
    async save(session: SessionRecord) {
      await mkdir(baseDir, { recursive: true });
      await writeFile(
        path.join(baseDir, `${session.id}.json`),
        JSON.stringify(session, null, 2),
        "utf8",
      );
    },
    async load(id: string): Promise<SessionRecord | null> {
      return readSessionRecord(path.join(baseDir, `${id}.json`));
    },
    async list(): Promise<SessionSummary[]> {
      try {
        const entries = await readdir(baseDir, { withFileTypes: true });
        const sessions = await Promise.all(
          entries
            .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
            .map((entry) => readSessionRecord(path.join(baseDir, entry.name))),
        );

        return sessions
          .filter((session): session is SessionRecord => session !== null)
          .map(toSessionSummary)
          .sort((left, right) => {
            return (
              right.lastActivityAt.localeCompare(left.lastActivityAt) ||
              right.createdAt.localeCompare(left.createdAt) ||
              left.id.localeCompare(right.id)
            );
          });
      } catch {
        return [];
      }
    },
    async loadLatest(): Promise<SessionRecord | null> {
      const latest = (await this.list())[0];

      if (!latest) {
        return null;
      }

      return this.load(latest.id);
    },
  };
}
