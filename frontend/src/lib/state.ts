import { useSyncExternalStore } from "react";

export type AppFilters = {
  q: string;
  minScore: number;
  maxScore: number | null;
  tier: number | null;
  grade: string;
  subgroup: string;
  consentPartner: number | null;
  sortBy: "total_score" | "monetisable_value_eur";
  sortOrder: "asc" | "desc";
};

export type AppPagination = {
  limit: number;
  offset: number;
};

export type AppFlags = {
  loading: Record<string, boolean>;
  errors: Record<string, string | null>;
};

export type AppState = {
  currentFairId: number;
  filters: AppFilters;
  pagination: AppPagination;
  flags: AppFlags;
};

const defaultState: AppState = {
  currentFairId: 1,
  filters: {
    q: "",
    minScore: 0,
    maxScore: null,
    tier: null,
    grade: "",
    subgroup: "",
    consentPartner: null,
    sortBy: "total_score",
    sortOrder: "desc",
  },
  pagination: {
    limit: 15,
    offset: 0,
  },
  flags: {
    loading: {
      leads: false,
      leadDetail: false,
      dashboard: false,
      stands: false,
    },
    errors: {
      leads: null,
      leadDetail: null,
      dashboard: null,
      stands: null,
    },
  },
};

let appState: AppState = { ...defaultState };
const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

export function getAppState(): AppState {
  return appState;
}

export function setAppState(updater: Partial<AppState> | ((prev: AppState) => AppState)) {
  appState = typeof updater === "function" ? updater(appState) : { ...appState, ...updater };
  emitChange();
}

export function resetAppState() {
  appState = { ...defaultState };
  emitChange();
}

export function useAppState<T>(selector: (state: AppState) => T): T {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => selector(appState),
    () => selector(appState),
  );
}

function parseNumber(input: string | null, fallback: number): number {
  if (!input) {
    return fallback;
  }
  const n = Number(input);
  return Number.isFinite(n) ? n : fallback;
}

export function hydrateFromUrl(search: URLSearchParams) {
  setAppState((prev) => ({
    ...prev,
    currentFairId: parseNumber(search.get("fair_id"), prev.currentFairId),
    filters: {
      ...prev.filters,
      q: search.get("q") ?? prev.filters.q,
      minScore: parseNumber(search.get("min_score"), prev.filters.minScore),
      maxScore: search.get("max_score") ? parseNumber(search.get("max_score"), 100) : null,
      tier: search.get("tier") ? parseNumber(search.get("tier"), 0) : null,
      grade: search.get("grade") ?? "",
      subgroup: search.get("subgroup") ?? "",
      consentPartner:
        search.get("consent_partner") === null
          ? null
          : parseNumber(search.get("consent_partner"), 0) >= 1
            ? 1
            : 0,
      sortBy:
        search.get("sort_by") === "monetisable_value_eur"
          ? "monetisable_value_eur"
          : "total_score",
      sortOrder: search.get("sort_order") === "asc" ? "asc" : "desc",
    },
    pagination: {
      limit: parseNumber(search.get("limit"), prev.pagination.limit),
      offset: parseNumber(search.get("offset"), prev.pagination.offset),
    },
  }));
}

export function stateToQueryString(state: AppState): string {
  const search = new URLSearchParams();

  search.set("fair_id", String(state.currentFairId));
  search.set("limit", String(state.pagination.limit));
  search.set("offset", String(state.pagination.offset));
  search.set("sort_by", state.filters.sortBy);
  search.set("sort_order", state.filters.sortOrder);

  if (state.filters.q) search.set("q", state.filters.q);
  if (state.filters.grade) search.set("grade", state.filters.grade);
  if (state.filters.subgroup) search.set("subgroup", state.filters.subgroup);
  if (state.filters.minScore > 0) search.set("min_score", String(state.filters.minScore));
  if (state.filters.maxScore !== null) search.set("max_score", String(state.filters.maxScore));
  if (state.filters.tier !== null) search.set("tier", String(state.filters.tier));
  if (state.filters.consentPartner !== null) {
    search.set("consent_partner", String(state.filters.consentPartner));
  }

  return search.toString();
}

export function updateUrlFromState(pathname: string) {
  if (typeof window === "undefined") {
    return;
  }
  const query = stateToQueryString(appState);
  const target = query.length > 0 ? `#${pathname}?${query}` : `#${pathname}`;
  if (window.location.hash !== target) {
    window.location.hash = target;
  }
}

export function setLoadingFlag(key: keyof AppFlags["loading"], loading: boolean) {
  setAppState((prev) => ({
    ...prev,
    flags: {
      ...prev.flags,
      loading: {
        ...prev.flags.loading,
        [key]: loading,
      },
    },
  }));
}

export function setErrorFlag(key: keyof AppFlags["errors"], error: string | null) {
  setAppState((prev) => ({
    ...prev,
    flags: {
      ...prev.flags,
      errors: {
        ...prev.flags.errors,
        [key]: error,
      },
    },
  }));
}
