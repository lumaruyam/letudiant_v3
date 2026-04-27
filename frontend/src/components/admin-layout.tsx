import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

const navItems = [
  { href: "/dashboard", label: "TABLEAU DE BORD", icon: "dashboard" as const },
  { href: "/leads", label: "LISTE DES LEADS", icon: "leads" as const },
  { href: "/stands", label: "ANALYSE DES STANDS", icon: "stands" as const },
  { href: "/settings", label: "PARAMÈTRES DU MODÈLE", icon: "settings" as const },
];

function NavIcon({ type, active }: { type: string; active: boolean }) {
  const color = active ? "var(--primary)" : "var(--muted-foreground)";
  switch (type) {
    case "dashboard":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case "leads":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "stands":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
          <path d="M3 3v18h18" />
          <path d="M18 17V9" />
          <path d="M13 17V5" />
          <path d="M8 17v-3" />
        </svg>
      );
    case "settings":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    default:
      return null;
  }
}

export function AdminLayout({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [user, setUser] = useState<{ email: string; name: string }>({
    email: "admin@letudiant.local",
    name: "admin",
  });
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const auth = typeof window !== "undefined" ? localStorage.getItem("letudiant_auth") : null;
    if (!auth) {
      return;
    }
    try {
      setUser(JSON.parse(auth));
    } catch {
      localStorage.removeItem("letudiant_auth");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("letudiant_auth");
    navigate({ to: "/" });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Chargement…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <aside
        className="w-[230px] flex flex-col fixed h-screen border-r"
        style={{ background: "var(--sidebar)", borderColor: "var(--outline-variant)" }}
      >
        <div className="p-6 pb-5">
          <img src="/letudiant-logo.png" alt="L'etudiant" className="h-14 w-auto object-contain" />
        </div>

        <nav className="flex-1 px-3 mt-4">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || (item.href === "/leads" && pathname.startsWith("/lead/"));
            return (
              <Link
                key={item.href}
                to={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-all"
                style={{
                  background: isActive ? "var(--surface-container)" : "transparent",
                  color: isActive ? "var(--primary)" : "var(--muted-foreground)",
                  fontWeight: isActive ? 600 : 500,
                }}
              >
                <NavIcon type={item.icon} active={isActive} />
                <span className="text-[11px] tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4">
          <div
            className="flex items-center gap-3 px-3 py-3 rounded-2xl"
            style={{ background: "var(--surface-container)" }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-white"
              style={{ background: "var(--gradient-primary)" }}
            >
              {user.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>
                {user.name.charAt(0).toUpperCase() + user.name.slice(1)}
              </p>
              <p className="text-[10px] tracking-wider" style={{ color: "var(--muted-foreground)" }}>
                ADMIN CONSOLE
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full mt-3 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90"
            style={{ background: "var(--gradient-primary)" }}
          >
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-[230px]">
        <header
          className="sticky top-0 z-10 flex items-center justify-between px-10 py-5"
          style={{
            background: "color-mix(in oklab, var(--background) 85%, transparent)",
            backdropFilter: "blur(14px)",
          }}
        >
          <div className="flex-1 max-w-md">
            <div className="relative">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: "var(--muted-foreground)" }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search parameters…"
                className="w-full pl-11 pr-4 py-3 rounded-2xl text-sm transition-all focus:outline-none focus:ring-2"
                style={{
                  background: "var(--surface-container)",
                  border: "1px solid transparent",
                  color: "var(--foreground)",
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-5 ml-6">
            <button className="p-2 rounded-lg hover:bg-black/5 transition-colors relative">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                  Alex Rivers
                </p>
                <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                  Head of Growth
                </p>
              </div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white"
                style={{ background: "var(--gradient-primary)" }}
              >
                AR
              </div>
            </div>
          </div>
        </header>

        <div className="px-10 pb-10">
          <div className="mb-8 flex items-start justify-between gap-6 flex-wrap">
            <div>
              <h2
                className="text-[40px] font-extrabold tracking-tight leading-none"
                style={{ color: "var(--foreground)", letterSpacing: "-0.03em" }}
              >
                {title}
              </h2>
              {subtitle && (
                <p className="text-sm mt-3 max-w-2xl" style={{ color: "var(--muted-foreground)" }}>
                  {subtitle}
                </p>
              )}
            </div>
            {actions && <div className="flex items-center gap-3">{actions}</div>}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
