import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin-layout";
import { stands, hourlyEngagement } from "@/lib/data";

function MetricCard({
  icon,
  value,
  label,
  delta,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  delta: string;
}) {
  const positive = delta.startsWith("+");
  return (
    <div className="rounded-3xl p-5" style={{ background: "var(--card)", boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center"
          style={{ background: "color-mix(in oklab, var(--primary) 12%, transparent)", color: "var(--primary)" }}
        >
          {icon}
        </div>
        <span
          className="text-xs font-semibold"
          style={{
            color: positive ? "var(--success)" : delta === "Stable" || delta.startsWith("Top") ? "var(--primary)" : "var(--destructive)",
          }}
        >
          {delta}
        </span>
      </div>
      <p className="text-[10px] tracking-wider font-medium mb-1" style={{ color: "var(--muted-foreground)" }}>
        {label}
      </p>
      <p className="text-3xl font-bold" style={{ color: "var(--foreground)" }}>
        {value}
      </p>
    </div>
  );
}

function StandDetail({ standId }: { standId: string }) {
  const navigate = useNavigate();
  const stand = stands.find((s) => s.rank === Number(standId)) ?? stands[0];

  const conversionRate = stand.conversion_rate;
  const downloadsPct = Math.round((stand.brochure_downloads / stand.stand_scans) * 100);
  const postSalon = Math.round(stand.brochure_downloads * 0.37);
  const postSalonPct = Math.round((postSalon / stand.stand_scans) * 100);

  const maxValue = Math.max(...hourlyEngagement.map((h) => Math.max(h.scans_stand, h.scans_conference)));

  const interests = ["Finance Internationale", "Entrepreneuriat", "Global BBA", "Digital Marketing", "RSE & Impact", "Management du Luxe", "Data Sciences"];

  return (
    <div className="space-y-6">
      {/* Header strip */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate({ to: "/stands" })}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-black/5"
            style={{ color: "var(--primary)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Retour
          </button>
          <div className="h-6 w-px" style={{ background: "var(--outline-variant)" }} />
          <div className="flex items-center gap-2">
            <span
              className="px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider"
              style={{ background: "color-mix(in oklab, var(--primary) 15%, transparent)", color: "var(--primary)" }}
            >
              {stand.sector.toUpperCase()}
            </span>
            <span
              className="px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider"
              style={{ background: "color-mix(in oklab, var(--accent) 25%, transparent)", color: "var(--accent-foreground)" }}
            >
              HALL {stand.hall}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-medium transition-colors hover:bg-black/5"
            style={{ border: "1px solid var(--outline-variant)", color: "var(--foreground)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
            Export Sponsor
          </button>
          <button
            className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: "var(--gradient-primary)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export Leads (GDPR)
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="text-[44px] font-extrabold tracking-tight leading-none"
            style={{ color: "var(--foreground)", letterSpacing: "-0.03em" }}
          >
            {stand.name}
          </h1>
          <p className="text-sm mt-3" style={{ color: "var(--muted-foreground)" }}>
            Analyse détaillée des performances du salon Studyrama Lyon 2024
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: "var(--card)", boxShadow: "var(--shadow-soft)" }}>
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--success)" }} />
          <span className="text-xs font-medium" style={{ color: "var(--foreground)" }}>
            Stand Actif • En direct
          </span>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
          }
          value={stand.stand_scans.toLocaleString()}
          label="SCANS TOTAUX"
          delta={`${stand.trend_delta >= 0 ? "+" : ""}${stand.trend_delta}%`}
        />
        <MetricCard
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          }
          value={stand.brochure_downloads.toLocaleString()}
          label="TÉLÉCHARGEMENTS"
          delta="+5%"
        />
        <MetricCard
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
          value={stand.dwell_time.split(":")[0] + "min"}
          label="TEMPS DE VISITE"
          delta="Stable"
        />
        <MetricCard
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="6" y1="11" x2="10" y2="11" />
              <line x1="8" y1="9" x2="8" y2="13" />
              <line x1="15" y1="12" x2="15.01" y2="12" />
              <line x1="18" y1="10" x2="18.01" y2="10" />
              <path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258A4 4 0 0 0 17.32 5z" />
            </svg>
          }
          value={`${conversionRate}%`}
          label="CONVERSION JEU"
          delta="Top 3"
        />
      </div>

      {/* Chart + Funnel */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 rounded-3xl p-6" style={{ background: "var(--card)", boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
                Fréquentation horaire
              </h3>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                Flux de scans vs. téléchargements de brochures
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: "var(--primary)" }} />
                <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>Scans</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: "var(--accent)" }} />
                <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>Docs</span>
              </div>
            </div>
          </div>

          <div className="relative h-[260px]">
            <svg className="w-full h-full" viewBox="0 0 800 260" preserveAspectRatio="none">
              {[0, 1, 2, 3, 4].map((i) => (
                <line key={i} x1="0" y1={i * 65} x2="800" y2={i * 65} stroke="var(--surface-container)" strokeWidth="1" />
              ))}

              {/* Stand scans area */}
              <path
                d={
                  hourlyEngagement
                    .map((h, i) => {
                      const x = (i / (hourlyEngagement.length - 1)) * 780 + 10;
                      const y = 240 - (h.scans_stand / maxValue) * 220;
                      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                    })
                    .join(" ") + " L 790 240 L 10 240 Z"
                }
                fill="color-mix(in oklab, var(--primary) 12%, transparent)"
              />
              <path
                d={hourlyEngagement
                  .map((h, i) => {
                    const x = (i / (hourlyEngagement.length - 1)) * 780 + 10;
                    const y = 240 - (h.scans_stand / maxValue) * 220;
                    return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                  })
                  .join(" ")}
                fill="none"
                stroke="var(--primary)"
                strokeWidth="3"
                strokeLinecap="round"
              />
              {/* Conference (docs) line */}
              <path
                d={hourlyEngagement
                  .map((h, i) => {
                    const x = (i / (hourlyEngagement.length - 1)) * 780 + 10;
                    const y = 240 - (h.scans_conference / maxValue) * 220;
                    return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                  })
                  .join(" ")}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="2.5"
                strokeDasharray="5 4"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="flex justify-between mt-2 px-2 text-[11px]" style={{ color: "var(--muted-foreground)" }}>
            {hourlyEngagement
              .filter((_, i) => i % 2 === 0)
              .slice(0, 8)
              .map((h) => (
                <span key={h.hour}>{h.hour}</span>
              ))}
          </div>
        </div>

        {/* Funnel */}
        <div
          className="rounded-3xl p-6"
          style={{ background: "var(--gradient-primary)", color: "white" }}
        >
          <h3 className="text-lg font-semibold">Entonnoir de conversion</h3>
          <p className="text-sm opacity-80 mb-6">Efficacité du parcours visiteur</p>

          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between text-xs mb-2 tracking-wider">
                <span className="opacity-90">SCANS (ENTRÉE)</span>
                <span className="font-bold">{stand.stand_scans.toLocaleString()}</span>
              </div>
              <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }}>
                <div className="h-full rounded-full" style={{ width: "100%", background: "white" }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-2 tracking-wider">
                <span className="opacity-90">TÉLÉCHARGEMENTS</span>
                <span className="font-bold">
                  {stand.brochure_downloads.toLocaleString()} ({downloadsPct}%)
                </span>
              </div>
              <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }}>
                <div className="h-full rounded-full" style={{ width: `${downloadsPct}%`, background: "var(--accent)" }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-2 tracking-wider">
                <span className="opacity-90">CLICS POST-SALON</span>
                <span className="font-bold">
                  {postSalon.toLocaleString()} ({postSalonPct}%)
                </span>
              </div>
              <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }}>
                <div className="h-full rounded-full" style={{ width: `${postSalonPct}%`, background: "color-mix(in oklab, var(--accent) 70%, black)" }} />
              </div>
            </div>
          </div>

          <p className="text-[10px] mt-6 opacity-70 italic">
            * Données estimées sur les 24 dernières heures
          </p>
        </div>
      </div>

      {/* Audience profile + live photo */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 rounded-3xl p-6" style={{ background: "var(--card)", boxShadow: "var(--shadow-card)" }}>
          <h3 className="text-lg font-semibold mb-6" style={{ color: "var(--foreground)" }}>
            Profil de l&apos;Audience
          </h3>

          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-[10px] tracking-wider mb-4 font-medium" style={{ color: "var(--muted-foreground)" }}>
                NIVEAUX D&apos;ÉTUDES
              </p>
              <div className="space-y-4">
                {[
                  { pct: 45, title: "Terminale / Bac", sub: "Post-Bac immédiat" },
                  { pct: 32, title: "Bac +2 / +3", sub: "Admissions parallèles" },
                  { pct: 23, title: "Autres / Parents", sub: "Information & conseil" },
                ].map((row) => (
                  <div key={row.title} className="flex items-center gap-4">
                    <span
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold"
                      style={{
                        background: "color-mix(in oklab, var(--primary) 12%, transparent)",
                        color: "var(--primary)",
                      }}
                    >
                      {row.pct}%
                    </span>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
                        {row.title}
                      </p>
                      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                        {row.sub}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] tracking-wider mb-4 font-medium" style={{ color: "var(--muted-foreground)" }}>
                CENTRES D&apos;INTÉRÊT
              </p>
              <div className="flex flex-wrap gap-2">
                {interests.map((tag, i) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 rounded-full text-xs font-medium"
                    style={{
                      background: i === 2 ? "color-mix(in oklab, var(--primary) 15%, transparent)" : "var(--surface-container)",
                      color: i === 2 ? "var(--primary)" : "var(--foreground)",
                      border: i === 2 ? "1px solid color-mix(in oklab, var(--primary) 25%, transparent)" : "1px solid transparent",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div
          className="rounded-3xl overflow-hidden relative min-h-[280px] flex flex-col justify-end p-6"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.32 0.06 285), oklch(0.18 0.04 290))",
            boxShadow: "var(--shadow-card)",
          }}
        >
          {/* simulated reflective glass building backdrop */}
          <svg
            className="absolute inset-0 w-full h-full opacity-50"
            viewBox="0 0 300 300"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="oklch(0.55 0.12 50)" />
                <stop offset="100%" stopColor="oklch(0.25 0.05 290)" />
              </linearGradient>
            </defs>
            <rect width="300" height="300" fill="url(#glass)" />
            {Array.from({ length: 8 }).map((_, i) => (
              <line key={i} x1={i * 38} y1="0" x2={i * 38} y2="300" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            ))}
            {Array.from({ length: 10 }).map((_, i) => (
              <line key={i} x1="0" y1={i * 30} x2="300" y2={i * 30} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            ))}
          </svg>
          <div className="relative text-white z-10">
            <p className="text-[10px] tracking-[0.18em] opacity-70 mb-2">LIVE PHOTO DU STAND</p>
            <p className="text-base font-semibold leading-snug mb-4">
              Interaction maximale constatée à 11h45 lors de la démo du Global BBA.
            </p>
            <div className="flex items-center gap-2 text-xs opacity-80">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              Auto-capturé par Smart-Booth
            </div>
          </div>
        </div>
      </div>

      {/* GDPR footer */}
      <div className="flex items-center justify-between pt-4 text-xs" style={{ color: "var(--muted-foreground)" }}>
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>
            <em>Note GDPR</em> : Les exports de leads contiennent uniquement les données des utilisateurs ayant
            consenti explicitement au partage.
          </span>
        </div>
        <p>© 2024 Groupe L&apos;Étudiant — Console de Performance Exposant</p>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/stands/$standId")({
  head: () => ({
    meta: [
      { title: "Détails du Stand — Curator Pro" },
      { name: "description", content: "Performance détaillée du stand exposant : trafic, conversion et profil audience." },
    ],
  }),
  component: StandDetailRoute,
});

function StandDetailRoute() {
  const { standId } = Route.useParams();
  const stand = stands.find((s) => s.rank === Number(standId));
  return (
    <AdminLayout
      title={stand?.name ?? "Détails du Stand"}
      subtitle="Vue Exposant • Lead Management"
    >
      <StandDetail standId={standId} />
    </AdminLayout>
  );
}
