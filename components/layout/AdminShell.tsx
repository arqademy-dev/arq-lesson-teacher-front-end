"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  CreditCard,
  Bell,
  Moon,
  Sun,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { applyTheme, getStoredTheme, toggleTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/educators", label: "Educators", icon: Users },
  { href: "/admin/curriculum", label: "Curriculum", icon: BookOpen },
  { href: "/admin/content-bank", label: "Content Bank", icon: BookOpen },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
];

type Props = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  onLogout?: () => void;
  userName?: string;
  pendingCount?: number;
};

export function AdminShell({
  children,
  title,
  subtitle,
  onLogout,
  userName = "Admin",
  pendingCount = 0,
}: Props) {
  const pathname = usePathname();
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const t = getStoredTheme();
    applyTheme(t);
    setTheme(t);
  }, []);

  function onToggleTheme() {
    setTheme(toggleTheme());
  }

  return (
    <div className="relative z-[1] min-h-screen">
      {/* SIDEBAR — fixed to viewport, never scrolls with content */}
      <aside
        className="fixed left-0 top-0 z-50 h-screen flex flex-col border-r w-16 md:w-[236px]"
        style={{ background: "var(--rail)", borderColor: "var(--rail-line)" }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-2.5 px-2 md:px-[18px] py-5 border-b justify-center md:justify-start"
          style={{ borderColor: "var(--rail-line)" }}
        >
          <div
            className="w-[34px] h-[34px] rounded-[9px] grid place-items-center border flex-none"
            style={{
              background: "linear-gradient(150deg, rgba(255,255,255,.13), rgba(255,255,255,.03))",
              borderColor: "rgba(255,255,255,.10)",
              color: "#2FD3C9",
            }}
          >
            <span className="font-heading font-semibold text-[13px]">Q</span>
          </div>

          <div className="min-w-0 hidden md:block">
            <div className="font-heading font-semibold text-[13px] tracking-[0.155em] text-white leading-none">
              ARQADEMY
            </div>
            <div className="text-[9px] font-bold tracking-[0.17em] uppercase mt-1" style={{ color: "var(--rail-ink)" }}>
              Super Admin
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2.5 py-3.5">
          <p
            className="hidden md:block text-[9px] font-bold tracking-[0.18em] uppercase px-2.5 pt-1 pb-2"
            style={{ color: "rgba(255,255,255,.32)" }}
          >
            HQ
          </p>

          {NAV.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            const showBadge = item.href === "/admin/educators" && pendingCount > 0;

            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={cn(
                  "relative flex items-center gap-2.5 w-full px-2.5 py-2 rounded-[8px] text-[13px] font-semibold transition-colors mb-0.5 justify-center md:justify-start",
                  active ? "text-white" : "hover:text-[#DCE4F2]"
                )}
                style={{
                  color: active ? "var(--rail-ink-hi)" : "var(--rail-ink)",
                  background: active ? "rgba(255,255,255,.09)" : undefined,
                }}
              >
                {active && (
                  <span
                    className="absolute left-[-10px] top-1/2 -translate-y-1/2 w-[3px] h-[17px] rounded-r-[3px]"
                    style={{ background: "#2FD3C9" }}
                  />
                )}
                <Icon
                  className="w-[18px] h-[18px] flex-none"
                  style={{ color: active ? "#2FD3C9" : undefined, opacity: active ? 1 : 0.85 }}
                />
                <span className="truncate hidden md:block">{item.label}</span>

                {showBadge && (
                  <span className="hidden md:block ml-auto text-[10.5px] font-bold px-1.5 py-0.5 rounded-full bg-[rgba(228,86,76,.20)] text-[#FF9A92]">
                    {pendingCount}
                  </span>
                )}
                {showBadge && (
                  <span className="md:hidden absolute top-1 right-1 w-2 h-2 rounded-full bg-[#FF6B61]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="px-2 md:px-[18px] pt-3 pb-3 border-t mt-1" style={{ borderColor: "var(--rail-line)" }}>
          <div className="flex items-center gap-2.5 justify-center md:justify-start">
            <div
              className="w-7 h-7 rounded-[8px] grid place-items-center flex-none text-[11px] font-heading font-semibold"
              style={{ background: "rgba(47,211,201,.14)", color: "#2FD3C9" }}
            >
              {userName.slice(0, 1).toUpperCase()}
            </div>

            <div className="min-w-0 flex-1 hidden md:block">
              <div className="text-[11.5px] font-bold text-[#D6DEEE] truncate">{userName}</div>
              <div className="text-[9.5px] font-semibold tracking-[0.09em] uppercase" style={{ color: "rgba(255,255,255,.34)" }}>
                Admin
              </div>
            </div>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                title="Sign out"
                className="hidden md:block text-(--rail-ink) hover:text-white p-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              title="Sign out"
              className="md:hidden w-full flex justify-center mt-3 text-(--rail-ink) hover:text-white"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* MAIN — offset by sidebar width */}
      <div className="flex flex-col min-w-0 ml-16 md:ml-[236px]">
        {/* Header */}
        <header
          className="sticky top-0 z-40 flex items-center gap-3.5 px-4 md:px-6 border-b"
          style={{
            height: "var(--topbar-h, 60px)",
            background: "color-mix(in srgb, var(--canvas) 82%, transparent)",
            borderColor: "var(--line)",
            backdropFilter: "blur(14px)",
          }}
        >
          <div className="flex items-center gap-1.5 text-[12.5px] min-w-0">
            <span className="font-semibold hidden sm:block" style={{ color: "var(--ink-3)" }}>
              HQ
            </span>
            <ChevronRight className="w-3.5 h-3.5 opacity-40 hidden sm:block" style={{ color: "var(--ink-3)" }} />
            <span className="font-bold truncate" style={{ color: "var(--ink)" }}>
              {title || "Admin"}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={onToggleTheme}
              className="w-[34px] h-[34px] rounded-[8px] grid place-items-center border border-transparent hover:border-[var(--line)]"
              style={{ color: "var(--ink-2)" }}
              title="Toggle theme"
            >
              {theme === "light" ? <Moon className="w-[17px] h-[17px]" /> : <Sun className="w-[17px] h-[17px]" />}
            </button>

            <button
              type="button"
              className="w-[34px] h-[34px] rounded-[8px] grid place-items-center relative"
              style={{ color: "var(--ink-2)" }}
              title="Notices"
            >
              <Bell className="w-[17px] h-[17px]" />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="px-4 md:px-6 pt-5 md:pt-6 pb-14 max-w-[1420px] w-full mx-auto">
          {(title || subtitle) && (
            <div className="mb-5">
              {subtitle && (
                <span className="block text-[9.5px] font-bold tracking-[0.18em] uppercase text-[var(--brand)] mb-1.5">
                  {subtitle}
                </span>
              )}
              {title && (
                <h1 className="font-heading text-[20px] md:text-[22px] text-[var(--ink)] leading-tight">
                  {title}
                </h1>
              )}
            </div>
          )}

          {children}
        </div>
      </div>
    </div>
  );
}