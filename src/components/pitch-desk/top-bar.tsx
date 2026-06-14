"use client";

import { UserButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { PanelLeft } from "lucide-react";
import { ModeToggle } from "./mode-toggle";
import { useSidebar } from "./app-sidebar";

interface RouteMeta {
  title: string;
  sub: string;
}

function getRouteMeta(pathname: string): RouteMeta {
  // Match longest prefix first
  if (pathname.startsWith("/dashboard/drafts"))
    return { title: "Drafts", sub: "Every generation, newest first" };
  if (pathname.startsWith("/dashboard/companies"))
    return { title: "Companies", sub: "All employer profiles" };
  if (pathname.startsWith("/dashboard/contacts"))
    return { title: "Contacts", sub: "Every contact across companies" };
  if (pathname.startsWith("/dashboard/activity"))
    return { title: "Activity", sub: "Audit log" };
  if (pathname.startsWith("/dashboard/settings"))
    return { title: "Settings", sub: "Dropdowns, senders, model routing" };
  return {
    title: "New draft",
    sub: "Paste employer research, pick a contact, generate copy-ready outreach",
  };
}

export function TopBar() {
  const { toggle } = useSidebar();
  const pathname = usePathname();
  const meta = getRouteMeta(pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          {/* Mobile sidebar toggle */}
          <button
            type="button"
            onClick={toggle}
            aria-label="Toggle sidebar"
            className="md:hidden flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <PanelLeft className="size-4" />
          </button>
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-semibold tracking-tight">{meta.title}</span>
            <span className="truncate text-[11px] text-muted-foreground">{meta.sub}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ModeToggle />
          <div className="ml-1 h-6 w-px bg-border" />
          <UserButton
            appearance={{ elements: { avatarBox: "size-8" } }}
            afterSignOutUrl="/sign-in"
          />
        </div>
      </div>
    </header>
  );
}
