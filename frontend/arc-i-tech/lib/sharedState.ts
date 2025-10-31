'use client';

export const DASHBOARD_SYNC_EVENT = "arc-dashboard-sync";

type DashboardSyncDetail = {
  key: string;
  value: string;
};

export function readSharedState<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }
  const stored = window.localStorage.getItem(key);
  if (!stored) {
    return fallback;
  }
  try {
    return JSON.parse(stored) as T;
  } catch {
    return fallback;
  }
}

export function persistSharedState(key: string, value: unknown) {
  if (typeof window === "undefined") {
    return;
  }
  const serialized = JSON.stringify(value);
  window.localStorage.setItem(key, serialized);
  window.dispatchEvent(
    new CustomEvent<DashboardSyncDetail>(DASHBOARD_SYNC_EVENT, {
      detail: { key, value: serialized },
    }),
  );
}

export function subscribeToSharedState<T>(
  key: string,
  handler: (value: T) => void,
) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const listener = (event: Event) => {
    const customEvent = event as CustomEvent<DashboardSyncDetail>;
    if (!customEvent.detail || customEvent.detail.key !== key) {
      return;
    }
    try {
      handler(JSON.parse(customEvent.detail.value) as T);
    } catch {
      /* ignore malformed payload */
    }
  };

  window.addEventListener(DASHBOARD_SYNC_EVENT, listener as EventListener);

  return () => {
    window.removeEventListener(DASHBOARD_SYNC_EVENT, listener as EventListener);
  };
}
