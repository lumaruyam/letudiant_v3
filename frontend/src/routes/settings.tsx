import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin-layout";
import { useState, useMemo, type ReactNode } from "react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Model Settings — Curator Pro" },
      {
        name: "description",
        content: "Adjust the weighting and threshold logic for the Lead Console intelligence engine.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  return (
    <AdminLayout
      title="Model Settings"
      subtitle="Adjust the weighting and threshold logic for the Lead Console intelligence engine."
      actions={
        <>
          <button
            onClick={() => navigate({ to: "/dashboard" })}
            className="px-5 py-3 rounded-2xl text-sm font-semibold transition-all hover:bg-black/5"
            style={{
              background: "var(--card)",
              color: "var(--foreground)",
              boxShadow: "var(--shadow-soft)",
            }}
          >
            Discard Changes
          </button>
          <button
            className="px-6 py-3 rounded-2xl text-sm font-semibold text-white transition-all hover:opacity-95"
            style={{
              background: "var(--gradient-primary)",
              boxShadow: "0 10px 24px color-mix(in oklab, var(--primary) 30%, transparent)",
            }}
          >
            Apply Algorithm
          </button>
        </>
      }
    >
      <SettingsBody />
    </AdminLayout>
  );
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-3xl p-8 ${className}`}
      style={{ background: "var(--card)", boxShadow: "var(--shadow-card)" }}
    >
      {children}
    </div>
  );
}

function WeightSlider({
  label,
  icon,
  value,
  onChange,
  leftLabel,
  rightLabel,
}: {
  label: string;
  icon: ReactNode;
  value: number;
  onChange: (v: number) => void;
  leftLabel: string;
  rightLabel: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span style={{ color: "var(--primary)" }}>{icon}</span>
          <span className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
            {label}
          </span>
        </div>
        <span className="text-base font-bold tabular-nums" style={{ color: "var(--foreground)" }}>
          {value}%
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="curator-range"
      />
      <div className="flex justify-between mt-3 text-[10px] font-semibold tracking-[0.12em]" style={{ color: "var(--muted-foreground)" }}>
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}

function SettingsBody() {
  const [intent, setIntent] = useState(75);
  const [engagement, setEngagement] = useState(42);
  const [monetisability, setMonetisability] = useState(18);
  const [scoreThreshold, setScoreThreshold] = useState(85);
  const [tier, setTier] = useState("Gold");
  const [nudgeOn, setNudgeOn] = useState(true);

  const beforeScore = 8.2;
  const afterScore = useMemo(() => {
    const blend = (intent * 0.0042 + engagement * 0.0035 + monetisability * 0.006);
    return Math.min(9.6, Math.max(6.5, beforeScore + blend - 0.4));
  }, [intent, engagement, monetisability]);

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* LEFT — Weight Distributions */}
      <Card className="col-span-12 lg:col-span-8">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
            Weight Distributions
          </h3>
          <span
            className="px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-wide"
            style={{
              background: "color-mix(in oklab, var(--primary) 12%, transparent)",
              color: "var(--primary)",
            }}
          >
            V2.4 Active
          </span>
        </div>

        <div className="space-y-8">
          <WeightSlider
            label="Intent Weight"
            value={intent}
            onChange={setIntent}
            leftLabel="TRANSACTIONAL"
            rightLabel="INFORMATIONAL"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
              </svg>
            }
          />
          <WeightSlider
            label="Engagement Weight"
            value={engagement}
            onChange={setEngagement}
            leftLabel="PASSIVE"
            rightLabel="HIGH VELOCITY"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            }
          />
          <WeightSlider
            label="Monetisability Weight"
            value={monetisability}
            onChange={setMonetisability}
            leftLabel="SMB / VOLUME"
            rightLabel="ENTERPRISE / WHALE"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 7c-3-3-9-3-12 0M6 17c3 3 9 3 12 0M3 12h18" />
              </svg>
            }
          />
        </div>

        {/* Visual Delta Preview */}
        <div
          className="mt-10 rounded-2xl p-5 flex items-center justify-between gap-6"
          style={{ background: "var(--surface-container-low)", border: "1px solid var(--outline-variant)" }}
        >
          <div className="flex-1">
            <p className="text-xs font-semibold tracking-wide mb-2" style={{ color: "var(--muted-foreground)" }}>
              Visual Delta Preview
            </p>
            <div className="h-2 rounded-full overflow-hidden flex" style={{ background: "var(--surface-container-high)" }}>
              <div className="h-full" style={{ width: "30%", background: "var(--primary)" }} />
              <div className="h-full" style={{ width: "12%", background: "var(--primary-glow)", opacity: 0.6 }} />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] font-semibold tracking-[0.12em]" style={{ color: "var(--muted-foreground)" }}>
                BEFORE
              </p>
              <p className="font-mono text-sm" style={{ color: "var(--foreground)" }}>
                Score <span className="font-bold">{beforeScore.toFixed(1)}</span>
              </p>
            </div>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2">
              <path d="M5 12h14m-6-6 6 6-6 6" />
            </svg>
            <div>
              <p className="text-[10px] font-semibold tracking-[0.12em]" style={{ color: "var(--muted-foreground)" }}>
                AFTER
              </p>
              <p className="font-mono text-sm" style={{ color: "var(--primary)" }}>
                Score <span className="font-bold">{afterScore.toFixed(1)}</span>
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* RIGHT — Automation Thresholds + Impact Forecast */}
      <div className="col-span-12 lg:col-span-4 space-y-6">
        <Card>
          <h3 className="text-xl font-bold tracking-tight mb-6" style={{ color: "var(--foreground)" }}>
            Automation Thresholds
          </h3>

          {/* Export Logic Rule */}
          <div
            className="rounded-2xl p-5 mb-4"
            style={{ background: "var(--surface-container-low)" }}
          >
            <p className="text-[10px] font-semibold tracking-[0.12em] mb-4" style={{ color: "var(--muted-foreground)" }}>
              EXPORT LOGIC RULE
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm" style={{ color: "var(--foreground)" }}>Score &gt;=</span>
                <input
                  type="number"
                  value={scoreThreshold}
                  onChange={(e) => setScoreThreshold(Number(e.target.value))}
                  className="w-20 px-3 py-2 rounded-lg text-sm text-right font-semibold focus:outline-none focus:ring-2"
                  style={{ background: "var(--card)", color: "var(--foreground)" }}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm" style={{ color: "var(--foreground)" }}>Tier &gt;=</span>
                <select
                  value={tier}
                  onChange={(e) => setTier(e.target.value)}
                  className="w-32 px-3 py-2 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2"
                  style={{ background: "var(--card)", color: "var(--foreground)" }}
                >
                  <option>Platinum</option>
                  <option>Gold</option>
                  <option>Silver</option>
                  <option>Base</option>
                </select>
              </div>
            </div>
          </div>

          {/* Consent Nudge Rule */}
          <div className="rounded-2xl p-5" style={{ background: "var(--surface-container-low)" }}>
            <p className="text-[10px] font-semibold tracking-[0.12em] mb-4" style={{ color: "var(--muted-foreground)" }}>
              CONSENT NUDGE RULE
            </p>
            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={() => setNudgeOn(!nudgeOn)}
                className="w-12 h-7 rounded-full transition-all relative"
                style={{ background: nudgeOn ? "var(--primary)" : "var(--surface-container-high)" }}
                aria-pressed={nudgeOn}
              >
                <span
                  className="absolute top-1 w-5 h-5 rounded-full bg-white transition-all"
                  style={{ left: nudgeOn ? "1.5rem" : "0.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}
                />
              </button>
              <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                Trigger on high-intent
              </span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              System will automatically send a follow-up if lead hits 90+ score in 24h.
            </p>
          </div>
        </Card>

        {/* Impact Forecast — dark glass card */}
        <div
          className="rounded-3xl p-6 relative overflow-hidden"
          style={{
            background: "var(--gradient-dark)",
            boxShadow: "var(--shadow-elevated)",
            color: "white",
            minHeight: "200px",
          }}
        >
          {/* Decorative wave */}
          <svg
            className="absolute inset-x-0 bottom-0 w-full opacity-40"
            viewBox="0 0 400 120"
            preserveAspectRatio="none"
            style={{ height: "70%" }}
          >
            <defs>
              <linearGradient id="waveg" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.78 0.15 220)" stopOpacity="0.5" />
                <stop offset="100%" stopColor="oklch(0.78 0.15 220)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0 80 Q 60 40 120 60 T 240 50 T 400 30 L 400 120 L 0 120 Z"
              fill="url(#waveg)"
            />
            <path
              d="M0 80 Q 60 40 120 60 T 240 50 T 400 30"
              fill="none"
              stroke="oklch(0.85 0.18 220)"
              strokeWidth="1.5"
              opacity="0.7"
            />
          </svg>

          <div className="relative">
            <p className="text-[10px] font-semibold tracking-[0.15em] opacity-70 mb-32">
              IMPACT FORECAST
            </p>
            <p className="text-3xl font-extrabold tracking-tight">+12.4% Conv.</p>
            <p className="text-base font-semibold opacity-80">Rate</p>
          </div>
        </div>
      </div>

      {/* Model Transparency — dark code card, full width */}
      <div
        className="col-span-12 rounded-3xl p-8"
        style={{ background: "oklch(0.18 0.03 285)", color: "white", boxShadow: "var(--shadow-elevated)" }}
      >
        <div className="flex items-center gap-3 mb-5">
          <span
            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold italic"
            style={{ background: "color-mix(in oklab, var(--primary) 50%, transparent)", color: "white" }}
          >
            ƒx
          </span>
          <h3 className="text-xl font-bold tracking-tight">Model Transparency</h3>
        </div>

        <p className="font-mono text-sm mb-3" style={{ color: "oklch(0.7 0.15 295)" }}>
          // lead_score_calculation.v2
        </p>

        <pre
          className="rounded-2xl p-6 font-mono text-sm leading-relaxed overflow-x-auto"
          style={{ background: "oklch(0.13 0.025 285)" }}
        >
{`Score = Σ(
    W_intent * (Clicks * 0.4 + Time * 0.6),
    W_eng    * (Frequency ^ 1.2),
    W_monet  * (ARR_Estimate / 1000)
) * Decay(Time_Last_Seen)`}
        </pre>

        <p className="mt-4 text-xs italic" style={{ color: "oklch(0.65 0.02 290)" }}>
          Decay Factor: e^(-0.05 * t) where t is days since last activity.
        </p>
      </div>

      {/* Preview Impact */}
      <Card className="col-span-12">
        <h3 className="text-xl font-bold tracking-tight mb-1" style={{ color: "var(--foreground)" }}>
          Preview Impact
        </h3>
        <p className="text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>
          How these settings would affect your current pipeline.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div
            className="rounded-2xl p-6"
            style={{
              background: "color-mix(in oklab, var(--primary) 9%, transparent)",
              border: "1px solid color-mix(in oklab, var(--primary) 18%, transparent)",
            }}
          >
            <p className="text-[10px] font-semibold tracking-[0.12em] mb-3" style={{ color: "var(--primary)" }}>
              FORECASTED EXPORTS
            </p>
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-5xl font-extrabold tracking-tight" style={{ color: "var(--primary)" }}>
                1,248
              </span>
              <span
                className="text-sm font-bold px-2 py-1 rounded-md"
                style={{ background: "color-mix(in oklab, var(--success) 18%, transparent)", color: "var(--success)" }}
              >
                +14%
              </span>
            </div>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              Leads meeting Gold threshold
            </p>
          </div>

          <div
            className="rounded-2xl p-6"
            style={{ background: "var(--surface-container-low)" }}
          >
            <p className="text-[10px] font-semibold tracking-[0.12em] mb-3" style={{ color: "var(--muted-foreground)" }}>
              TOTAL MONETISABLE
            </p>
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-5xl font-extrabold tracking-tight" style={{ color: "var(--foreground)" }}>
                €4.2M
              </span>
              <span className="text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>
                Baseline
              </span>
            </div>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              Updated ARR based on intent shift
            </p>
          </div>
        </div>

        <div
          className="mt-6 flex items-center justify-between p-4 rounded-2xl"
          style={{ background: "var(--surface-container-low)" }}
        >
          <div className="flex items-center gap-3">
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: "var(--card)", color: "var(--muted-foreground)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            </span>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Model re-training typically takes 15–20 minutes.
            </p>
          </div>
          <button className="text-sm font-semibold" style={{ color: "var(--primary)" }}>
            View History
          </button>
        </div>
      </Card>

      {/* Footer */}
      <div
        className="col-span-12 flex items-center justify-between pt-4 text-[11px] tracking-[0.12em] font-semibold"
        style={{ color: "var(--muted-foreground)" }}
      >
        <span>© 2024 L'ÉTUDIANT LEAD CONSOLE • CONFIDENTIAL</span>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-foreground transition">Documentation</a>
          <a href="#" className="hover:text-foreground transition">API Status</a>
          <a href="#" className="hover:text-foreground transition">Support</a>
        </div>
      </div>
    </div>
  );
}
