"use client";

import { UserButton } from "@clerk/nextjs";
import { PanelLeft } from "lucide-react";
import { ModeToggle } from "./mode-toggle";
import { useSidebar } from "./app-sidebar";

export function TopBar() {
  const { toggle } = useSidebar();
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          {/* Mobile sidebar toggle */}
          <button
            type="button"
            onClick={toggle}
            aria-label="Toggle sidebar"
            className="md:hidden flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <PanelLeft className="size-4" />
          </button>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight">New draft</span>
            <span className="text-[11px] text-muted-foreground">
              Paste employer research, pick a contact, generate copy-ready outreach
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
