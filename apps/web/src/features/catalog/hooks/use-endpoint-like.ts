"use client";

import { idSchema } from "@repo/contracts/ids";
import { useSyncExternalStore } from "react";

/*
 * Client-side like state shared by every like button on the page and persisted per browser.
 * Replace the storage functions with a server action once accounts exist; the hook API stays.
 */

const STORAGE_KEY = "liked-endpoints";
/** Storage is outside our control, so what it holds is parsed like any other input. */
const likedIdsSchema = idSchema("endpoint").array();
const listeners = new Set<() => void>();
let likedIds: ReadonlySet<string> | null = null;

function readLikedIds(): ReadonlySet<string> {
  if (likedIds) {
    return likedIds;
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const parsed = likedIdsSchema.safeParse(stored ? JSON.parse(stored) : []);
    likedIds = new Set(parsed.success ? parsed.data : []);
  } catch {
    likedIds = new Set();
  }
  return likedIds;
}

function writeLikedIds(next: ReadonlySet<string>) {
  likedIds = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
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

const EMPTY: ReadonlySet<string> = new Set();

interface EndpointLike {
  liked: boolean;
  toggle: () => void;
}

export function useEndpointLike(endpointId: string): EndpointLike {
  const ids = useSyncExternalStore(subscribe, readLikedIds, () => EMPTY);
  const liked = ids.has(endpointId);

  const toggle = () => {
    const next = new Set(readLikedIds());
    if (liked) {
      next.delete(endpointId);
    } else {
      next.add(endpointId);
    }
    writeLikedIds(next);
  };

  return { liked, toggle };
}

/** Ids of every endpoint the visitor has liked in this browser. */
export function useLikedEndpointIds(): ReadonlySet<string> {
  return useSyncExternalStore(subscribe, readLikedIds, () => EMPTY);
}
