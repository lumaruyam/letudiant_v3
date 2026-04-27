import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { AdminLayout } from "@/components/admin-layout";
import { getLeadById, getLeadScore, type LeadDetailResponse, type LeadScoreResponse } from "@/lib/api";
import { setErrorFlag, setLoadingFlag, useAppState } from "@/lib/state";

function toNum(input: unknown, fallback = 0): number {
  if (typeof input === "number" && Number.isFinite(input)) return input;
  if (typeof input === "string" && input.trim().length > 0) {
    const n = Number(input);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

function toText(input: unknown, fallback = "N/A"): string {
  return typeof input === "string" && input.trim().length > 0 ? input : fallback;
}

function ScoreRing({ value, label, highlight = false }: { value: number; label: string; highlight?: boolean }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, value)) / 100) * circumference;
  const ringColor = highlight ? "var(--primary)" : "var(--accent)";

  return (
    <div
      className="flex flex-col items-center justify-center p-4 rounded-2xl"
      style={{
        background: highlight ? "color-mix(in oklab, var(--primary) 8%, var(--card))" : "transparent",
        border: highlight ? "1px solid color-mix(in oklab, var(--primary) 25%, transparent)" : "none",
      }}
    >
      <div className="relative w-[92px] h-[92px]">
        <svg width="92" height="92" viewBox="0 0 92 92" className="-rotate-90">
          <circle cx="46" cy="46" r={radius} stroke="var(--surface-container)" strokeWidth="6" fill="none" />
          <circle
            cx="46"
            cy="46"
            r={radius}
            stroke={ringColor}
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>{value.toFixed(1)}</span>
        </div>
      </div>
      <p className="mt-3 text-[11px] tracking-wider font-medium" style={{ color: highlight ? "var(--primary)" : "var(--muted-foreground)" }}>
        {label}
      </p>
    </div>
  );
}

function LeadDetail({ leadId }: { leadId: string }) {
  const navigate = useNavigate();
  const loading = useAppState((s) => s.flags.loading.leadDetail);
  const error = useAppState((s) => s.flags.errors.leadDetail);

  const [detail, setDetail] = useState<LeadDetailResponse | null>(null);
  const [score, setScore] = useState<LeadScoreResponse | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoadingFlag("leadDetail", true);
      setErrorFlag("leadDetail", null);

      const [detailRes, scoreRes] = await Promise.all([getLeadById(leadId), getLeadScore(leadId)]);
      if (!active) return;

      setDetail(detailRes);
      setScore(scoreRes);

      if (detailRes.error || scoreRes.error) {
        setErrorFlag("leadDetail", detailRes.error ?? scoreRes.error ?? "Erreur inconnue");
      }
      setLoadingFlag("leadDetail", false);
    }

    load();
    return () => {
      active = false;
    };
  }, [leadId]);

  const profile = useMemo(() => (detail?.profile ?? {}) as Record<string, unknown>, [detail]);
  const consents = useMemo(() => (detail?.consents ?? {}) as Record<string, unknown>, [detail]);
  const detailScore = useMemo(() => (detail?.score ?? {}) as Record<string, unknown>, [detail]);
  const monetization = useMemo(() => (detail?.monetization ?? {}) as Record<string, unknown>, [detail]);

  const intent = toNum(score?.intent_score ?? detailScore.intent_score);
  const engagement = toNum(score?.engagement_score ?? detailScore.engagement_score);
  const monetisability = toNum(score?.monetisability_score ?? detailScore.monetisability_score);
  const total = toNum(score?.total_score ?? detailScore.total_score);

  const tier = toNum(score?.tier_eur ?? monetization.tier_eur);
  const factor = toNum(score?.resell_factor ?? monetization.resell_factor, 1);
  const value = toNum(score?.monetisable_value_eur ?? monetization.monetisable_value_eur);

  const fullName = toText(profile.full_name, `Lead #${leadId}`);
  const grade = toText(profile.grade, "Unknown");
  const subgroup = toText(profile.student_subgroup, "Unknown");
  const timeline = Array.isArray(detail?.timeline) ? detail.timeline : [];

  const topDrivers = [
    toNum((detail?.derived as Record<string, unknown> | undefined)?.exhibitor_scans_count) > 0
      ? "Exhibitor scans détectés"
      : "Exhibitor scans faibles",
    toNum((detail?.derived as Record<string, unknown> | undefined)?.fields_interest_count) >= 2
      ? "Plusieurs intérêts déclarés"
      : "Profil peu enrichi",
    toNum(consents.partners) === 1 ? "Consentement partenaire actif" : "Consentement partenaire absent",
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate({ to: "/leads" })}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-black/5"
          style={{ color: "var(--primary)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Retour aux Leads
        </button>
        <div className="h-6 w-px" style={{ background: "var(--outline-variant)" }} />
        <span className="px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ background: "var(--gradient-primary)" }}>
          Tier {tier.toFixed(0)}€
        </span>
        <span className="text-xs tracking-wider" style={{ color: "var(--muted-foreground)" }}>
          ID: #{leadId}
        </span>
      </div>

      {!!error && (
        <div className="px-4 py-3 rounded-xl flex items-center justify-between" style={{ background: "color-mix(in oklab, var(--error) 10%, transparent)", color: "var(--error)" }}>
          <span className="text-sm">{error}</span>
          <button className="text-sm font-semibold" onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}

      <div className="flex items-end justify-between gap-6 flex-wrap">
        <div>
          <h1 className="text-[44px] font-extrabold tracking-tight leading-none" style={{ color: "var(--foreground)", letterSpacing: "-0.03em" }}>
            {loading ? "Chargement..." : fullName}
          </h1>
          <div className="flex items-center gap-10 mt-5">
            <div>
              <p className="text-[10px] tracking-wider mb-1" style={{ color: "var(--muted-foreground)" }}>FACTEUR DE REVENTE</p>
              <p className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>{factor.toFixed(1)}x</p>
            </div>
            <div>
              <p className="text-[10px] tracking-wider mb-1" style={{ color: "var(--muted-foreground)" }}>VALEUR MONÉTISABLE</p>
              <p className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
                {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(value)}
              </p>
            </div>
            <div>
              <p className="text-[10px] tracking-wider mb-1" style={{ color: "var(--muted-foreground)" }}>SEGMENT</p>
              <p className="text-base font-semibold" style={{ color: "var(--foreground)" }}>{grade} • {subgroup}</p>
            </div>
          </div>
        </div>
      </div>

      {subgroup === "school_group" && toText(profile.registration_channel, "") === "unregistered" && (
        <div
          className="flex items-start gap-3 p-4 rounded-2xl"
          style={{
            background: "color-mix(in oklab, var(--destructive) 8%, var(--card))",
            border: "1px solid color-mix(in oklab, var(--destructive) 25%, transparent)",
            borderLeft: "4px solid var(--destructive)",
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--destructive)" strokeWidth="2">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div>
            <p className="font-semibold text-sm" style={{ color: "var(--destructive)" }}>Profil partiellement enregistré</p>
            <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
              Certaines données sont absentes pour ce lead de groupe scolaire non enregistré.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 rounded-3xl p-6" style={{ background: "var(--card)", boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-lg font-semibold mb-5" style={{ color: "var(--foreground)" }}>Répartition du Score</h3>
          <div className="grid grid-cols-4 gap-4">
            <ScoreRing value={intent} label="INTENTION" />
            <ScoreRing value={engagement} label="ENGAGEMENT" />
            <ScoreRing value={monetisability} label="MONÉTISABLE" />
            <ScoreRing value={total} label="TOTAL" highlight />
          </div>
        </div>

        <div className="rounded-3xl p-6" style={{ background: "var(--card)", boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-lg font-semibold mb-5" style={{ color: "var(--foreground)" }}>Top drivers</h3>
          <div className="space-y-3">
            {topDrivers.map((driver, index) => (
              <div key={index} className="p-3 rounded-xl" style={{ background: "var(--surface-container)" }}>
                <p className="text-sm" style={{ color: "var(--foreground)" }}>{driver}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 text-xs" style={{ color: "var(--muted-foreground)" }}>
            Consent partenaire: {toNum(consents.partners) === 1 ? "Oui" : "Non"} • Consent call: {toNum(consents.call) === 1 ? "Oui" : "Non"}
          </div>
        </div>
      </div>

      <div className="rounded-3xl p-6" style={{ background: "var(--card)", boxShadow: "var(--shadow-card)" }}>
        <h3 className="text-lg font-semibold mb-6" style={{ color: "var(--foreground)" }}>Timeline événements</h3>

        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 rounded animate-pulse" style={{ background: "var(--surface-container)" }} />
            ))}
          </div>
        )}

        {!loading && timeline.length === 0 && (
          <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>Aucune donnée</div>
        )}

        {!loading && timeline.length > 0 && (
          <div className="space-y-5">
            {timeline.map((event, i) => {
              const eventType = toText(event.event_type, "event");
              const eventTime = toText(event.event_time, "-");
              const source = toText(event.source_channel, "-");
              return (
                <div key={`${eventType}-${eventTime}-${i}`} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full" style={{ background: i === 0 ? "var(--primary)" : "var(--muted-foreground)" }} />
                    {i < timeline.length - 1 && <div className="w-px flex-1 mt-1" style={{ background: "var(--outline-variant)" }} />}
                  </div>
                  <div className="flex-1 pb-3 flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{eventType}</p>
                      <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>Source: {source}</p>
                    </div>
                    <span className="text-[10px] tracking-wider shrink-0" style={{ color: "var(--muted-foreground)" }}>{eventTime}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/leads/$leadId")({
  head: () => ({
    meta: [
      { title: "Détails du Lead — Curator Pro" },
      { name: "description", content: "Vue détaillée d'un lead avec scoring, parcours et actions recommandées." },
    ],
  }),
  component: LeadDetailRoute,
});

function LeadDetailRoute() {
  const { leadId } = Route.useParams();
  return (
    <AdminLayout title="Détails du Lead" subtitle={`Profil complet du candidat #${leadId}.`}>
      <LeadDetail leadId={leadId} />
    </AdminLayout>
  );
}
