/**
 * Utilities for exporting / clearing all Thrive data stored locally on this device.
 * Used by the Settings page.
 */

export const THRIVE_PREFIX = "thrive:";

export type ThriveExport = {
  exportedAt: string;
  version: 1;
  data: Record<string, unknown>;
};

export function collectAllLocalData(): Record<string, unknown> {
  if (typeof window === "undefined") return {};
  const out: Record<string, unknown> = {};
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (!key || !key.startsWith(THRIVE_PREFIX)) continue;
    try {
      out[key] = JSON.parse(window.localStorage.getItem(key) ?? "null");
    } catch {
      out[key] = window.localStorage.getItem(key);
    }
  }
  return out;
}

export function exportData(): ThriveExport {
  return {
    exportedAt: new Date().toISOString(),
    version: 1,
    data: collectAllLocalData(),
  };
}

export function downloadExport() {
  if (typeof window === "undefined") return;
  const blob = new Blob([JSON.stringify(exportData(), null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `thrive-export-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function clearAllLocalData() {
  if (typeof window === "undefined") return;
  const toDelete: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key && key.startsWith(THRIVE_PREFIX)) toDelete.push(key);
  }
  toDelete.forEach((k) => window.localStorage.removeItem(k));
}

export function countLocalEntries(): number {
  if (typeof window === "undefined") return 0;
  let n = 0;
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key && key.startsWith(THRIVE_PREFIX)) n++;
  }
  return n;
}
