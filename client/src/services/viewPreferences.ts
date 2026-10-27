import { useMocks } from "./serviceConfig";

export interface ViewPreferences {
  clientId: number | null;
  projectId: number | null;
  showArchivedClients: boolean;
  showArchivedProjects: boolean;
  showBilled: boolean;
  showUnbilled: boolean;
  showNonBillable: boolean;
  sortMode: "newest" | "oldest" | "hours";
}

const storageKey = `timeledger-view:${useMocks ? "mock" : "api"}`;

const defaults: ViewPreferences = {
  clientId: null,
  projectId: null,
  showArchivedClients: false,
  showArchivedProjects: false,
  showBilled: true,
  showUnbilled: true,
  showNonBillable: true,
  sortMode: "newest",
};

export function loadViewPreferences(): ViewPreferences {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null");
    if (!saved || typeof saved !== "object") return { ...defaults };

    // Check each saved field so invalid values keep their normal defaults.
    return {
      clientId: Number.isSafeInteger(saved.clientId) && saved.clientId > 0 ? saved.clientId : null,
      projectId: Number.isSafeInteger(saved.projectId) && saved.projectId > 0 ? saved.projectId : null,
      showArchivedClients: typeof saved.showArchivedClients === "boolean" ? saved.showArchivedClients : defaults.showArchivedClients,
      showArchivedProjects: typeof saved.showArchivedProjects === "boolean" ? saved.showArchivedProjects : defaults.showArchivedProjects,
      showBilled: typeof saved.showBilled === "boolean" ? saved.showBilled : defaults.showBilled,
      showUnbilled: typeof saved.showUnbilled === "boolean" ? saved.showUnbilled : defaults.showUnbilled,
      showNonBillable: typeof saved.showNonBillable === "boolean" ? saved.showNonBillable : defaults.showNonBillable,
      sortMode: saved.sortMode === "newest" || saved.sortMode === "oldest" || saved.sortMode === "hours" ? saved.sortMode : defaults.sortMode,
    };
  } catch {
    return { ...defaults };
  }
}

export function saveViewPreferences(preferences: ViewPreferences): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(preferences));
  } catch {
    // The app remains usable when browser storage is blocked or full.
  }
}
