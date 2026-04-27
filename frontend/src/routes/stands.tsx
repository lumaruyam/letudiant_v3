import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin-layout";

import { useState, useMemo } from "react"
import { stands, conferences, standsKPIs, hourlyEngagement } from "@/lib/data"

type SectorFilter = "Tech" | "Business" | "Art" | "Santé"
type TabType = "stands" | "conferences" | "emergents"


function KPICard({ label, value, delta, isFirst = false }: { label: string; value: number | string; delta?: number; isFirst?: boolean }) {
  return (
    <div className={`p-5 rounded-2xl ${isFirst ? "col-span-1" : ""}`} style={{ background: "var(--card)", boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}>
      <p className="text-xs tracking-wider mb-2" style={{ color: "var(--muted-foreground)" }}>{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold" style={{ color: "var(--foreground)" }}>{typeof value === "number" ? value.toLocaleString() : value}</span>
        {delta !== undefined && (
          <span className="text-sm font-medium" style={{ color: delta >= 0 ? "var(--success)" : "var(--error)" }}>
            {delta >= 0 ? "+" : ""}{delta}%
          </span>
        )}
      </div>
    </div>
  )
}

function EngagementChart() {
  const maxValue = Math.max(...hourlyEngagement.map(h => Math.max(h.scans_stand, h.scans_conference)))
  
  return (
    <div className="rounded-3xl p-6" style={{ background: "var(--card)", boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>Engagement Horaire</h3>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Flux d&apos;interactions sur les dernières 24 heures</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: "var(--primary)" }}></span>
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>Scans Stand</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: "var(--accent)" }}></span>
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>Scans Conférences</span>
          </div>
        </div>
      </div>

      <div className="relative h-[200px]">
        <svg className="w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="none">
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map((i) => (
            <line key={i} x1="0" y1={i * 50} x2="800" y2={i * 50} stroke="var(--surface-container)" strokeWidth="1" />
          ))}
          
          {/* Stand scans line */}
          <path
            d={hourlyEngagement.map((h, i) => {
              const x = (i / (hourlyEngagement.length - 1)) * 780 + 10
              const y = 190 - (h.scans_stand / maxValue) * 180
              return `${i === 0 ? "M" : "L"} ${x} ${y}`
            }).join(" ")}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2.5"
          />
          
          {/* Conference scans line */}
          <path
            d={hourlyEngagement.map((h, i) => {
              const x = (i / (hourlyEngagement.length - 1)) * 780 + 10
              const y = 190 - (h.scans_conference / maxValue) * 180
              return `${i === 0 ? "M" : "L"} ${x} ${y}`
            }).join(" ")}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2.5"
          />
        </svg>
      </div>

      {/* Time labels */}
      <div className="flex justify-between mt-2 px-2">
        {hourlyEngagement.filter((_, i) => i % 2 === 0).map((h) => (
          <span key={h.hour} className="text-xs" style={{ color: "var(--muted-foreground)" }}>{h.hour}</span>
        ))}
      </div>
    </div>
  )
}

function StandsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("stands")
  const [selectedSectors, setSelectedSectors] = useState<SectorFilter[]>(["Tech"])
  const [selectedHall, setSelectedHall] = useState("Tous les halls")
  const [selectedPeriod, setSelectedPeriod] = useState<"today" | "30days">("today")

  const filteredStands = useMemo(() => {
    let result = [...stands]
    
    if (selectedSectors.length > 0) {
      result = result.filter(s => selectedSectors.includes(s.sector))
    }
    
    if (selectedHall !== "Tous les halls") {
      result = result.filter(s => s.hall === selectedHall.replace("Hall ", ""))
    }
    
    return result.slice(0, 10)
  }, [selectedSectors, selectedHall])

  const filteredConferences = useMemo(() => {
    return conferences.slice(0, 10)
  }, [])

  const toggleSector = (sector: SectorFilter) => {
    setSelectedSectors(prev => 
      prev.includes(sector) ? prev.filter(s => s !== sector) : [...prev, sector]
    )
  }

  const emergentStands = useMemo(() => {
    return stands.filter(s => s.trend_delta > 20).slice(0, 5)
  }, [])

  return (
    <div className="flex gap-6">
      {/* Main content */}
      <div className="flex-1 space-y-6">
        {/* KPI bento row */}
        <div className="grid grid-cols-6 gap-4">
          <KPICard label="STAND SCANS" value={standsKPIs.stand_scans.value} delta={standsKPIs.stand_scans.delta} isFirst />
          <KPICard label="BROCHURE DL" value={standsKPIs.brochure_dl.value} delta={standsKPIs.brochure_dl.delta} />
          <KPICard label="MINI-JEUX" value={standsKPIs.mini_jeux.value} delta={standsKPIs.mini_jeux.delta} />
          <KPICard label="CONF. SCANS" value={standsKPIs.conf_scans.value} delta={standsKPIs.conf_scans.delta} />
          <KPICard label="HIGH-INTENT" value={standsKPIs.high_intent.value} delta={standsKPIs.high_intent.delta} />
          <KPICard label="CAPTURE RATE" value={`${standsKPIs.capture_rate.value}%`} delta={standsKPIs.capture_rate.delta} />
        </div>

        {/* Rankings card */}
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 rounded-3xl p-6" style={{ background: "var(--card)", boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>Classements Performance</h3>
              
              {/* Tabs */}
              <div className="flex rounded-xl p-1" style={{ background: "var(--surface-container)" }}>
                {(["stands", "conferences", "emergents"] as TabType[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize"
                    style={{
                      background: activeTab === tab ? "var(--card)" : "transparent",
                      color: activeTab === tab ? "var(--foreground)" : "var(--muted-foreground)",
                      boxShadow: activeTab === tab ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
                    }}
                  >
                    {tab === "stands" ? "Stands" : tab === "conferences" ? "Conférences" : "Émergents"}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            {activeTab === "stands" && (
              <table className="w-full">
                <thead>
                  <tr className="text-xs tracking-wider" style={{ color: "var(--muted-foreground)" }}>
                    <th className="text-left pb-3 font-medium">#</th>
                    <th className="text-left pb-3 font-medium">NOM DE L&apos;EXPOSANT</th>
                    <th className="text-left pb-3 font-medium">SCANS</th>
                    <th className="text-left pb-3 font-medium">ENGAGEMENT</th>
                    <th className="text-left pb-3 font-medium">CONVERSION</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStands.map((stand, i) => (
                    <tr key={stand.rank} style={{ borderBottom: i < filteredStands.length - 1 ? "1px solid var(--surface-container)" : "none" }}>
                      <td className="py-3 text-sm" style={{ color: "var(--primary)" }}>{String(i + 1).padStart(2, "0")}</td>
                      <td className="py-3">
                        <Link
                          to="/stands/$standId"
                          params={{ standId: String(stand.rank) }}
                          className="flex items-center gap-3 group"
                        >
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-medium text-white" style={{ background: stand.sector === "Tech" ? "#6750a4" : stand.sector === "Business" ? "#7d5260" : stand.sector === "Art" ? "#c9a227" : "#1b6b2e" }}>
                            {stand.name.slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-medium group-hover:underline" style={{ color: "var(--foreground)" }}>{stand.name}</p>
                            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>HALL {stand.hall} • {stand.zone}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="py-3">
                        <div>
                          <span className="font-medium" style={{ color: "var(--foreground)" }}>{stand.stand_scans.toLocaleString()}</span>
                          <span className="text-xs ml-2" style={{ color: stand.trend_delta >= 0 ? "var(--success)" : "var(--error)" }}>
                            {stand.trend_delta >= 0 ? "↗" : "↘"}{Math.abs(stand.trend_delta)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="w-20 h-1.5 rounded-full" style={{ background: "var(--surface-container)" }}>
                          <div className="h-full rounded-full" style={{ width: `${stand.mini_game_engagement}%`, background: "var(--primary)" }}></div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="font-medium" style={{ color: "var(--success)" }}>{stand.conversion_rate}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === "conferences" && (
              <table className="w-full">
                <thead>
                  <tr className="text-xs tracking-wider" style={{ color: "var(--muted-foreground)" }}>
                    <th className="text-left pb-3 font-medium">#</th>
                    <th className="text-left pb-3 font-medium">TITRE</th>
                    <th className="text-left pb-3 font-medium">SCANS</th>
                    <th className="text-left pb-3 font-medium">ENGAGEMENT</th>
                    <th className="text-left pb-3 font-medium">TENDANCE</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredConferences.map((conf, i) => (
                    <tr key={conf.id} style={{ borderBottom: i < filteredConferences.length - 1 ? "1px solid var(--surface-container)" : "none" }}>
                      <td className="py-3 text-sm" style={{ color: "var(--primary)" }}>{String(i + 1).padStart(2, "0")}</td>
                      <td className="py-3">
                        <p className="font-medium" style={{ color: "var(--foreground)" }}>{conf.title}</p>
                        <div className="flex gap-1 mt-1">
                          {conf.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="px-2 py-0.5 rounded text-xs" style={{ background: "var(--surface-container)", color: "var(--muted-foreground)" }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 font-medium" style={{ color: "var(--foreground)" }}>{conf.scans.toLocaleString()}</td>
                      <td className="py-3">
                        <div className="w-20 h-1.5 rounded-full" style={{ background: "var(--surface-container)" }}>
                          <div className="h-full rounded-full" style={{ width: `${conf.engagement_rate}%`, background: "var(--accent)" }}></div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span style={{ color: conf.trend_delta >= 0 ? "var(--success)" : "var(--error)" }}>
                          {conf.trend_delta >= 0 ? "+" : ""}{conf.trend_delta}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === "emergents" && (
              <table className="w-full">
                <thead>
                  <tr className="text-xs tracking-wider" style={{ color: "var(--muted-foreground)" }}>
                    <th className="text-left pb-3 font-medium">#</th>
                    <th className="text-left pb-3 font-medium">NOM DE L&apos;EXPOSANT</th>
                    <th className="text-left pb-3 font-medium">CROISSANCE</th>
                    <th className="text-left pb-3 font-medium">SCANS</th>
                  </tr>
                </thead>
                <tbody>
                  {emergentStands.map((stand, i) => (
                    <tr key={stand.rank} style={{ borderBottom: i < emergentStands.length - 1 ? "1px solid var(--surface-container)" : "none" }}>
                      <td className="py-3 text-sm" style={{ color: "var(--primary)" }}>{String(i + 1).padStart(2, "0")}</td>
                      <td className="py-3">
                        <Link
                          to="/stands/$standId"
                          params={{ standId: String(stand.rank) }}
                          className="flex items-center gap-3 group"
                        >
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-medium text-white" style={{ background: "#1b6b2e" }}>
                            {stand.name.slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-medium group-hover:underline" style={{ color: "var(--foreground)" }}>{stand.name}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-1 rounded text-sm font-medium" style={{ background: "#e8f5e9", color: "var(--success)" }}>
                          +{stand.trend_delta}%
                        </span>
                      </td>
                      <td className="py-3 font-medium" style={{ color: "var(--foreground)" }}>{stand.stand_scans.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Insights & Actions */}
          <div className="rounded-3xl p-6" style={{ background: "var(--card)", boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">💡</span>
              <h3 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>Insights & Actions</h3>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl" style={{ background: "var(--surface-container)" }}>
                <p className="text-xs font-medium mb-2" style={{ color: "var(--error)" }}>OPPORTUNITÉ DE CROISSANCE</p>
                <p className="text-sm mb-3" style={{ color: "var(--foreground)" }}>Le Stand X (Tech) montre un taux de conversion élevé mais un faible trafic.</p>
                <button className="w-full py-2 rounded-lg text-sm font-medium text-white" style={{ background: "var(--primary)" }}>
                  Promouvoir Stand X
                </button>
              </div>

              <div className="p-4 rounded-xl" style={{ background: "var(--surface-container)" }}>
                <p className="text-xs font-medium mb-2" style={{ color: "var(--muted-foreground)" }}>RAPPORT HEBDOMADAIRE</p>
                <p className="text-sm mb-3" style={{ color: "var(--foreground)" }}>Les données de performance des sponsors du hall A sont prêtes.</p>
                <button className="w-full py-2 rounded-lg text-sm font-medium" style={{ border: "1px solid var(--primary)", color: "var(--primary)" }}>
                  Générer Rapport
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Engagement chart */}
        <EngagementChart />
      </div>

      {/* Filter drawer */}
      <div className="w-[240px] shrink-0">
        <div className="rounded-3xl p-6 sticky top-24" style={{ background: "var(--card)", boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
          <div className="flex items-center gap-2 mb-6">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--foreground)" strokeWidth="2">
              <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
            </svg>
            <h3 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>Filtres</h3>
          </div>

          {/* Sector chips */}
          <div className="mb-6">
            <label className="text-xs font-medium block mb-3" style={{ color: "var(--muted-foreground)" }}>SECTEUR D&apos;ACTIVITÉ</label>
            <div className="flex flex-wrap gap-2">
              {(["Tech", "Business", "Art", "Santé"] as SectorFilter[]).map((sector) => (
                <button
                  key={sector}
                  onClick={() => toggleSector(sector)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: selectedSectors.includes(sector) ? "var(--primary)" : "var(--surface-container)",
                    color: selectedSectors.includes(sector) ? "white" : "var(--foreground)"
                  }}
                >
                  {sector}
                </button>
              ))}
            </div>
          </div>

          {/* Location dropdown */}
          <div className="mb-6">
            <label className="text-xs font-medium block mb-3" style={{ color: "var(--muted-foreground)" }}>LOCALISATION</label>
            <select
              value={selectedHall}
              onChange={(e) => setSelectedHall(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm"
              style={{ background: "var(--surface-container)", border: "1px solid var(--outline-variant)", color: "var(--foreground)" }}
            >
              <option>Tous les halls</option>
              <option>Hall A</option>
              <option>Hall B</option>
              <option>Hall C</option>
            </select>
          </div>

          {/* Period toggle */}
          <div className="mb-6">
            <label className="text-xs font-medium block mb-3" style={{ color: "var(--muted-foreground)" }}>PÉRIODE</label>
            <div className="flex rounded-xl p-1" style={{ background: "var(--surface-container)" }}>
              <button
                onClick={() => setSelectedPeriod("today")}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: selectedPeriod === "today" ? "var(--card)" : "transparent",
                  color: selectedPeriod === "today" ? "var(--foreground)" : "var(--muted-foreground)"
                }}
              >
                Aujourd&apos;hui
              </button>
              <button
                onClick={() => setSelectedPeriod("30days")}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: selectedPeriod === "30days" ? "var(--card)" : "transparent",
                  color: selectedPeriod === "30days" ? "var(--foreground)" : "var(--muted-foreground)"
                }}
              >
                30 Jours
              </button>
            </div>
          </div>

          <button
            className="w-full py-3 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90"
            style={{ background: "var(--primary)" }}
          >
            Appliquer les Filtres
          </button>
          <button
            className="w-full py-2 mt-2 text-sm"
            style={{ color: "var(--muted-foreground)" }}
          >
            Réinitialiser
          </button>
        </div>
      </div>
    </div>
  )
}


export const Route = createFileRoute("/stands")({
  head: () => ({
    meta: [
      { title: "Analyse des Stands — Curator Pro" },
      { name: "description", content: "Performance globale des exposants, conférences et zones émergentes." },
    ],
  }),
  component: () => (
    <AdminLayout title="Analyse des Stands" subtitle={'Performance globale des exposants, conférences et zones émergentes.'}>
      <StandsPage />
    </AdminLayout>
  ),
});

/* Below are the code connects to database */
// import { createFileRoute, Link } from "@tanstack/react-router";
// import { useEffect, useMemo, useState } from "react";

// import { AdminLayout } from "@/components/admin-layout";
// import { getConferenceKpis, getStandKpis, type ConferenceKpiItem, type StandKpiItem } from "@/lib/api";
// import { setErrorFlag, setLoadingFlag, useAppState } from "@/lib/state";

// type TabType = "stands" | "conferences" | "emergents";
// type MetricMode = "scans" | "downloads" | "highIntent";

// function KPICard({ label, value }: { label: string; value: string | number }) {
//   return (
//     <div className="p-5 rounded-2xl" style={{ background: "var(--card)", boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}>
//       <p className="text-xs tracking-wider mb-2" style={{ color: "var(--muted-foreground)" }}>{label}</p>
//       <span className="text-3xl font-bold" style={{ color: "var(--foreground)" }}>{value}</span>
//     </div>
//   );
// }

// function StandsPage() {
//   const currentFairId = useAppState((s) => s.currentFairId);
//   const loading = useAppState((s) => s.flags.loading.stands);
//   const error = useAppState((s) => s.flags.errors.stands);

//   const [activeTab, setActiveTab] = useState<TabType>("stands");
//   const [metricMode, setMetricMode] = useState<MetricMode>("scans");

//   const [standRows, setStandRows] = useState<StandKpiItem[]>([]);
//   const [conferenceRows, setConferenceRows] = useState<ConferenceKpiItem[]>([]);

//   useEffect(() => {
//     let active = true;

//     async function load() {
//       setLoadingFlag("stands", true);
//       setErrorFlag("stands", null);

//       const [standsRes, confRes] = await Promise.all([
//         getStandKpis({ fair_id: currentFairId, period: "all" }),
//         getConferenceKpis({ fair_id: currentFairId, period: "all" }),
//       ]);

//       if (!active) return;

//       setStandRows(standsRes.data);
//       setConferenceRows(confRes.data);

//       if (standsRes.error || confRes.error) {
//         setErrorFlag("stands", standsRes.error ?? confRes.error ?? "Erreur analytics");
//       }
//       setLoadingFlag("stands", false);
//     }

//     load();
//     return () => {
//       active = false;
//     };
//   }, [currentFairId]);

//   const aggregated = useMemo(() => {
//     const totalScans = standRows.reduce((acc, row) => acc + row.stand_taps, 0);
//     const totalDownloads = standRows.reduce((acc, row) => acc + row.brochure_requests, 0);
//     const totalHighIntent = standRows.reduce((acc, row) => acc + row.high_intent_unique_students, 0);
//     const confScans = conferenceRows.reduce((acc, row) => acc + row.conference_scans, 0);

//     return { totalScans, totalDownloads, totalHighIntent, confScans };
//   }, [standRows, conferenceRows]);

//   const sortedStands = useMemo(() => {
//     const rows = [...standRows];
//     rows.sort((a, b) => {
//       if (metricMode === "downloads") return b.brochure_requests - a.brochure_requests;
//       if (metricMode === "highIntent") return b.high_intent_unique_students - a.high_intent_unique_students;
//       return b.stand_taps - a.stand_taps;
//     });
//     return rows;
//   }, [standRows, metricMode]);

//   const emergent = useMemo(() => {
//     const rows = [...standRows];
//     rows.sort((a, b) => b.high_intent_unique_students - a.high_intent_unique_students);
//     return rows.slice(0, 10);
//   }, [standRows]);

//   return (
//     <div className="space-y-6">
//       {!!error && (
//         <div className="px-4 py-3 rounded-xl flex items-center justify-between" style={{ background: "color-mix(in oklab, var(--error) 10%, transparent)", color: "var(--error)" }}>
//           <span className="text-sm">{error}</span>
//           <button className="text-sm font-semibold" onClick={() => window.location.reload()}>Retry</button>
//         </div>
//       )}

//       <div className="grid grid-cols-4 gap-4">
//         <KPICard label="STAND SCANS" value={loading ? "..." : aggregated.totalScans.toLocaleString("fr-FR")} />
//         <KPICard label="BROCHURE DL" value={loading ? "..." : aggregated.totalDownloads.toLocaleString("fr-FR")} />
//         <KPICard label="HIGH-INTENT" value={loading ? "..." : aggregated.totalHighIntent.toLocaleString("fr-FR")} />
//         <KPICard label="CONF. SCANS" value={loading ? "..." : aggregated.confScans.toLocaleString("fr-FR")} />
//       </div>

//       <div className="rounded-3xl p-6" style={{ background: "var(--card)", boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
//         <div className="flex items-center justify-between mb-6">
//           <h3 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>Classements Performance</h3>

//           <div className="flex rounded-xl p-1" style={{ background: "var(--surface-container)" }}>
//             {(["stands", "conferences", "emergents"] as TabType[]).map((tab) => (
//               <button
//                 key={tab}
//                 onClick={() => setActiveTab(tab)}
//                 className="px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize"
//                 style={{
//                   background: activeTab === tab ? "var(--card)" : "transparent",
//                   color: activeTab === tab ? "var(--foreground)" : "var(--muted-foreground)",
//                 }}
//               >
//                 {tab === "stands" ? "Stands" : tab === "conferences" ? "Conférences" : "Émergents"}
//               </button>
//             ))}
//           </div>
//         </div>

//         <div className="flex items-center gap-2 mb-4">
//           {(["scans", "downloads", "highIntent"] as MetricMode[]).map((mode) => (
//             <button
//               key={mode}
//               onClick={() => setMetricMode(mode)}
//               className="px-3 py-1.5 rounded-lg text-sm font-medium"
//               style={{
//                 background: metricMode === mode ? "var(--primary)" : "var(--surface-container)",
//                 color: metricMode === mode ? "white" : "var(--foreground)",
//               }}
//             >
//               {mode === "scans" ? "Scans" : mode === "downloads" ? "Downloads" : "High-intent"}
//             </button>
//           ))}
//         </div>

//         {loading && (
//           <div className="space-y-2">
//             {Array.from({ length: 8 }).map((_, i) => (
//               <div key={i} className="h-8 rounded animate-pulse" style={{ background: "var(--surface-container)" }} />
//             ))}
//           </div>
//         )}

//         {!loading && activeTab === "stands" && sortedStands.length === 0 && (
//           <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Aucune donnée</p>
//         )}

//         {!loading && activeTab === "stands" && sortedStands.length > 0 && (
//           <table className="w-full">
//             <thead>
//               <tr className="text-xs tracking-wider" style={{ color: "var(--muted-foreground)" }}>
//                 <th className="text-left pb-3 font-medium">#</th>
//                 <th className="text-left pb-3 font-medium">EXPOSANT</th>
//                 <th className="text-left pb-3 font-medium">SCANS</th>
//                 <th className="text-left pb-3 font-medium">DOWNLOADS</th>
//                 <th className="text-left pb-3 font-medium">HIGH-INTENT</th>
//               </tr>
//             </thead>
//             <tbody>
//               {sortedStands.slice(0, 15).map((stand, index) => (
//                 <tr key={stand.stand_id} style={{ borderBottom: "1px solid var(--surface-container)" }}>
//                   <td className="py-3" style={{ color: "var(--primary)" }}>{String(index + 1).padStart(2, "0")}</td>
//                   <td className="py-3" style={{ color: "var(--foreground)" }}>
//                     <Link to="/stands/$standId" params={{ standId: String(stand.stand_id) }} className="hover:underline">
//                       {stand.exhibitor_name}
//                     </Link>
//                   </td>
//                   <td className="py-3" style={{ color: "var(--foreground)" }}>{stand.stand_taps.toLocaleString("fr-FR")}</td>
//                   <td className="py-3" style={{ color: "var(--foreground)" }}>{stand.brochure_requests.toLocaleString("fr-FR")}</td>
//                   <td className="py-3" style={{ color: "var(--foreground)" }}>{stand.high_intent_unique_students.toLocaleString("fr-FR")}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         )}

//         {!loading && activeTab === "conferences" && conferenceRows.length === 0 && (
//           <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Aucune donnée</p>
//         )}

//         {!loading && activeTab === "conferences" && conferenceRows.length > 0 && (
//           <table className="w-full">
//             <thead>
//               <tr className="text-xs tracking-wider" style={{ color: "var(--muted-foreground)" }}>
//                 <th className="text-left pb-3 font-medium">#</th>
//                 <th className="text-left pb-3 font-medium">CONFÉRENCE</th>
//                 <th className="text-left pb-3 font-medium">TOPIC</th>
//                 <th className="text-left pb-3 font-medium">SCANS</th>
//                 <th className="text-left pb-3 font-medium">ATTENDEES</th>
//               </tr>
//             </thead>
//             <tbody>
//               {conferenceRows.slice(0, 15).map((conference, index) => (
//                 <tr key={conference.conference_id} style={{ borderBottom: "1px solid var(--surface-container)" }}>
//                   <td className="py-3" style={{ color: "var(--primary)" }}>{String(index + 1).padStart(2, "0")}</td>
//                   <td className="py-3" style={{ color: "var(--foreground)" }}>{conference.conference_title}</td>
//                   <td className="py-3" style={{ color: "var(--muted-foreground)" }}>{conference.topic}</td>
//                   <td className="py-3" style={{ color: "var(--foreground)" }}>{conference.conference_scans.toLocaleString("fr-FR")}</td>
//                   <td className="py-3" style={{ color: "var(--foreground)" }}>{conference.unique_attendees.toLocaleString("fr-FR")}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         )}

//         {!loading && activeTab === "emergents" && emergent.length === 0 && (
//           <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Aucune donnée</p>
//         )}

//         {!loading && activeTab === "emergents" && emergent.length > 0 && (
//           <table className="w-full">
//             <thead>
//               <tr className="text-xs tracking-wider" style={{ color: "var(--muted-foreground)" }}>
//                 <th className="text-left pb-3 font-medium">#</th>
//                 <th className="text-left pb-3 font-medium">EXPOSANT</th>
//                 <th className="text-left pb-3 font-medium">HIGH-INTENT</th>
//                 <th className="text-left pb-3 font-medium">CATÉGORIE</th>
//               </tr>
//             </thead>
//             <tbody>
//               {emergent.map((stand, index) => (
//                 <tr key={stand.stand_id} style={{ borderBottom: "1px solid var(--surface-container)" }}>
//                   <td className="py-3" style={{ color: "var(--primary)" }}>{String(index + 1).padStart(2, "0")}</td>
//                   <td className="py-3" style={{ color: "var(--foreground)" }}>{stand.exhibitor_name}</td>
//                   <td className="py-3" style={{ color: "var(--foreground)" }}>{stand.high_intent_unique_students.toLocaleString("fr-FR")}</td>
//                   <td className="py-3" style={{ color: "var(--muted-foreground)" }}>{stand.stand_category}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         )}
//       </div>
//     </div>
//   );
// }

// export const Route = createFileRoute("/stands")({
//   head: () => ({
//     meta: [
//       { title: "Analyse des Stands — Curator Pro" },
//       { name: "description", content: "Performance globale des exposants, conférences et zones émergentes." },
//     ],
//   }),
//   component: () => (
//     <AdminLayout title="Analyse des Stands" subtitle={"Performance globale des exposants, conférences et zones émergentes."}>
//       <StandsPage />
//     </AdminLayout>
//   ),
// });
