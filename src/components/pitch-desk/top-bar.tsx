"use client";

import { UserButton } from "@clerk/nextjs";
import { ModeToggle } from "./mode-toggle";

export function TopBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <span className="text-[11px] font-bold tracking-tight">O1</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight">O1DMatch Pitch Desk</span>
            <span className="text-[11px] text-muted-foreground">
              Internal outreach generator
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <div className="ml-1 h-6 w-px bg-border" />
          <UserButton
            appearance={{
              elements: {
                avatarBox: "size-8",
              },
            }}
            afterSignOutUrl="/sign-in"
          />
        </div>
      </div>
    </header>
  );
}
