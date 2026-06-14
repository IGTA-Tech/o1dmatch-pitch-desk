"use client";

import * as React from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

/**
 * Cycles light -> dark -> system on each click. Shows the icon for the CURRENT
 * effective theme so the user can see what they have selected.
 *
 * Avoids hydration mismatch by waiting for mount before showing the real icon.
 */
export function ModeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const cycle = React.useCallback(() => {
    setTheme(theme === "light" ? "dark" : theme === "dark" ? "system" : "light");
  }, [theme, setTheme]);

  const display = mounted ? theme : "system";
  const Icon =
    display === "system" ? Monitor : (mounted ? resolvedTheme : "light") === "dark" ? Moon : Sun;

  const label =
    display === "system"
      ? "Theme: system (click for light)"
      : display === "dark"
      ? "Theme: dark (click for system)"
      : "Theme: light (click for dark)";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycle}
      aria-label={label}
      title={label}
      className="size-9"
    >
      <Icon className="size-4" />
    </Button>
  );
}
