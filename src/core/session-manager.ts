import { createSession } from "./session";
import type { SessionStore, SessionSummary } from "../storage/session-store";
import type { SessionRecord } from "../types";

export type ResetSessionResult = {
  session: SessionRecord;
  previousSessionId?: string;
};

export type SessionManager = {
  listSessions(): Promise<SessionSummary[]>;
  loadSessionById(sessionId: string): Promise<SessionRecord | null>;
  loadLatestSession(): Promise<SessionRecord | null>;
  resetSession(currentSession?: SessionRecord): ResetSessionResult;
};

type CreateSessionManagerInput = {
  cwd: string;
  store: SessionStore;
};

export function createSessionManager(input: CreateSessionManagerInput): SessionManager {
  return {
    listSessions() {
      return input.store.list();
    },
    loadSessionById(sessionId) {
      return input.store.load(sessionId);
    },
    loadLatestSession() {
      return input.store.loadLatest();
    },
    resetSession(currentSession) {
      return {
        session: createSession(input.cwd),
        previousSessionId: currentSession?.id,
      };
    },
  };
}
