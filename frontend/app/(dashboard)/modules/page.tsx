"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ClipboardList,
  HeartPulse,
  LayoutGrid,
  Settings2,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  useAuthStore,
  canAccessCaseModule,
  canAccessHealthModule,
  canAccessAdminModule,
} from "@/store/authStore";
import { cn } from "@/lib/utils";

const MODULES = [
  {
    id: "case",
    title: "Case reporting & management",
    subtitle: "Intake, assignments, referrals, and analytics.",
    href: "/case-management",
    icon: ClipboardList,
    accent: "from-primary/25 via-primary/10 to-transparent",
    iconBg: "bg-primary text-primary-foreground shadow-md shadow-primary/25",
    ring: "ring-primary/20 hover:ring-primary/35",
    canEnter: canAccessCaseModule,
    featured: true,
  },
  {
    id: "health",
    title: "Women’s health support",
    subtitle: "Vaccination, awareness, and service directory.",
    href: "/health-support",
    icon: HeartPulse,
    accent: "from-brand-blue/30 via-brand-blue/10 to-transparent",
    iconBg: "bg-brand-blue text-white shadow-md shadow-brand-blue/20",
    ring: "ring-brand-blue/15 hover:ring-brand-blue/30",
    canEnter: canAccessHealthModule,
    featured: false,
  },
  {
    id: "admin",
    title: "Administration",
    subtitle: "Users, roles, and access control.",
    href: "/admin/users",
    icon: Settings2,
    accent: "from-foreground/15 via-muted/40 to-transparent",
    iconBg: "bg-foreground/90 text-background shadow-lg",
    ring: "ring-foreground/10 hover:ring-foreground/20",
    canEnter: canAccessAdminModule,
    featured: false,
  },
] as const;

export default function ModulesPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="relative mx-auto max-w-5xl space-y-10 pb-8">
      <div
        className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-72 max-w-3xl rounded-[40%] bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.12),transparent_65%)] blur-2xl"
        aria-hidden
      />

      <header className="relative space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card/80 px-3 py-1 text-xs font-medium backdrop-blur-sm">
            <LayoutGrid className="h-3.5 w-3.5 text-primary" />
            Workspaces
          </span>
          <span className="inline-flex items-center gap-1 text-xs">
            <Sparkles className="h-3.5 w-3.5 text-brand-blue" />
            Signed in as {user?.fullName}
          </span>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Where do you want to work?</h1>
          <p className="max-w-2xl text-base text-muted-foreground">
            Each module opens its own navigation and tools. Pick one to continue.
          </p>
        </div>
      </header>

      <div className="relative grid gap-5 md:grid-cols-2">
        {MODULES.map((m, i) => {
          const Icon = m.icon;
          const allowed = m.canEnter();
          return (
            <motion.div
              key={m.id}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, type: "spring", stiffness: 320, damping: 28 }}
              className={cn(m.featured && "md:col-span-2")}
            >
              <Card
                className={cn(
                  "group relative h-full overflow-hidden border-border/70 bg-card/70 shadow-sm backdrop-blur-md transition-all duration-300",
                  allowed
                    ? cn("hover:-translate-y-0.5 hover:shadow-card", m.ring)
                    : "opacity-50 grayscale-[0.3]"
                )}
              >
                <div
                  className={cn(
                    "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-90 transition-opacity group-hover:opacity-100",
                    m.accent
                  )}
                />
                <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-start sm:justify-between sm:p-8">
                  <div className="flex gap-5">
                    <div
                      className={cn(
                        "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105 sm:h-16 sm:w-16 sm:rounded-3xl",
                        m.iconBg
                      )}
                    >
                      <Icon className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0 space-y-2">
                      <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{m.title}</h2>
                      <p className="text-sm leading-relaxed text-muted-foreground">{m.subtitle}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                    {allowed ? (
                      <Button
                        asChild
                        size="lg"
                        className="rounded-2xl px-6 font-medium shadow-soft"
                      >
                        <Link href={m.href} className="gap-2">
                          Enter module
                          <ArrowUpRight className="h-4 w-4 opacity-80" />
                        </Link>
                      </Button>
                    ) : (
                      <p className="rounded-xl border border-dashed border-border/80 bg-muted/30 px-4 py-3 text-center text-xs text-muted-foreground sm:text-right">
                        No access for your current role.
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
