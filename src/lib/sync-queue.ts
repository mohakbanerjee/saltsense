/** Offline action queue — flush when connectivity returns. */
"use client";

const KEY = "saltsense-sync-queue-v1";

export type QueuedAction = {
  id: string;
  type: "irrigation_log";
  payload: unknown;
  createdAt: string;
};

export function enqueue(action: Omit<QueuedAction, "id" | "createdAt">): void {
  if (typeof window === "undefined") return;
  const list = readQueue();
  list.push({
    ...action,
    id: `q-${Date.now()}`,
    createdAt: new Date().toISOString(),
  });
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function readQueue(): QueuedAction[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as QueuedAction[];
  } catch {
    return [];
  }
}

export function flushQueue(): QueuedAction[] {
  const items = readQueue();
  if (typeof window !== "undefined") localStorage.removeItem(KEY);
  return items;
}

/** Call on online event — demo just clears queue (no remote backend). */
export function armOnlineFlush(): () => void {
  if (typeof window === "undefined") return () => undefined;
  const onOnline = () => {
    flushQueue();
  };
  window.addEventListener("online", onOnline);
  return () => window.removeEventListener("online", onOnline);
}
