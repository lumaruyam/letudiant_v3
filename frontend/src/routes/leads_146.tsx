import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin-layout";

export const Route = createFileRoute("/leads_146")({
  component: LeaMartinPage,
});

const timeline = [
  {
    title: "Instagram Discovery",
    desc: "Engagement via campagne d'influence orientation.",
    when: "Il y a 14 jours",
    icon: "dot",
  },
  {
    title: "Psychology L1 bookmarking",
    desc: "Mise en favori de la fiche formation sur la plateforme.",
    when: "Il y a 10 jours",
    icon: "dot",
  },
  {
    title: "12min conversation at HR Master stand",
    desc: "Discussion approfondie sur les débouchés en ressources humaines.",
    when: "SALON ÉTUDIANT - Jour 1",
    icon: "star",
    accent: true,
  },
  {
    title: "Photo of materials taken",
    desc: "Scan du QR code sur la brochure de présentation.",
    when: "SALON ÉTUDIANT - Jour 1",
    icon: "dot",
  },
  {
    title: "Direct email follow-up",
    desc: "Prospect a répondu positivement au mail automatique de relance.",
    when: "AUJOURD'HUI",
    icon: "check",
    highlight: true,
  },
];

function LeaMartinPage() {
  return (
    <AdminLayout
      title="Léa Martin"
      subtitle="Fiche prospect enrichie — signaux d'intention, valeur monétisable et prochaines actions recommandées."
      actions={
        <Link
          to="/leads"
          className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{ background: "var(--surface-container)", color: "var(--foreground)" }}
        >
          ← Retour aux leads
        </Link>
      }
    >
      {/* Header row: identity + monetisable value */}
      <div
        className="rounded-3xl p-8 mb-6 flex items-center justify-between flex-wrap gap-6"
        style={{ background: "var(--surface-container-low)", boxShadow: "var(--shadow-card)" }}
      >
        <div className="flex items-center gap-6">
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center text-4xl font-extrabold text-white"
            style={{ background: "var(--gradient-primary)" }}
          >
            LM
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h3
                className="text-4xl font-extrabold leading-none"
                style={{ color: "var(--foreground)", letterSpacing: "-0.03em" }}
              >
                Léa Martin
              </h3>
              <span
                className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: "var(--surface-container)", color: "var(--muted-foreground)" }}
              >
                ID 146
              </span>
            </div>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span
                className="px-3 py-1 rounded-full text-xs font-medium"
                style={{ background: "var(--surface-container)", color: "var(--foreground)" }}
              >
                Terminale
              </span>
              <span
                className="px-3 py-1 rounded-full text-xs font-medium"
                style={{ background: "var(--surface-container)", color: "var(--foreground)" }}
              >
                non_school_group
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p
            className="text-[11px] tracking-[0.15em] font-semibold mb-2"
            style={{ color: "var(--muted-foreground)" }}
          >
            VALEUR MONÉTISABLE
          </p>
          <p
            className="text-6xl font-black leading-none"
            style={{
              background: "var(--gradient-primary)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "-0.04em",
            }}
          >
            €69
          </p>
        </div>
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-12 gap-5 mb-6">
        {/* Score indicators */}
        <div
          className="col-span-12 lg:col-span-7 rounded-3xl p-7"
          style={{ background: "var(--surface-container-low)", boxShadow: "var(--shadow-card)" }}
        >
          <h4
            className="text-xl font-bold mb-6"
            style={{ color: "var(--foreground)", letterSpacing: "-0.01em" }}
          >
            Indicateurs de Score Bento
          </h4>
          <div className="grid grid-cols-3 gap-5">
            {[
              { label: "INTENTION", value: "Élevée", color: "var(--primary)" },
              { label: "ENGAGEMENT", value: "Élevé", color: "var(--primary)" },
              { label: "MONÉTISATION", value: "Très Élevée", color: "#dc2626" },
            ].map((m) => (
              <div key={m.label}>
                <p
                  className="text-[10px] tracking-[0.15em] font-semibold mb-2"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {m.label}
                </p>
                <p className="text-2xl font-extrabold leading-tight" style={{ color: m.color }}>
                  {m.value}
                </p>
              </div>
            ))}
          </div>
          <div
            className="mt-7 pt-5 flex items-end justify-between"
            style={{ borderTop: "1px solid var(--outline-variant)" }}
          >
            <div>
              <p
                className="text-[10px] tracking-[0.15em] font-semibold mb-1"
                style={{ color: "var(--muted-foreground)" }}
              >
                SCORE TOTAL
              </p>
              <p
                className="text-5xl font-black"
                style={{ color: "var(--foreground)", letterSpacing: "-0.03em" }}
              >
                45.5
              </p>
            </div>
            <div className="flex items-end gap-1 h-12">
              {[0.5, 0.7, 0.9, 0.6, 0.3].map((h, i) => (
                <div
                  key={i}
                  className="w-2.5 rounded-sm"
                  style={{
                    height: `${h * 100}%`,
                    background:
                      i < 3 ? "var(--primary)" : "color-mix(in oklab, var(--primary) 25%, transparent)",
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Tier & drivers */}
        <div
          className="col-span-12 lg:col-span-5 rounded-3xl p-7"
          style={{ background: "var(--surface-container-low)", boxShadow: "var(--shadow-card)" }}
        >
          <div className="grid grid-cols-2 gap-5 mb-6">
            <div>
              <p
                className="text-[10px] tracking-[0.15em] font-semibold mb-2"
                style={{ color: "var(--muted-foreground)" }}
              >
                LEAD TIER
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <p
                  className="text-4xl font-black"
                  style={{ color: "var(--foreground)", letterSpacing: "-0.03em" }}
                >
                  €23
                </p>
                <span
                  className="px-2 py-1 rounded-md text-[10px] font-bold tracking-wide"
                  style={{ background: "#fee2e2", color: "#dc2626" }}
                >
                  HIGH TIER
                </span>
              </div>
            </div>
            <div>
              <p
                className="text-[10px] tracking-[0.15em] font-semibold mb-2"
                style={{ color: "var(--muted-foreground)" }}
              >
                FACTEUR RESELL
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <p
                  className="text-4xl font-black"
                  style={{ color: "var(--foreground)", letterSpacing: "-0.03em" }}
                >
                  x3
                </p>
                <span
                  className="px-2 py-1 rounded-md text-[10px] font-bold tracking-wide"
                  style={{ background: "color-mix(in oklab, var(--primary) 15%, transparent)", color: "var(--primary)" }}
                >
                  PREMIUM
                </span>
              </div>
            </div>
          </div>
          <div
            className="pt-5"
            style={{ borderTop: "1px solid var(--outline-variant)" }}
          >
            <p
              className="text-[10px] tracking-[0.15em] font-semibold mb-3"
              style={{ color: "var(--muted-foreground)" }}
            >
              TOP DRIVERS
            </p>
            <div className="flex flex-wrap gap-2">
              {["Multiple interests", "Partner consent", "High monetization tier"].map((d) => (
                <span
                  key={d}
                  className="px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{ background: "var(--surface-container)", color: "var(--foreground)" }}
                >
                  {d}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Value progression curve */}
        <div
          className="col-span-12 lg:col-span-7 rounded-3xl p-7"
          style={{ background: "var(--surface-container-low)", boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex items-center justify-between mb-5">
            <h4
              className="text-xl font-bold"
              style={{ color: "var(--foreground)", letterSpacing: "-0.01em" }}
            >
              Courbe de Progression de Valeur
            </h4>
            <div className="flex items-center gap-4 text-xs" style={{ color: "var(--muted-foreground)" }}>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: "var(--primary)" }} />
                Score
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: "#f59e0b" }} />
                Valeur (€)
              </span>
            </div>
          </div>
          <div className="relative h-52">
            <svg viewBox="0 0 500 200" className="w-full h-full" preserveAspectRatio="none">
              <path
                d="M 20 160 Q 120 150 180 130 T 320 90 T 480 50"
                stroke="var(--primary)"
                strokeWidth="3"
                fill="none"
              />
              <path
                d="M 20 175 Q 120 170 180 155 T 320 115 T 480 80"
                stroke="#f59e0b"
                strokeWidth="2.5"
                fill="none"
                strokeDasharray="6 5"
              />
              {[
                [20, 160],
                [180, 130],
                [320, 90],
                [480, 50],
              ].map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="5" fill="var(--primary)" />
              ))}
            </svg>
          </div>
          <div
            className="flex justify-between mt-2 text-[11px] tracking-wide"
            style={{ color: "var(--muted-foreground)" }}
          >
            <span>Pré-Salon</span>
            <span>Discovery</span>
            <span>Pendant Salon</span>
            <span>Post-Salon (Now)</span>
          </div>
        </div>

        {/* Next Best Action */}
        <div
          className="col-span-12 lg:col-span-5 rounded-3xl p-7"
          style={{ background: "var(--surface-container-low)", boxShadow: "var(--shadow-card)" }}
        >
          <h4
            className="text-xl font-bold mb-5"
            style={{ color: "var(--foreground)", letterSpacing: "-0.01em" }}
          >
            Next Best Action
          </h4>
          <div className="space-y-3">
            {[
              { label: "Export to Partner", icon: "↗" },
              { label: "Nurture high-intent", icon: "♥" },
            ].map((a) => (
              <button
                key={a.label}
                className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-medium transition-all hover:opacity-90"
                style={{ background: "var(--surface-container)", color: "var(--foreground)" }}
              >
                <span className="flex items-center gap-3">
                  <span
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                    style={{ background: "var(--background)", color: "var(--muted-foreground)" }}
                  >
                    {a.icon}
                  </span>
                  {a.label}
                </span>
                <span style={{ color: "var(--muted-foreground)" }}>›</span>
              </button>
            ))}
            <button
              className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "var(--gradient-primary)" }}
            >
              <span className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm bg-white/20">
                  📅
                </span>
                Schedule Consultation
              </span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div
        className="rounded-3xl p-8"
        style={{ background: "var(--surface-container-low)", boxShadow: "var(--shadow-card)" }}
      >
        <h4
          className="text-xl font-bold mb-6"
          style={{ color: "var(--foreground)", letterSpacing: "-0.01em" }}
        >
          Timeline des Événements
        </h4>
        <div className="relative">
          <div
            className="absolute left-[11px] top-2 bottom-2 w-px"
            style={{ background: "var(--outline-variant)" }}
          />
          <div className="space-y-6">
            {timeline.map((ev, i) => (
              <div key={i} className="relative flex items-start gap-5 pl-0">
                <div
                  className="relative z-10 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background:
                      ev.highlight
                        ? "var(--primary)"
                        : ev.accent
                          ? "#fff7ed"
                          : "var(--surface-container)",
                    border: ev.accent ? "2px solid #f59e0b" : "none",
                  }}
                >
                  {ev.icon === "check" && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                  {ev.icon === "star" && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="2">
                      <polygon points="12 2 15 8.5 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 9 8.5 12 2" />
                    </svg>
                  )}
                  {ev.icon === "dot" && (
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: "var(--primary)" }}
                    />
                  )}
                </div>
                <div className="flex-1 flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-bold text-[15px]" style={{ color: "var(--foreground)" }}>
                      {ev.title}
                    </p>
                    <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
                      {ev.desc}
                    </p>
                  </div>
                  <span
                    className="px-3 py-1 rounded-full text-[10px] font-semibold tracking-wide whitespace-nowrap"
                    style={{
                      background:
                        ev.highlight
                          ? "color-mix(in oklab, var(--primary) 15%, transparent)"
                          : ev.accent
                            ? "#fff7ed"
                            : "var(--surface-container)",
                      color:
                        ev.highlight
                          ? "var(--primary)"
                          : ev.accent
                            ? "#b45309"
                            : "var(--muted-foreground)",
                    }}
                  >
                    {ev.when}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
