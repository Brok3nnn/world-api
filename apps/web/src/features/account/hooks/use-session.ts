"use client";

import { useSyncExternalStore } from "react";

/*
 * Client-side session for the prototype: whether the visitor is signed in, plus the profile
 * edits and preferences they made, persisted per browser. Replace the storage functions with
 * real authentication and Server Actions once accounts exist; the hook API stays.
 */

export interface NotificationPreferences {
  buildFinished: boolean;
  lowCredits: boolean;
  weeklySummary: boolean;
}

interface SessionState {
  signedIn: boolean;
  /** Profile edits made in settings; `null` keeps the account's stored value. */
  displayName: string | null;
  bio: string | null;
  notifications: NotificationPreferences;
}

const STORAGE_KEY = "session";

const DEFAULT_STATE: SessionState = {
  signedIn: true,
  displayName: null,
  bio: null,
  notifications: { buildFinished: true, lowCredits: true, weeklySummary: false },
};

const listeners = new Set<() => void>();
let cached: SessionState | null = null;

function readState(): SessionState {
  if (cached) {
    return cached;
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    cached = stored
      ? { ...DEFAULT_STATE, ...(JSON.parse(stored) as Partial<SessionState>) }
      : DEFAULT_STATE;
  } catch {
    cached = DEFAULT_STATE;
  }
  return cached;
}

function writeState(next: SessionState) {
  cached = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage can be unavailable (private mode); the in-memory state still works.
  }
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

interface Session {
  state: SessionState;
  signIn: () => void;
  signOut: () => void;
  update: (patch: Partial<Omit<SessionState, "signedIn">>) => void;
}

export function useSession(): Session {
  const state = useSyncExternalStore(subscribe, readState, () => DEFAULT_STATE);

  return {
    state,
    signIn: () => writeState({ ...readState(), signedIn: true }),
    signOut: () => writeState({ ...readState(), signedIn: false }),
    update: (patch) => writeState({ ...readState(), ...patch }),
  };
}
