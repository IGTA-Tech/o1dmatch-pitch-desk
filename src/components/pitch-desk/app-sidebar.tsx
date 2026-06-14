"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Building2,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "New draft", icon: Sparkles },
  { href: "/dashboard/drafts", label: "Drafts", icon: FileText },
  { href: "/dashboard/companies", label: "Companies", icon: Building2 },
  { href: "/dashboard/contacts", label: "Contacts", icon: Users },
  { href: "/dashboard/activity", label: "Activity", icon: Activity },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const STORAGE_KEY = "o1d-sidebar-collapsed";

interface SidebarContextValue {
  collapsed: boolean;
  toggle: () => void;
  setCollapsed: (v: boolean) => void;
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

export function useSidebar() {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used inside <SidebarProvider>");
  return ctx;
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  // Default to expanded on first render; localStorage hydrates after mount to avoid SSR mismatch.
  const [collapsed, setCollapsedState] = React.useState(false);

  React.useEffect(() => {
    try {
      const v = window.localStorage.getItem(STORAGE_KEY);
      if (v === "1") setCollapsedState(true);
    } catch {}
  }, []);

  const setCollapsed = React.useCallback((v: boolean) => {
    setCollapsedState(v);
    try {
      window.localStorage.setItem(STORAGE_KEY, v ? "1" : "0");
    } catch {}
  }, []);

  const toggle = React.useCallback(() => setCollapsed(!collapsed), [collapsed, setCollapsed]);

  return (
    <SidebarContext.Provider value={{ collapsed, toggle, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function AppSidebar() {
  const { collapsed, toggle } = useSidebar();
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "sticky top-0 z-20 hidden h-svh shrink-0 border-r border-border bg-background transition-[width] duration-200 ease-in-out md:flex md:flex-col",
        collapsed ? "w-14" : "w-56",
      )}
    >
      {/* Brand */}
      <div
        className={cn(
          "flex h-14 items-center border-b border-border",
          collapsed ? "justify-center px-2" : "gap-2.5 px-4",
        )}
      >
        <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <span className="text-[11px] font-bold tracking-tight">O1</span>
        </div>
        {!collapsed ? (
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight">Pitch Desk</span>
            <span className="text-[10px] text-muted-foreground">O1DMatch</span>
          </div>
        ) : null}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            // /dashboard is an exact match only (otherwise it would light up on
            // every sub-route). Everything else lights up on prefix match so
            // /dashboard/drafts/abc highlights the Drafts item.
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname === item.href || pathname.startsWith(item.href + "/");
            const Content = (
              <span
                className={cn(
                  "flex items-center rounded-md text-sm font-medium transition-colors",
                  collapsed ? "h-9 w-9 justify-center" : "h-9 w-full gap-2.5 px-2.5",
                  active
                    ? "bg-accent text-accent-foreground"
                    : item.disabled
                    ? "text-muted-foreground/60"
                    : "text-foreground hover:bg-accent hover:text-accent-foreground",
                  item.disabled && "cursor-not-allowed",
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="size-4 shrink-0" />
                {!collapsed ? (
                  <>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.disabled ? (
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground/70">
                        soon
                      </span>
                    ) : null}
                  </>
                ) : null}
              </span>
            );

            return (
              <li key={item.href}>
                {item.disabled ? (
                  <div aria-disabled="true">{Content}</div>
                ) : (
                  <Link href={item.href}>{Content}</Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse toggle */}
      <div
        className={cn(
          "border-t border-border p-2",
          collapsed ? "flex justify-center" : "flex justify-end",
        )}
      >
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
