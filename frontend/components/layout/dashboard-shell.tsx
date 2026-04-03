"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowLeft,
  Bell,
  Building2,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Share2,
  Shield,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  useAuthStore,
  hasPermission,
  canAccessCaseModule,
  canAccessHealthModule,
  canAccessAdminModule,
  type AuthUser,
} from "@/store/authStore";
import * as authService from "@/services/modules/authService";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  visible: () => boolean;
};

function isNavActive(pathname: string, href: string) {
  if (href === "/health-support" || href === "/case-management") {
    return pathname === href || pathname === `${href}/`;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

const caseNav: NavItem[] = [
  {
    href: "/case-management",
    label: "Overview",
    icon: LayoutDashboard,
    visible: () =>
      hasPermission("dashboard:view") || hasPermission("case:read"),
  },
  {
    href: "/case-management/cases",
    label: "Cases",
    icon: Shield,
    visible: () => hasPermission("case:read"),
  },
  {
    href: "/case-management/referrals",
    label: "Referrals",
    icon: Share2,
    visible: () => hasPermission("case:read"),
  },
  {
    href: "/notifications",
    label: "Alerts",
    icon: Bell,
    visible: () => hasPermission("notifications:read"),
  },
];

const healthNav: NavItem[] = [
  {
    href: "/health-support",
    label: "Overview",
    icon: HeartPulse,
    visible: () => hasPermission("health:read"),
  },
  {
    href: "/health-support/vaccination",
    label: "Vaccination",
    icon: Bell,
    visible: () => hasPermission("health:read"),
  },
  {
    href: "/health-support/awareness",
    label: "Awareness",
    icon: Megaphone,
    visible: () => hasPermission("health:read"),
  },
  {
    href: "/health-support/directory",
    label: "Directory",
    icon: Building2,
    visible: () => hasPermission("health:read"),
  },
];

const adminNav: NavItem[] = [
  {
    href: "/admin/users",
    label: "Users",
    icon: Users,
    visible: () => hasPermission("users:read"),
  },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isModulePicker = pathname === "/modules";
  const isCaseModule =
    (pathname.startsWith("/case-management") ||
      pathname.startsWith("/notifications")) &&
    canAccessCaseModule();
  const isHealthModule =
    pathname.startsWith("/health-support") && canAccessHealthModule();
  const isAdminModule =
    pathname.startsWith("/admin") && canAccessAdminModule();

  useEffect(() => {
    if (!user) router.replace("/login");
  }, [user, router]);

  useEffect(() => {
    if (!user) return;
    if (pathname.startsWith("/case-management") && !canAccessCaseModule()) {
      router.replace("/modules");
    }
  }, [user, pathname, router]);

  useEffect(() => {
    if (!user) return;
    if (pathname.startsWith("/health-support") && !canAccessHealthModule()) {
      router.replace("/modules");
    }
  }, [user, pathname, router]);

  useEffect(() => {
    if (!user) return;
    if (pathname.startsWith("/admin") && !canAccessAdminModule()) {
      router.replace("/modules");
    }
  }, [user, pathname, router]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileNavOpen]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Activity className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  async function onLogout() {
    try {
      await authService.logout(refreshToken);
    } finally {
      clearSession();
      router.replace("/login");
    }
  }

  const sidebarNav = isModulePicker
    ? []
    : isCaseModule
      ? caseNav
      : isHealthModule
        ? healthNav
        : isAdminModule
          ? adminNav
          : [];

  const headerTitle = isModulePicker
    ? "Choose a workspace"
    : isCaseModule
      ? "Case reporting & management"
      : isHealthModule
        ? "Women’s health support"
        : isAdminModule
          ? "Administration"
          : "SafePath";

  const moduleLabel = isCaseModule
    ? "Cases"
    : isHealthModule
      ? "Health"
      : isAdminModule
        ? "Admin"
        : "App";

  const showSidebar = !isModulePicker && sidebarNav.length > 0;

  function SidebarNavLinks({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <nav className="flex flex-col gap-1">
        {sidebarNav
          .filter((n) => n.visible())
          .map((item) => {
            const active = isNavActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} onClick={onNavigate}>
                <span
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/20"
                      : "text-muted-foreground hover:bg-accent/80 hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </span>
              </Link>
            );
          })}
      </nav>
    );
  }

  function SidebarUserPanel({
    sessionUser,
    compact,
  }: {
    sessionUser: AuthUser;
    compact?: boolean;
  }) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-border/60 bg-background/60 p-3 text-xs",
          compact && "mt-auto"
        )}
      >
        <div className="font-medium">{sessionUser.fullName}</div>
        <div className="text-muted-foreground">{sessionUser.email}</div>
        <div className="mt-2 flex flex-wrap gap-1">
          {sessionUser.roles.slice(0, 3).map((r) => (
            <span
              key={r}
              className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide"
            >
              {r.replace("_", " ")}
            </span>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-3 w-full rounded-xl"
          onClick={() => void onLogout()}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-[radial-gradient(ellipse_120%_80%_at_50%_-30%,hsl(var(--primary)/0.07),transparent)]">
      {showSidebar && (
        <>
          {/* Desktop: fixed sidebar — does not scroll with page */}
          <aside
            className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-primary/10 bg-card/90 p-4 shadow-card backdrop-blur-xl md:flex"
            aria-label="Workspace navigation"
          >
            <div className="mb-6 shrink-0 px-2">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-[10px] font-bold text-primary-foreground">
                  SP
                </span>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    SafePath
                  </div>
                  <div className="text-base font-semibold tracking-tight">{moduleLabel}</div>
                </div>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <SidebarNavLinks />
            </div>
            <Separator className="my-4 shrink-0" />
            <div className="shrink-0">
              <SidebarUserPanel sessionUser={user} />
            </div>
          </aside>

          {/* Mobile overlay + drawer */}
          {mobileNavOpen && (
            <button
              type="button"
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              aria-label="Close menu"
              onClick={() => setMobileNavOpen(false)}
            />
          )}
          <aside
            className={cn(
              "fixed inset-y-0 left-0 z-50 flex w-[min(18rem,88vw)] max-w-full flex-col border-r border-primary/10 bg-card p-4 shadow-card transition-transform duration-200 ease-out md:hidden",
              mobileNavOpen
                ? "translate-x-0"
                : "-translate-x-full pointer-events-none"
            )}
            aria-hidden={!mobileNavOpen}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-[10px] font-bold text-primary-foreground">
                  SP
                </span>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    SafePath
                  </div>
                  <div className="text-base font-semibold">{moduleLabel}</div>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-xl"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <SidebarNavLinks onNavigate={() => setMobileNavOpen(false)} />
            </div>
            <Separator className="my-4 shrink-0" />
            <SidebarUserPanel sessionUser={user} compact />
          </aside>
        </>
      )}

      <div
        className={cn(
          "flex min-h-screen flex-col",
          showSidebar && "md:pl-64"
        )}
      >
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border/80 bg-background/80 px-4 py-3 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-background/75 md:px-8">
          <div className="flex min-w-0 items-center gap-2 md:gap-3">
            {showSidebar && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0 rounded-xl md:hidden"
                onClick={() => setMobileNavOpen(true)}
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            {!isModulePicker && (
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 rounded-xl"
                asChild
              >
                <Link href="/modules">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Workspaces</span>
                </Link>
              </Button>
            )}
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Modular monolith · RBAC
              </p>
              <h1 className="truncate text-lg font-semibold">{headerTitle}</h1>

            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            {isModulePicker && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => void onLogout()}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            )}
          </div>
        </header>
        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className={cn(
            "flex-1 px-4 py-6 md:px-8",
            isModulePicker && "max-w-6xl self-center"
          )}
        >
          {isModulePicker && (
            <div className="mb-6 md:hidden">
              <div className="rounded-2xl border border-border/60 bg-card/60 p-4 text-xs">
                <div className="font-medium">{user.fullName}</div>
                <div className="text-muted-foreground">{user.email}</div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full rounded-xl"
                  onClick={() => void onLogout()}
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </div>
            </div>
          )}
          {children}
        </motion.main>
      </div>
    </div>
  );
}
