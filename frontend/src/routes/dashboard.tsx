import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { AdminLayout } from "@/components/admin-layout";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  getKpis,
  getLeads,
  type FairKpisResponse,
  type LeadListItem,
} from "@/lib/api";
import { conferences, stands } from "@/lib/data";
import { setErrorFlag, setLoadingFlag, useAppState } from "@/lib/state";
import { ChevronDown } from "lucide-react";

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl p-6 ${className}`} style={{ background: "var(--card)", boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}>
      {children}
    </div>
  );
}

const eurFmt = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const scoreFmt = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });
type SectorFilter = "Tech" | "Business" | "Art" | "Santé"
type TabType = "stands" | "conferences" | "emergents"

function LeadSearchPicker({
  leads,
  value,
  onValueChange,
  label,
}: {
  leads: LeadListItem[];
  value: number | null;
  onValueChange: (id: number) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const selectedLead = leads.find((lead) => lead.student_id === value) ?? null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-full rounded-lg px-3 py-2 text-left text-sm transition-all hover:opacity-95"
          style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "none" }}
        >
          <span className="mb-1 block text-xs uppercase tracking-[0.14em] opacity-70">{label}</span>
          <span className="flex items-center justify-between gap-3">
            <span className={selectedLead ? "truncate" : "opacity-70"}>
              {selectedLead ? `${selectedLead.full_name} (Tier ${selectedLead.tier_eur}EUR)` : "Rechercher un étudiant..."}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-70" />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Tapez un nom d'étudiant..." />
          <CommandList>
            <CommandEmpty>Aucun lead trouvé.</CommandEmpty>
            <CommandGroup>
              {leads.map((lead) => (
                <CommandItem
                  key={lead.student_id}
                  value={lead.full_name}
                  onSelect={() => {
                    onValueChange(lead.student_id);
                    setOpen(false);
                  }}
                >
                  <div className="flex w-full items-center justify-between gap-3">
                    <span className="truncate">{lead.full_name}</span>
                    <span className="text-xs text-muted-foreground">Tier {lead.tier_eur}EUR</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function ScenarioTester({ leads, loading }: { leads: LeadListItem[]; loading: boolean }) {
  const navigate = useNavigate();
  const [leadAId, setLeadAId] = useState<number | null>(null);
  const [leadBId, setLeadBId] = useState<number | null>(null);

  useEffect(() => {
    if (leads.length === 0) return;
    if (leadAId === null) setLeadAId(leads[0].student_id);
    if (leadBId === null) setLeadBId(leads[Math.min(1, leads.length - 1)].student_id);
  }, [leads, leadAId, leadBId]);

  const leadA = leads.find((lead) => lead.student_id === leadAId) ?? leads[0];
  const leadB = leads.find((lead) => lead.student_id === leadBId) ?? leads[Math.min(1, leads.length - 1)];

  return (
    <div className="rounded-3xl p-6" style={{ background: "var(--primary)", color: "white" }}>
      <h3 className="text-lg font-semibold mb-2">Testeur de Scenario</h3>
      <p className="text-sm opacity-80 mb-4">Comparez le potentiel des leads cote a cote via la logique AI Curator.</p>

      {loading && <div className="h-28 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.15)" }} />}
      {!loading && leads.length === 0 && <p className="text-sm opacity-80">Aucune donnee lead disponible.</p>}

      {!loading && leads.length > 0 && leadA && leadB && (
        <div className="space-y-3">
          <div>
            <LeadSearchPicker
              leads={leads}
              value={leadA.student_id}
              onValueChange={setLeadAId}
              label="COMPARER LEAD A"
            />
          </div>

          <div>
            <LeadSearchPicker
              leads={leads}
              value={leadB.student_id}
              onValueChange={setLeadBId}
              label="CONTRE LEAD B"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <div className="flex-1 text-center p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.1)" }}>
              <p className="text-xs opacity-70 mb-1">SCORE LEAD A</p>
              <p className="text-2xl font-bold">{scoreFmt.format(leadA.total_score)}</p>
            </div>
            <div className="flex-1 text-center p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.1)" }}>
              <p className="text-xs opacity-70 mb-1">SCORE LEAD B</p>
              <p className="text-2xl font-bold">{scoreFmt.format(leadB.total_score)}</p>
            </div>
          </div>

          <button
            className="w-full py-3 rounded-xl text-sm font-medium transition-all hover:opacity-90"
            style={{ background: "white", color: "var(--primary)" }}
            onClick={() => navigate({ to: "/leads/comparison" })}
          >
            Comparer les Profils
          </button>
        </div>
      )}
    </div>
  );
}

function DashboardPage() {
  const currentFairId = useAppState((s) => s.currentFairId);
  const loading = useAppState((s) => s.flags.loading.dashboard);
  const error = useAppState((s) => s.flags.errors.dashboard);
  const [fairKpis, setFairKpis] = useState<FairKpisResponse | null>(null);
  const [leadRows, setLeadRows] = useState<LeadListItem[]>([]);
  const [selectedSectors, setSelectedSectors] = useState<SectorFilter[]>(["Tech"]);
  const [selectedHall, setSelectedHall] = useState("Tous les halls");
  const [selectedPeriod, setSelectedPeriod] = useState<"today" | "30days">("today");
  const [activeTab, setActiveTab] = useState<TabType>("stands");

  useEffect(() => {
    let active = true;
    async function loadKpis() {
      setLoadingFlag("dashboard", true);
      setErrorFlag("dashboard", null);
      const [fairRes, leadsRes] = await Promise.all([
        getKpis(currentFairId),
        getLeads({ fair_id: currentFairId, limit: 20, offset: 0 }),
      ]);
      if (!active) return;
      setFairKpis(fairRes);
      setLeadRows(leadsRes.data);
      if (fairRes.error || leadsRes.error) {
        setErrorFlag("dashboard", fairRes.error ?? leadsRes.error ?? "Erreur KPI");
      }
      setLoadingFlag("dashboard", false);
    }
    loadKpis();
    return () => {
      active = false;
    };
  }, [currentFairId]);

  const topStands = useMemo(() => {
    let result = [...stands];
    if (selectedSectors.length > 0) {
      result = result.filter((stand) => selectedSectors.includes(stand.sector));
    }
    if (selectedHall !== "Tous les halls") {
      result = result.filter((stand) => stand.hall === selectedHall.replace("Hall ", ""));
    }
    return result.slice(0, 10);
  }, [selectedSectors, selectedHall, selectedPeriod]);

  const topConferences = useMemo(() => conferences.slice(0, 10), [selectedPeriod]);

  const tierBars = useMemo(() => {
    const rows = fairKpis?.tier_distribution ?? [];
    const total = rows.reduce((acc, row) => acc + row.leads_count, 0);
    return rows.map((row) => ({
      ...row,
      pct: total > 0 ? (row.leads_count / total) * 100 : 0,
    }));
  }, [fairKpis]);

  const averageStudentScore = useMemo(() => {
    if (!leadRows.length) return 0;
    const sum = leadRows.reduce((acc, lead) => acc + (lead.total_score || 0), 0);
    return sum / leadRows.length;
  }, [leadRows]);

  const timelineStages = useMemo(() => {
    const stages = ["Register", "Before Event", "During Event", "After Event"];
    const totalValue = fairKpis?.total_monetisable_value_eur ?? 0;
    const finalScore = averageStudentScore;

    return stages.map((stage, index) => {
      const progress = (index + 1) / stages.length; // 0.25, 0.5, 0.75, 1.0
      // Start at 30% of final score, increase linearly to 100% at last stage
      const score = Math.round(finalScore * (0.3 + 0.7 * progress));
      const value = Math.round(totalValue * progress);
      return { stage, score, value };
    });
  }, [fairKpis, averageStudentScore]);

  const growthPct = useMemo(() => {
    if (!fairKpis) return 0;
    return Number((((fairKpis.optin_partner_pct + fairKpis.optin_call_pct) / 2) * 0.25).toFixed(1));
  }, [fairKpis]);

  const toggleSector = (sector: SectorFilter) => {
    setSelectedSectors((prev) => (prev.includes(sector) ? prev.filter((s) => s !== sector) : [...prev, sector]));
  };

  return (
    <div className="space-y-6">
      {!!error && (
        <div className="px-4 py-3 rounded-xl flex items-center justify-between" style={{ background: "color-mix(in oklab, var(--error) 10%, transparent)", color: "var(--error)" }}>
          <span className="text-sm">{error}</span>
          <button className="text-sm font-semibold" onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}

      {/* First row: align bottoms by making both cards full height */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 flex">
          <Card className="flex flex-col justify-between w-full">
            <div>
              <p className="text-xs tracking-wider mb-2" style={{ color: "var(--muted-foreground)" }}>REVENUS ESTIMEE</p>
              <h2 className="text-5xl font-bold mb-3" style={{ color: "var(--foreground)" }}>
                {loading ? "..." : eurFmt.format(fairKpis?.total_monetisable_value_eur ?? 0)}
              </h2>
              <p className="text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>
                Valeur totale monetisable des leads basee sur la distribution actuelle des tiers.
              </p>
            </div>
            <div className="flex gap-8">
              <div>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>CROISSANCE</p>
                <p className="text-lg font-semibold" style={{ color: "var(--success)" }}>+{scoreFmt.format(growthPct)}% estime</p>
              </div>
            </div>
          </Card>
        </div>
        <div className="flex">
          <Card className="flex flex-col items-center justify-center text-center w-full">
            <p className="text-xs tracking-wider mb-2" style={{ color: "var(--muted-foreground)" }}>TOTAL DES LEADS COLLECTES</p>
            <h2 className="text-4xl font-bold mb-2" style={{ color: "var(--foreground)" }}>
              {loading ? "..." : (fairKpis?.total_leads ?? 0).toLocaleString("fr-FR")}
            </h2>
            <span className="px-3 py-1 rounded-full text-xs" style={{ background: "var(--secondary)", color: "var(--secondary-foreground)" }}>
              Salon courant
            </span>
          </Card>
        </div>
      </div>

      <Card>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold mb-1" style={{ color: "var(--foreground)" }}>Chronologie de la Valorisation des Donnees</h3>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Impact des etapes du cycle de vie sur le score et la valeur marchande.</p>
          </div>
          <div className="flex items-center gap-4 pt-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ background: "var(--primary)" }} />
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>Score</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ background: "var(--accent)" }} />
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>Valeur (EUR)</span>
            </div>
          </div>
        </div>
        <div className="relative h-[200px] mt-8">
          <svg className="w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="none">
            <path d="M 50 180 Q 200 145 300 100 Q 420 65 540 45 Q 640 30 750 20" fill="none" stroke="var(--primary)" strokeWidth="3" />
            <path d="M 50 190 Q 220 182 330 150 Q 430 120 550 85 Q 650 55 750 30" fill="none" stroke="var(--accent)" strokeWidth="3" />
            <circle cx="50" cy="180" r="6" fill="var(--primary)" />
            <circle cx="300" cy="100" r="6" fill="var(--primary)" />
            <circle cx="540" cy="45" r="6" fill="var(--primary)" />
            <circle cx="750" cy="20" r="6" fill="var(--primary)" />
            <circle cx="50" cy="190" r="6" fill="var(--accent)" />
            <circle cx="330" cy="150" r="6" fill="var(--accent)" />
            <circle cx="550" cy="85" r="6" fill="var(--accent)" />
            <circle cx="750" cy="30" r="6" fill="var(--accent)" />
          </svg>
        </div>
        <div className="flex justify-between mt-4 px-4">
          {timelineStages.map((stage) => (
            <div key={stage.stage} className="text-center">
              <p className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>{stage.stage}</p>
              <p className="text-xs mt-1" style={{ color: "var(--primary)" }}>{stage.score} Score | {stage.value.toLocaleString("fr-FR")}EUR</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <p className="text-xs tracking-wider mb-1" style={{ color: "var(--muted-foreground)" }}>OPT-IN PARTNER</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold" style={{ color: "var(--foreground)" }}>
              {loading ? "..." : `${scoreFmt.format(fairKpis?.optin_partner_pct ?? 0)}%`}
            </span>
          </div>
          <div className="mt-3 h-1.5 rounded-full" style={{ background: "var(--surface-container)" }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${fairKpis?.optin_partner_pct ?? 0}%`, background: "var(--primary)" }}
            />
          </div>
        </Card>
        <Card>
          <p className="text-xs tracking-wider mb-1" style={{ color: "var(--muted-foreground)" }}>OPT-IN CALL</p>
          <span className="text-3xl font-bold" style={{ color: "var(--foreground)" }}>
            {loading ? "..." : `${scoreFmt.format(fairKpis?.optin_call_pct ?? 0)}%`}
          </span>
          <div className="mt-3 h-1.5 rounded-full" style={{ background: "var(--surface-container)" }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${fairKpis?.optin_call_pct ?? 0}%`, background: "var(--primary)" }}
            />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6 items-stretch">
        <div className="col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>Plan de Mesure</h3>
                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Seuils de suivi automatises et actions correctives.</p>
              </div>
            </div>
            <table className="w-full mb-8">
              <thead>
                <tr className="text-xs tracking-wider" style={{ color: "var(--muted-foreground)" }}>
                  <th className="text-left pb-3 font-medium">INDICATEUR</th>
                  <th className="text-left pb-3 font-medium">METHODE</th>
                  <th className="text-left pb-3 font-medium">FREQUENCE</th>
                  <th className="text-left pb-3 font-medium">SEUIL</th>
                  <th className="text-left pb-3 font-medium">ACTION</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderTop: "1px solid var(--surface-container)" }}>
                  <td className="py-3 font-medium" style={{ color: "var(--foreground)" }}>Opt-in Partner</td>
                  <td className="py-3" style={{ color: "var(--muted-foreground)" }}>KPI backend fair</td>
                  <td className="py-3" style={{ color: "var(--muted-foreground)" }}>Quotidien</td>
                  <td className="py-3" style={{ color: "var(--muted-foreground)" }}>&lt; 40%</td>
                  <td className="py-3" style={{ color: "var(--error)" }}>▲ Relance consentement stand</td>
                </tr>
                <tr style={{ borderTop: "1px solid var(--surface-container)" }}>
                  <td className="py-3 font-medium" style={{ color: "var(--foreground)" }}>Opt-in Call</td>
                  <td className="py-3" style={{ color: "var(--muted-foreground)" }}>KPI backend fair</td>
                  <td className="py-3" style={{ color: "var(--muted-foreground)" }}>Quotidien</td>
                  <td className="py-3" style={{ color: "var(--muted-foreground)" }}>&lt; 20%</td>
                  <td className="py-3" style={{ color: "var(--error)" }}>▲ Ajuster script de collecte</td>
                </tr>
                <tr style={{ borderTop: "1px solid var(--surface-container)" }}>
                  <td className="py-3 font-medium" style={{ color: "var(--foreground)" }}>Leads monetisables</td>
                  <td className="py-3" style={{ color: "var(--muted-foreground)" }}>Total monetisable value</td>
                  <td className="py-3" style={{ color: "var(--muted-foreground)" }}>Hebdo</td>
                  <td className="py-3" style={{ color: "var(--muted-foreground)" }}>&lt; 50kEUR</td>
                  <td className="py-3" style={{ color: "var(--error)" }}>▲ Reviser ciblage partenaires</td>
                </tr>
              </tbody>
            </table>
          </Card>
        </div>
        <Card>
          <p className="text-xs tracking-wider mb-3" style={{ color: "var(--muted-foreground)" }}>DISTRIBUTION PAR TIERS</p>
          {/* 5-tier counts row */}
          <div className="flex justify-between mb-4">
            <div className="text-center">
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>TIER 23€ (VIP)</p>
              <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>83</p>
            </div>
            <div className="text-center">
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>TIER 22.5€ (Haut)</p>
              <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>12</p>
            </div>
            <div className="text-center">
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>TIER 15€ (Moyen)</p>
              <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>67</p>
            </div>
            <div className="text-center">
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>TIER 3€ (Bas)</p>
              <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>25</p>
            </div>
            <div className="text-center">
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>TIER 0€ (Gratuit)</p>
              <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>413</p>
            </div>
          </div>
          <div className="flex h-2 rounded-full overflow-hidden">
            <div style={{ width: "13.8%", background: "var(--primary)" }} />
            <div style={{ width: "2%",   background: "#6750a4" }} />
            <div style={{ width: "11.2%", background: "var(--accent)" }} />
            <div style={{ width: "4.2%", background: "#c9a227" }} />
            <div style={{ width: "68.8%", background: "var(--secondary)" }} />
          </div>
          <div className="flex justify-between mt-3">
            {[
              { label: "23€", color: "var(--primary)" },
              { label: "22.5€", color: "#6750a4" },
              { label: "15€", color: "var(--accent)" },
              { label: "3€", color: "#c9a227" },
              { label: "0€", color: "var(--secondary)" },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />
                <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{label}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Classements Performance - now full width */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>Classements Performance</h3>
          <div className="flex rounded-xl p-1" style={{ background: "var(--surface-container)" }}>
            {(["stands", "conferences", "emergents"] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize"
                style={{
                  background: activeTab === tab ? "var(--card)" : "transparent",
                  color: activeTab === tab ? "var(--foreground)" : "var(--muted-foreground)",
                  boxShadow: activeTab === tab ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                }}
              >
                {tab === "stands" ? "Stands" : tab === "conferences" ? "Conférences" : "Émergents"}
              </button>
            ))}
          </div>
        </div>

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
              {topStands.map((stand, i) => (
                <tr key={stand.rank} style={{ borderBottom: i < topStands.length - 1 ? "1px solid var(--surface-container)" : "none" }}>
                  <td className="py-3 text-sm" style={{ color: "var(--primary)" }}>{String(i + 1).padStart(2, "0")}</td>
                  <td className="py-3">
                    <Link to="/stands/$standId" params={{ standId: String(stand.rank) }} className="hover:underline font-medium" style={{ color: "var(--foreground)" }}>
                      {stand.name}
                    </Link>
                  </td>
                  <td className="py-3 font-medium" style={{ color: "var(--foreground)" }}>{stand.stand_scans.toLocaleString("fr-FR")}</td>
                  <td className="py-3">
                    <div className="w-20 h-1.5 rounded-full" style={{ background: "var(--surface-container)" }}>
                      <div className="h-full rounded-full" style={{ width: `${stand.mini_game_engagement}%`, background: "var(--primary)" }} />
                    </div>
                  </td>
                  <td className="py-3 font-medium" style={{ color: "var(--success)" }}>{stand.conversion_rate}%</td>
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
              {topConferences.map((conf, i) => (
                <tr key={conf.id} style={{ borderBottom: i < topConferences.length - 1 ? "1px solid var(--surface-container)" : "none" }}>
                  <td className="py-3 text-sm" style={{ color: "var(--primary)" }}>{String(i + 1).padStart(2, "0")}</td>
                  <td className="py-3 font-medium" style={{ color: "var(--foreground)" }}>{conf.title}</td>
                  <td className="py-3 font-medium" style={{ color: "var(--foreground)" }}>{conf.scans.toLocaleString("fr-FR")}</td>
                  <td className="py-3">
                    <div className="w-20 h-1.5 rounded-full" style={{ background: "var(--surface-container)" }}>
                      <div className="h-full rounded-full" style={{ width: `${conf.engagement_rate}%`, background: "var(--accent)" }} />
                    </div>
                  </td>
                  <td className="py-3" style={{ color: conf.trend_delta >= 0 ? "var(--success)" : "var(--error)" }}>
                    {conf.trend_delta >= 0 ? "+" : ""}{conf.trend_delta}%
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
              {stands.filter(s => s.trend_delta > 20).slice(0, 5).map((stand, i, arr) => (
                <tr key={stand.rank} style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--surface-container)" : "none" }}>
                  <td className="py-3 text-sm" style={{ color: "var(--primary)" }}>{String(i + 1).padStart(2, "0")}</td>
                  <td className="py-3">
                    <Link to="/stands/$standId" params={{ standId: String(stand.rank) }} className="hover:underline font-medium" style={{ color: "var(--foreground)" }}>
                      {stand.name}
                    </Link>
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-1 rounded text-sm font-medium" style={{ background: "#e8f5e9", color: "var(--success)" }}>
                      +{stand.trend_delta}%
                    </span>
                  </td>
                  <td className="py-3 font-medium" style={{ color: "var(--foreground)" }}>{stand.stand_scans.toLocaleString("fr-FR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <ScenarioTester leads={leadRows} loading={loading} />
    </div>
  );
}

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Tableau de Bord — Curator Pro" },
      { name: "description", content: "Vue d'ensemble en temps reel de la valorisation des leads et de l'engagement." },
    ],
  }),
  component: () => (
    <AdminLayout title="Tableau de Bord" subtitle={"Vue d'ensemble en temps reel de la valorisation des leads et de l'engagement."}>
      <DashboardPage />
    </AdminLayout>
  ),
});
