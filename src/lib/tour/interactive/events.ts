/**
 * Lightweight event bus for wait-for-action interactive onboarding steps.
 */

export type OnboardingEventName =
  | "create-menu-opened"
  | "folder-created"
  | "folder-moved"
  | "folder-opened"
  | "song-created"
  | "song-opened"
  | "song-saved"
  | "collection-created"
  | "songs-added-to-collection"
  | "items-selected"
  | "select-all"
  | "context-menu-opened"
  | "service-created"
  | "service-opened"
  | "event-created"
  | "navigated-folders"
  | "navigated-collections"
  | "navigated-services"
  | "navigated-agenda";

type Listener = (detail?: unknown) => void;

const listeners = new Map<OnboardingEventName, Set<Listener>>();

export function emitOnboardingEvent(
  name: OnboardingEventName,
  detail?: unknown,
): void {
  const set = listeners.get(name);
  if (!set) return;
  for (const listener of set) {
    try {
      listener(detail);
    } catch {
      // ignore consumer errors
    }
  }
}

export function onOnboardingEvent(
  name: OnboardingEventName,
  listener: Listener,
): () => void {
  let set = listeners.get(name);
  if (!set) {
    set = new Set();
    listeners.set(name, set);
  }
  set.add(listener);
  return () => {
    set!.delete(listener);
  };
}

export function waitForOnboardingEvent(
  name: OnboardingEventName,
  signal?: AbortSignal,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const unsubscribe = onOnboardingEvent(name, (detail) => {
      cleanup();
      resolve(detail);
    });
    const onAbort = () => {
      cleanup();
      reject(new DOMException("Aborted", "AbortError"));
    };
    const cleanup = () => {
      unsubscribe();
      signal?.removeEventListener("abort", onAbort);
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}
