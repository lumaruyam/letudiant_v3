const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(/\/$/, "");

type Primitive = string | number | boolean | null | undefined;

export type LeadListItem = {
  student_id: number;
  full_name: string;
  grade: string;
  student_subgroup: string;
  intent_score: number;
  engagement_score: number;
  monetisability_score: number;
  total_score: number;
  tier_eur: number;
  resell_factor: number;
  monetisable_value_eur: number;
  consent_partner: number;
  consent_call: number;
  top_drivers: string[];
};

export type LeadsResponse = {
  data: LeadListItem[];
  total: number;
  limit: number;
  offset: number;
  error?: string;
};

export type LeadDetailResponse = {
  student_id: number;
  fair_id: number | null;
  profile: Record<string, unknown>;
  consents: Record<string, unknown>;
  derived: Record<string, unknown>;
  score: Record<string, unknown>;
  monetization: Record<string, unknown>;
  timeline: Array<Record<string, unknown>>;
  timeline_summary: Record<string, number>;
  error?: string;
};

export type FairKpisResponse = {
  fair_id: number;
  total_leads: number;
  optin_partner_pct: number;
  optin_call_pct: number;
  tier_distribution: Array<{
    tier_eur: number;
    leads_count: number;
    value_eur: number;
  }>;
  total_monetisable_value_eur: number;
  error?: string;
};

export type StandKpiItem = {
  fair_id: number;
  stand_id: number;
  stand_code: string;
  exhibitor_name: string;
  stand_category: string;
  stand_taps: number;
  brochure_requests: number;
  exhibitor_scans: number;
  high_intent_unique_students: number;
};

export type ConferenceKpiItem = {
  fair_id: number;
  conference_id: number;
  conference_code: string;
  conference_title: string;
  topic: string;
  speaker_name: string;
  conference_scans: number;
  unique_attendees: number;
};

export type KpiListResponse<T> = {
  data: T[];
  error?: string;
};

export type LeadScoreResponse = {
  student_id: number;
  fair_id: number | null;
  intent_score: number;
  engagement_score: number;
  monetisability_score: number;
  richness_score: number;
  total_score: number;
  prequalified: number;
  tier_eur: number;
  resell_factor: number;
  monetisable_value_eur: number;
  error?: string;
};

const fallbackLeads: LeadsResponse = {
  data: [],
  total: 0,
  limit: 50,
  offset: 0,
};

const fallbackLeadDetail: LeadDetailResponse = {
  student_id: 0,
  fair_id: null,
  profile: {},
  consents: {},
  derived: {},
  score: {},
  monetization: {},
  timeline: [],
  timeline_summary: {},
};

const fallbackLeadScore: LeadScoreResponse = {
  student_id: 0,
  fair_id: null,
  intent_score: 0,
  engagement_score: 0,
  monetisability_score: 0,
  richness_score: 0,
  total_score: 0,
  prequalified: 0,
  tier_eur: 0,
  resell_factor: 1,
  monetisable_value_eur: 0,
};

const fallbackFairKpis: FairKpisResponse = {
  fair_id: 1,
  total_leads: 0,
  optin_partner_pct: 0,
  optin_call_pct: 0,
  tier_distribution: [],
  total_monetisable_value_eur: 0,
};

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

function toStringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function toIntFlag(value: unknown): number {
  const n = toNumber(value, 0);
  return n >= 1 ? 1 : 0;
}

function toQueryString(params: Record<string, Primitive>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    search.set(key, String(value));
  }
  return search.toString();
}

async function requestJson<T>(
  path: string,
  fallback: T,
  normalize?: (data: unknown) => T,
): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${path}`);
    if (!response.ok) {
      const message = `HTTP ${response.status}`;
      return { ...fallback, error: message } as T;
    }
    const raw = (await response.json()) as unknown;
    return normalize ? normalize(raw) : (raw as T);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network error";
    return { ...fallback, error: message } as T;
  }
}

function normalizeLeadItem(input: unknown): LeadListItem {
  const row = (input ?? {}) as Record<string, unknown>;
  const topDriversRaw = Array.isArray(row.top_drivers) ? row.top_drivers : [];
  return {
    student_id: toNumber(row.student_id),
    full_name: toStringValue(row.full_name, "Inconnu"),
    grade: toStringValue(row.grade, "Unknown"),
    student_subgroup: toStringValue(row.student_subgroup, "Unknown"),
    intent_score: toNumber(row.intent_score),
    engagement_score: toNumber(row.engagement_score),
    monetisability_score: toNumber(row.monetisability_score),
    total_score: toNumber(row.total_score),
    tier_eur: toNumber(row.tier_eur),
    resell_factor: toNumber(row.resell_factor, 1),
    monetisable_value_eur: toNumber(row.monetisable_value_eur),
    consent_partner: toIntFlag(row.consent_partner),
    consent_call: toIntFlag(row.consent_call),
    top_drivers: topDriversRaw.map((item) => toStringValue(item)).filter(Boolean),
  };
}

export async function getLeads(params: Record<string, Primitive> = {}): Promise<LeadsResponse> {
  const query = toQueryString(params);
  const path = query.length > 0 ? `/leads?${query}` : "/leads";

  return requestJson(path, fallbackLeads, (raw) => {
    const data = (raw ?? {}) as Record<string, unknown>;
    const rows = Array.isArray(data.data) ? data.data : [];
    return {
      data: rows.map(normalizeLeadItem),
      total: toNumber(data.total),
      limit: toNumber(data.limit, toNumber(params.limit, 50)),
      offset: toNumber(data.offset, toNumber(params.offset, 0)),
    };
  });
}

export async function getLeadById(id: number | string): Promise<LeadDetailResponse> {
  return requestJson(`/leads/${id}`, fallbackLeadDetail, (raw) => {
    const data = (raw ?? {}) as Record<string, unknown>;
    return {
      student_id: toNumber(data.student_id),
      fair_id: data.fair_id === null || data.fair_id === undefined ? null : toNumber(data.fair_id),
      profile: (data.profile as Record<string, unknown>) ?? {},
      consents: (data.consents as Record<string, unknown>) ?? {},
      derived: (data.derived as Record<string, unknown>) ?? {},
      score: (data.score as Record<string, unknown>) ?? {},
      monetization: (data.monetization as Record<string, unknown>) ?? {},
      timeline: Array.isArray(data.timeline) ? (data.timeline as Array<Record<string, unknown>>) : [],
      timeline_summary: (data.timeline_summary as Record<string, number>) ?? {},
    };
  });
}

export async function getLeadScore(id: number | string): Promise<LeadScoreResponse> {
  return requestJson(`/leads/${id}/score`, fallbackLeadScore, (raw) => {
    const data = (raw ?? {}) as Record<string, unknown>;
    return {
      student_id: toNumber(data.student_id),
      fair_id: data.fair_id === null || data.fair_id === undefined ? null : toNumber(data.fair_id),
      intent_score: toNumber(data.intent_score),
      engagement_score: toNumber(data.engagement_score),
      monetisability_score: toNumber(data.monetisability_score),
      richness_score: toNumber(data.richness_score),
      total_score: toNumber(data.total_score),
      prequalified: toIntFlag(data.prequalified),
      tier_eur: toNumber(data.tier_eur),
      resell_factor: toNumber(data.resell_factor, 1),
      monetisable_value_eur: toNumber(data.monetisable_value_eur),
    };
  });
}

export async function getKpis(fairId: number): Promise<FairKpisResponse> {
  return requestJson(`/kpis/fair/${fairId}`, { ...fallbackFairKpis, fair_id: fairId }, (raw) => {
    const data = (raw ?? {}) as Record<string, unknown>;
    const distribution = Array.isArray(data.tier_distribution) ? data.tier_distribution : [];
    return {
      fair_id: toNumber(data.fair_id, fairId),
      total_leads: toNumber(data.total_leads),
      optin_partner_pct: toNumber(data.optin_partner_pct),
      optin_call_pct: toNumber(data.optin_call_pct),
      tier_distribution: distribution.map((item) => {
        const row = (item ?? {}) as Record<string, unknown>;
        return {
          tier_eur: toNumber(row.tier_eur),
          leads_count: toNumber(row.leads_count),
          value_eur: toNumber(row.value_eur),
        };
      }),
      total_monetisable_value_eur: toNumber(data.total_monetisable_value_eur),
    };
  });
}

export async function getStandKpis(params: Record<string, Primitive> = {}): Promise<KpiListResponse<StandKpiItem>> {
  const query = toQueryString(params);
  const path = query.length > 0 ? `/kpis/stands?${query}` : "/kpis/stands";

  return requestJson(path, { data: [] as StandKpiItem[] }, (raw) => {
    const data = Array.isArray(raw) ? raw : [];
    return {
      data: data.map((item) => {
        const row = (item ?? {}) as Record<string, unknown>;
        return {
          fair_id: toNumber(row.fair_id),
          stand_id: toNumber(row.stand_id),
          stand_code: toStringValue(row.stand_code),
          exhibitor_name: toStringValue(row.exhibitor_name, "Stand sans nom"),
          stand_category: toStringValue(row.stand_category, "Unknown"),
          stand_taps: toNumber(row.stand_taps),
          brochure_requests: toNumber(row.brochure_requests),
          exhibitor_scans: toNumber(row.exhibitor_scans),
          high_intent_unique_students: toNumber(row.high_intent_unique_students),
        };
      }),
    };
  });
}

export async function getConferenceKpis(
  params: Record<string, Primitive> = {},
): Promise<KpiListResponse<ConferenceKpiItem>> {
  const query = toQueryString(params);
  const path = query.length > 0 ? `/kpis/conferences?${query}` : "/kpis/conferences";

  return requestJson(path, { data: [] as ConferenceKpiItem[] }, (raw) => {
    const data = Array.isArray(raw) ? raw : [];
    return {
      data: data.map((item) => {
        const row = (item ?? {}) as Record<string, unknown>;
        return {
          fair_id: toNumber(row.fair_id),
          conference_id: toNumber(row.conference_id),
          conference_code: toStringValue(row.conference_code),
          conference_title: toStringValue(row.conference_title, "Conférence sans titre"),
          topic: toStringValue(row.topic, "Unknown"),
          speaker_name: toStringValue(row.speaker_name),
          conference_scans: toNumber(row.conference_scans),
          unique_attendees: toNumber(row.unique_attendees),
        };
      }),
    };
  });
}
