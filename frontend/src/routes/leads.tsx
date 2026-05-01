import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { AdminLayout } from "@/components/admin-layout";
import { getLeads, type LeadListItem } from "@/lib/api";
import {
  hydrateFromUrl,
  setAppState,
  setErrorFlag,
  setLoadingFlag,
  updateUrlFromState,
  useAppState,
} from "@/lib/state";

type TierFilter = 0 | 3 | 15 | 23;

const scoreFmt = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });
const eurFmt = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

function normalizeTierLabel(tierEur: number): string {
  if (tierEur >= 23) return "PLATINUM";
  if (tierEur >= 15) return "GOLD";
  if (tierEur >= 3) return "SILVER";
  return "BASE";
}

function getTierColor(tierLabel: string) {
  switch (tierLabel) {
    case "PLATINUM":
      return { bg: "#4f378a", text: "white" };
    case "GOLD":
      return { bg: "#c9a227", text: "white" };
    case "SILVER":
      return { bg: "#6750a4", text: "white" };
    default:
      return { bg: "var(--surface-container)", text: "var(--foreground)" };
  }
}

function parseSearchParams() {
  if (typeof window === "undefined") {
    return new URLSearchParams();
  }
  const hash = window.location.hash.replace(/^#/, "");
  const [, query = ""] = hash.split("?");
  return new URLSearchParams(query);
}

function LeadsPage() {
  const navigate = useNavigate();

  const state = useAppState((s) => s);
  const [rows, setRows] = useState<LeadListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [exporting, setExporting] = useState(false);

  const loading = state.flags.loading.leads;
  const error = state.flags.errors.leads;

  useEffect(() => {
    hydrateFromUrl(parseSearchParams());
  }, []);

  const queryPayload = useMemo(
    () => ({
      fair_id: state.currentFairId,
      q: state.filters.q || undefined,
      grade: state.filters.grade || undefined,
      subgroup: state.filters.subgroup || undefined,
      min_score: state.filters.minScore > 0 ? state.filters.minScore : undefined,
      tier: state.filters.tier ?? undefined,
      consent_partner: state.filters.consentPartner ?? undefined,
      limit: state.pagination.limit,
      offset: state.pagination.offset,
      sort_by: state.filters.sortBy,
      sort_order: state.filters.sortOrder,
    }),
    [
      state.currentFairId,
      state.filters.q,
      state.filters.grade,
      state.filters.subgroup,
      state.filters.minScore,
      state.filters.tier,
      state.filters.consentPartner,
      state.filters.sortBy,
      state.filters.sortOrder,
      state.pagination.limit,
      state.pagination.offset,
    ],
  );

  useEffect(() => {
    let active = true;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    async function loadLeads() {
      setLoadingFlag("leads", true);
      setErrorFlag("leads", null);

      const result = await getLeads(queryPayload);
      if (!active) return;

      setRows(result.data);
      setTotal(result.total);

      setAppState((prev) => ({
        ...prev,
        pagination: {
          ...prev.pagination,
          limit: result.limit || prev.pagination.limit,
          offset: result.offset || prev.pagination.offset,
        },
      }));

      if (result.error) {
        setErrorFlag("leads", `Erreur API: ${result.error}`);
        retryTimer = setTimeout(() => {
          if (active) {
            loadLeads();
          }
        }, 5000);
      }
      setLoadingFlag("leads", false);
      updateUrlFromState("/leads");
    }

    loadLeads();

    return () => {
      active = false;
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
    };
  }, [queryPayload]);

  const currentPage = Math.floor(state.pagination.offset / state.pagination.limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / state.pagination.limit));

  const gradeOptions = ["", "Terminale", "Première", "Post-bac", "Other"];
  const subgroupOptions = ["", "school_group", "non_school_group"];

  const updateFilter = (patch: Partial<typeof state.filters>) => {
    setAppState((prev) => ({
      ...prev,
      filters: { ...prev.filters, ...patch },
      pagination: { ...prev.pagination, offset: 0 },
    }));
  };

  const goToPage = (page: number) => {
    const nextPage = Math.max(1, Math.min(totalPages, page));
    setAppState((prev) => ({
      ...prev,
      pagination: {
        ...prev.pagination,
        offset: (nextPage - 1) * prev.pagination.limit,
      },
    }));
  };

  const exportFilteredCsv = async () => {
    if (total === 0) return;
    setExporting(true);

    const escapeCsv = (value: string | number) => {
      const text = String(value ?? "");
      if (text.includes(",") || text.includes('"') || text.includes("\n")) {
        return `"${text.replace(/"/g, '""')}"`;
      }
      return text;
    };

    const headers = [
      "student_id",
      "full_name",
      "grade",
      "student_subgroup",
      "total_score",
      "tier_eur",
      "resell_factor",
      "monetisable_value_eur",
      "consent_partner",
      "consent_call",
      "top_drivers",
    ];

    const pageSize = 200;
    let allRows: LeadListItem[] = [];
    let offset = 0;

    try {
      while (true) {
        const page = await getLeads({
          fair_id: state.currentFairId,
          q: state.filters.q || undefined,
          grade: state.filters.grade || undefined,
          subgroup: state.filters.subgroup || undefined,
          min_score: state.filters.minScore > 0 ? state.filters.minScore : undefined,
          tier: state.filters.tier ?? undefined,
          consent_partner: state.filters.consentPartner ?? undefined,
          sort_by: state.filters.sortBy,
          sort_order: state.filters.sortOrder,
          limit: pageSize,
          offset,
        });

        allRows = [...allRows, ...page.data];
        if (page.data.length < pageSize || allRows.length >= page.total) {
          break;
        }
        offset += pageSize;
      }

      const lines = allRows.map((lead) =>
        [
          lead.student_id,
          lead.full_name,
          lead.grade,
          lead.student_subgroup,
          scoreFmt.format(lead.total_score),
          lead.tier_eur,
          lead.resell_factor,
          lead.monetisable_value_eur,
          lead.consent_partner,
          lead.consent_call,
          lead.top_drivers.join(" | "),
        ]
          .map(escapeCsv)
          .join(","),
      );

      const csvContent = [headers.join(","), ...lines].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `students-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex gap-6">
      <div className="w-[220px] shrink-0">
        <div className="rounded-3xl p-5" style={{ background: "var(--card)", boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold" style={{ color: "var(--foreground)" }}>FILTERS</h3>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="2">
              <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
            </svg>
          </div>

          <div className="mb-4">
            <label className="text-xs font-medium block mb-2" style={{ color: "var(--muted-foreground)" }}>RECHERCHE</label>
            <input
              value={state.filters.q}
              onChange={(e) => updateFilter({ q: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ background: "var(--surface-container)", border: "1px solid var(--outline-variant)", color: "var(--foreground)" }}
              placeholder="Nom ou email"
            />
          </div>

          <div className="mb-5">
            <label className="text-xs font-medium block mb-2" style={{ color: "var(--muted-foreground)" }}>MIN SCORE</label>
            <input
              type="range"
              min="0"
              max="100"
              value={state.filters.minScore}
              onChange={(e) => updateFilter({ minScore: Number(e.target.value) })}
              className="w-full accent-[var(--primary)]"
            />
            <div className="flex justify-between text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
              <span>0</span>
              <span>{state.filters.minScore}</span>
              <span>100</span>
            </div>
          </div>

          <div className="mb-5">
            <label className="text-xs font-medium block mb-2" style={{ color: "var(--muted-foreground)" }}>TIER (€)</label>
            <div className="grid grid-cols-2 gap-2">
              {([0, 3, 15, 23] as TierFilter[]).map((tier) => (
                <button
                  key={tier}
                  onClick={() => updateFilter({ tier: state.filters.tier === tier ? null : tier })}
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: state.filters.tier === tier ? "var(--primary)" : "var(--surface-container)",
                    color: state.filters.tier === tier ? "white" : "var(--foreground)",
                    border: state.filters.tier === tier ? "none" : "1px solid var(--outline-variant)",
                  }}
                >
                  €{tier}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="text-xs font-medium block mb-2" style={{ color: "var(--muted-foreground)" }}>GRADE</label>
            <select
              value={state.filters.grade}
              onChange={(e) => updateFilter({ grade: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ background: "var(--surface-container)", border: "1px solid var(--outline-variant)", color: "var(--foreground)" }}
            >
              {gradeOptions.map((grade) => (
                <option key={grade || "all"} value={grade}>{grade || "Tous"}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="text-xs font-medium block mb-2" style={{ color: "var(--muted-foreground)" }}>SUBGROUP</label>
            <select
              value={state.filters.subgroup}
              onChange={(e) => updateFilter({ subgroup: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ background: "var(--surface-container)", border: "1px solid var(--outline-variant)", color: "var(--foreground)" }}
            >
              {subgroupOptions.map((sub) => (
                <option key={sub || "all"} value={sub}>{sub || "Tous"}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="text-xs font-medium block mb-2" style={{ color: "var(--muted-foreground)" }}>CONSENT PARTNER</label>
            <select
              value={state.filters.consentPartner === null ? "all" : String(state.filters.consentPartner)}
              onChange={(e) =>
                updateFilter({
                  consentPartner: e.target.value === "all" ? null : Number(e.target.value) >= 1 ? 1 : 0,
                })
              }
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ background: "var(--surface-container)", border: "1px solid var(--outline-variant)", color: "var(--foreground)" }}
            >
              <option value="all">Tous</option>
              <option value="1">Opt-in</option>
              <option value="0">No opt-in</option>
            </select>
          </div>

          <button
            onClick={() => {
              setAppState((prev) => ({
                ...prev,
                filters: {
                  ...prev.filters,
                  q: "",
                  minScore: 0,
                  tier: null,
                  grade: "",
                  subgroup: "",
                  consentPartner: null,
                },
                pagination: { ...prev.pagination, offset: 0 },
              }));
            }}
            className="w-full py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90"
            style={{ background: "var(--primary)" }}
          >
            Réinitialiser
          </button>
        </div>
      </div>

      <div className="flex-1">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => updateFilter({ sortBy: "total_score", sortOrder: "desc" })}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: state.filters.sortBy === "total_score" ? "var(--primary)" : "transparent",
                color: state.filters.sortBy === "total_score" ? "white" : "var(--foreground)",
                border: state.filters.sortBy === "total_score" ? "none" : "1px solid var(--outline-variant)",
              }}
            >
              TotalScore
            </button>
            <button
              onClick={() => updateFilter({ sortBy: "monetisable_value_eur", sortOrder: "desc" })}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: state.filters.sortBy === "monetisable_value_eur" ? "var(--primary)" : "transparent",
                color: state.filters.sortBy === "monetisable_value_eur" ? "white" : "var(--foreground)",
                border: state.filters.sortBy === "monetisable_value_eur" ? "none" : "1px solid var(--outline-variant)",
              }}
            >
              € Value
            </button>
          </div>

          <button
            onClick={exportFilteredCsv}
            disabled={total === 0 || exporting}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
            style={{
              background: total > 0 ? "var(--primary)" : "var(--surface-container)",
              color: total > 0 ? "white" : "var(--muted-foreground)",
              border: total > 0 ? "none" : "1px solid var(--outline-variant)",
            }}
          >
            {exporting ? "Export..." : `Exporter CSV (${total})`}
          </button>
        </div>

        {!!error && (
          <div className="mb-4 px-4 py-3 rounded-xl flex items-center justify-between" style={{ background: "color-mix(in oklab, var(--error) 10%, transparent)", color: "var(--error)" }}>
            <div className="text-sm">
              <div>{error}</div>
              {error?.toLowerCase().includes("etimedout") && (
                <div className="text-xs mt-1" style={{ opacity: 0.85 }}>
                  Backend unreachable — start the API (example: <span style={{ fontFamily: 'monospace' }}>uvicorn backend.app.main:app --reload --port 8000</span>)
                </div>
              )}
            </div>
            <button className="text-sm font-semibold" onClick={() => window.location.reload()}>Retry</button>
          </div>
        )}

        <div className="rounded-3xl overflow-hidden" style={{ background: "var(--card)", boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
          <table className="w-full">
            <thead>
              <tr className="text-xs tracking-wider" style={{ color: "var(--muted-foreground)", background: "var(--surface-container)" }}>
                <th className="text-left px-4 py-3 font-medium">#</th>
                <th className="text-left px-4 py-3 font-medium">CANDIDATE / ID</th>
                <th className="text-left px-4 py-3 font-medium">ACADEMIC LEVEL</th>
                <th className="text-left px-4 py-3 font-medium">INTENT</th>
                <th className="text-left px-4 py-3 font-medium">ENGAGEMENT</th>
                <th className="text-left px-4 py-3 font-medium">MONETABILITY</th>
                <th className="text-left px-4 py-3 font-medium">SCORE</th>
                <th className="text-left px-4 py-3 font-medium">TIER</th>
                <th className="text-left px-4 py-3 font-medium">FACTOR</th>
                <th className="text-left px-4 py-3 font-medium">VALUE</th>
                <th className="text-left px-4 py-3 font-medium">WHY DRIVER</th>
                <th className="text-left px-4 py-3 font-medium">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {loading &&
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={`skeleton-${i}`} style={{ borderBottom: "1px solid var(--surface-container)" }}>
                    <td className="px-4 py-3" colSpan={12}>
                      <div className="h-5 w-full rounded animate-pulse" style={{ background: "var(--surface-container)" }} />
                    </td>
                  </tr>
                ))}

              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-4 py-10 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
                    Aucune donnée
                  </td>
                </tr>
              )}

              {!loading &&
                rows.map((lead, i) => {
                  const tierLabel = normalizeTierLabel(lead.tier_eur);
                  const tierColor = getTierColor(tierLabel);
                  return (
                    <tr
                      key={lead.student_id}
                      onClick={() => navigate({ to: "/leads/$leadId", params: { leadId: String(lead.student_id) } })}
                      className="cursor-pointer transition-colors hover:bg-black/[0.02] group"
                      style={{ borderBottom: "1px solid var(--surface-container)" }}
                    >
                      <td className="px-4 py-3">
                        <span className="w-7 h-7 flex items-center justify-center rounded-full text-xs" style={{ background: "var(--surface-container)", color: "var(--muted-foreground)" }}>
                          {state.pagination.offset + i + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium" style={{ color: "var(--foreground)" }}>{lead.full_name}</p>
                          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{lead.student_id}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded text-xs" style={{ background: "var(--surface-container)", color: "var(--foreground)" }}>
                          {lead.grade || "Unknown"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium" style={{ color: "var(--foreground)" }}>{scoreFmt.format(lead.intent_score)}</td>
                      <td className="px-4 py-3 font-medium" style={{ color: "var(--foreground)" }}>{scoreFmt.format(lead.engagement_score)}</td>
                      <td className="px-4 py-3 font-medium" style={{ color: "var(--foreground)" }}>{scoreFmt.format(lead.monetisability_score)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium" style={{ color: "var(--foreground)" }}>{scoreFmt.format(lead.total_score)}</span>
                          <div className="w-16 h-1.5 rounded-full" style={{ background: "var(--surface-container)" }}>
                            <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, lead.total_score))}%`, background: "var(--primary)" }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded text-xs font-medium" style={{ background: tierColor.bg, color: tierColor.text }}>
                          {eurFmt.format(lead.tier_eur)}
                        </span>
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--muted-foreground)" }}>x{Math.max(1, Math.round(lead.resell_factor))}</td>
                      <td className="px-4 py-3 font-medium" style={{ color: "var(--foreground)" }}>{eurFmt.format(lead.monetisable_value_eur)}</td>
                      <td className="px-4 py-3 italic" style={{ color: "var(--muted-foreground)" }}>{lead.top_drivers[0] || "N/A"}</td>
                      <td className="px-4 py-3">
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--primary)" }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                          </svg>
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>

          <div className="flex items-center justify-between px-4 py-3" style={{ background: "var(--surface-container)" }}>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              SHOWING {Math.min(total, state.pagination.offset + 1)}-{Math.min(total, state.pagination.offset + state.pagination.limit)} OF {total.toLocaleString("fr-FR")}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-50"
                style={{ background: "var(--card)", border: "1px solid var(--outline-variant)" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="2">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium"
                    style={{
                      background: currentPage === page ? "var(--primary)" : "var(--card)",
                      color: currentPage === page ? "white" : "var(--foreground)",
                      border: currentPage === page ? "none" : "1px solid var(--outline-variant)",
                    }}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
                className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-50"
                style={{ background: "var(--card)", border: "1px solid var(--outline-variant)" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="2">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/leads")({
  head: () => ({
    meta: [
      { title: "Lead Console — Curator Pro" },
      { name: "description", content: "High-density intelligence view for market optimization." },
    ],
  }),
  component: () => (
    <AdminLayout title="Lead Console" subtitle={"High-density intelligence view for market optimization."}>
      <LeadsPage />
    </AdminLayout>
  ),
});
