import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin-layout";

export const Route = createFileRoute("/leads_/comparison")({
  head: () => ({
    meta: [
      { title: "Comparaison de Leads — Curator Pro" },
      {
        name: "description",
        content:
          "Analyse comparative approfondie des profils candidats pour l'optimisation des conversions et la segmentation stratégique.",
      },
    ],
  }),
  component: ComparisonPage,
});

function Icon({ d, className = "w-5 h-5" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={d} />
    </svg>
  );
}

const TERTIARY = "#c9a74d";
const TERTIARY_TEXT = "#503d00";

function ProfileCard({
  name,
  id,
  initials,
  accent,
  bgAvatar,
}: {
  name: string;
  id: string;
  initials: string;
  accent: string;
  bgAvatar: string;
}) {
  return (
    <div
      className="p-7 rounded-3xl flex items-center gap-5"
      style={{
        background: "white",
        boxShadow: "var(--shadow-card)",
        borderLeft: `4px solid ${accent}`,
      }}
    >
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-extrabold text-white"
        style={{ background: bgAvatar, letterSpacing: "-0.02em" }}
      >
        {initials}
      </div>
      <div>
        <h3 className="text-2xl font-extrabold" style={{ letterSpacing: "-0.02em" }}>
          {name}
        </h3>
        <span
          className="inline-block mt-2 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider"
          style={{ background: `color-mix(in oklab, ${accent} 12%, transparent)`, color: accent }}
        >
          {id}
        </span>
      </div>
    </div>
  );
}

function ScoreBar({ label, leaPct, thomasPct, valueText }: { label: string; leaPct: number; thomasPct: number; valueText: string }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between text-[11px] uppercase tracking-wider font-semibold" style={{ color: "var(--muted-foreground)" }}>
        <span>{label}</span>
        <span>{valueText}</span>
      </div>
      <div className="rounded-full overflow-hidden flex flex-col gap-1" style={{ background: "var(--surface-container, #f2ecf4)" }}>
        <div className="h-1.5 rounded-full" style={{ width: `${leaPct}%`, background: TERTIARY }} />
        <div className="h-1.5 rounded-full" style={{ width: `${thomasPct}%`, background: "var(--primary)" }} />
      </div>
    </div>
  );
}

function ActivityTimeline({
  title,
  tier,
  accent,
  items,
}: {
  title: string;
  tier: string;
  accent: string;
  items: { time: string; title: string; sub: string }[];
}) {
  return (
    <div
      className="p-8 rounded-3xl"
      style={{ background: "white", boxShadow: "var(--shadow-card)", borderTop: `4px solid ${accent}` }}
    >
      <div className="flex items-center justify-between mb-7">
        <div className="flex items-center gap-3">
          <span style={{ color: accent }}>
            <Icon d="M12 8v4l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </span>
          <h4 className="text-lg font-bold" style={{ letterSpacing: "-0.01em" }}>
            {title}
          </h4>
        </div>
        <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: accent }}>
          {tier}
        </span>
      </div>
      <div className="space-y-6 relative">
        <div className="absolute left-[11px] top-2 bottom-2 w-0.5" style={{ background: `color-mix(in oklab, ${accent} 25%, transparent)` }} />
        {items.map((it, i) => (
          <div key={i} className="relative pl-10">
            <div
              className="absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: `color-mix(in oklab, ${accent} 12%, transparent)` }}
            >
              <div className="w-2 h-2 rounded-full" style={{ background: accent }} />
            </div>
            <p className="text-[10px] uppercase tracking-wider font-semibold opacity-60" style={{ color: "var(--muted-foreground)" }}>
              {it.time}
            </p>
            <p className="font-semibold mt-1">{it.title}</p>
            <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
              {it.sub}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComparisonPage() {
  const navigate = useNavigate();
  return (
    <AdminLayout
      title="Comparaison de Leads"
      subtitle="Analyse approfondie des profils candidats pour l'optimisation des conversions et la segmentation stratégique."
      actions={
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate({ to: "/dashboard" })}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all"
            style={{
              background: "white",
              color: "var(--foreground)",
              border: "1px solid var(--outline-variant, #cbc4d2)",
            }}
          >
            <Icon d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" className="w-4 h-4" />
            Exporter PDF
          </button>
          <button
            className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:scale-[1.02]"
            style={{
              background: "linear-gradient(135deg, #4f378a 0%, #6750a4 100%)",
              boxShadow: "0 12px 24px -8px color-mix(in oklab, var(--primary) 35%, transparent)",
            }}
          >
            <Icon d="M12 5v14M5 12h14" className="w-4 h-4" />
            Nouveau Lead
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Profile spotlight */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <ProfileCard
            name="Léa Martin"
            id="ID: 146"
            initials="LM"
            accent={TERTIARY}
            bgAvatar="linear-gradient(135deg, #c9a74d 0%, #e7c365 100%)"
          />
          <ProfileCard
            name="Thomas Muller"
            id="ID: 164"
            initials="LT"
            accent="var(--primary)"
            bgAvatar="linear-gradient(135deg, #4f378a 0%, #6750a4 100%)"
          />
        </section>

        {/* Score d'Intelligence */}
        <section className="p-9 rounded-3xl" style={{ background: "white", boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center gap-3 mb-8">
            <span style={{ color: "var(--primary)" }}>
              <Icon d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3 2.5 2.5 0 0 1 2.46-2.04ZM14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3 2.5 2.5 0 0 0-2.46-2.04Z" />
            </span>
            <h4 className="text-lg font-bold" style={{ letterSpacing: "-0.01em" }}>
              Score d'Intelligence
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <ScoreBar label="Intent" leaPct={94} thomasPct={72} valueText="94% (Léa) vs 72% (Thomas)" />
            <ScoreBar label="Engagement" leaPct={92} thomasPct={68} valueText="92% vs 68%" />
            <ScoreBar label="Monetisability" leaPct={90} thomasPct={75} valueText="90% vs 75%" />
          </div>
          <div className="flex items-center gap-6 mt-8 pt-6" style={{ borderTop: "1px solid color-mix(in oklab, var(--outline-variant, #cbc4d2) 50%, transparent)" }}>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-3 h-3 rounded-full" style={{ background: TERTIARY }} />
              <span className="font-semibold">Léa Martin</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-3 h-3 rounded-full" style={{ background: "var(--primary)" }} />
              <span className="font-semibold">Thomas Muller</span>
            </div>
          </div>
        </section>

        {/* Valeur Monétisable + Facteur de Revente */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="p-9 rounded-3xl" style={{ background: "white", boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center gap-3 mb-6">
              <span style={{ color: "var(--primary)" }}>
                <Icon d="M2 7h20M5 7v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7M9 11h6M9 15h6" />
              </span>
              <h4 className="text-lg font-bold" style={{ letterSpacing: "-0.01em" }}>
                Valeur Monétisable
              </h4>
            </div>
            <div className="flex justify-between items-end gap-4">
              <div className="text-center flex-1">
                <p className="text-5xl font-black" style={{ color: TERTIARY_TEXT, letterSpacing: "-0.04em" }}>
                  €1,580<span className="text-2xl">.00</span>
                </p>
                <p className="text-[11px] uppercase tracking-wider font-semibold mt-2" style={{ color: "var(--muted-foreground)" }}>
                  Léa Martin
                </p>
              </div>
              <div className="w-px h-20" style={{ background: "var(--surface-container, #f2ecf4)" }} />
              <div className="text-center flex-1">
                <p className="text-5xl font-black" style={{ color: "var(--primary)", letterSpacing: "-0.04em" }}>
                  €840<span className="text-2xl">.50</span>
                </p>
                <p className="text-[11px] uppercase tracking-wider font-semibold mt-2" style={{ color: "var(--muted-foreground)" }}>
                  Thomas Muller
                </p>
              </div>
            </div>
          </div>

          <div className="p-9 rounded-3xl" style={{ background: "white", boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center gap-3 mb-6">
              <span style={{ color: "var(--primary)" }}>
                <Icon d="M3 17l6-6 4 4 8-8M17 7h4v4" />
              </span>
              <h4 className="text-lg font-bold" style={{ letterSpacing: "-0.01em" }}>
                Facteur de Revente
              </h4>
            </div>
            <div className="flex justify-around items-center h-24">
              <div className="text-center">
                <p className="text-5xl font-black" style={{ color: TERTIARY_TEXT, letterSpacing: "-0.04em" }}>
                  2.4<span className="text-2xl">x</span>
                </p>
                <span
                  className="inline-block mt-2 px-2 py-1 rounded-md text-[10px] font-bold"
                  style={{ background: `color-mix(in oklab, ${TERTIARY} 15%, transparent)`, color: TERTIARY_TEXT }}
                >
                  +42% vs avg
                </span>
              </div>
              <span style={{ color: "var(--outline-variant, #cbc4d2)" }}>
                <Icon d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" className="w-10 h-10" />
              </span>
              <div className="text-center">
                <p className="text-5xl font-black" style={{ color: "var(--primary)", letterSpacing: "-0.04em" }}>
                  1.2<span className="text-2xl">x</span>
                </p>
                <span
                  className="inline-block mt-2 px-2 py-1 rounded-md text-[10px] font-bold"
                  style={{ background: "color-mix(in oklab, #ba1a1a 15%, transparent)", color: "#ba1a1a" }}
                >
                  -5% vs avg
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Activités */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <ActivityTimeline
            title="Activités de Léa Martin"
            tier="Elite Tier"
            accent={TERTIARY}
            items={[
              { time: "Aujourd'hui", title: "Contact direct exposant", sub: "Interaction prioritaire avec le stand ESSEC" },
              { time: "Il y a 4 heures", title: "Visite longue Master RH (12 min)", sub: "Niveau d'engagement exceptionnel" },
              { time: "Il y a 1 heure", title: "Email envoyé à l'ESSEC", sub: "Sujet : Admission Master Spécialisé" },
            ]}
          />
          <ActivityTimeline
            title="Activités de Thomas Muller"
            tier="Haut Tier"
            accent="var(--primary)"
            items={[
              { time: "Hier", title: "Scan QR Stand Game Design", sub: "Téléchargement de la brochure complète" },
              { time: "Hier", title: "Masterclass visionnée (2 fois)", sub: "Thème : Futurs des métiers créatifs" },
              { time: "À l'instant", title: "Mise à jour du score par l'IA", sub: "Recalcul des probabilités de conversion" },
            ]}
          />
        </section>
      </div>
    </AdminLayout>
  );
}
