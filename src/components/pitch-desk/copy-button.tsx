"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  /** The text to copy when clicked. */
  value: string | undefined | null;
  /** Human-readable name of the field, used in the success toast. */
  label?: string;
  /** Optional class names for the button. */
  className?: string;
  /** "icon" shows a small icon-only button; "inline" shows icon + text. */
  variant?: "icon" | "inline";
  /** Visual size of the button. */
  size?: "sm" | "default";
}

/**
 * Universal copy-to-clipboard button.
 *
 * Drop one anywhere a piece of output text appears. The button flips to a
 * green check for 1.5s on success and fires a Sonner toast.
 */
export function CopyButton({
  value,
  label = "text",
  className,
  variant = "icon",
  size = "sm",
}: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = React.useCallback(async () => {
    const text = String(value ?? "");
    if (!text.trim()) {
      toast.error("Nothing to copy yet.");
      return;
    }
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for non-secure contexts
        const el = document.createElement("textarea");
        el.value = text;
        el.setAttribute("readonly", "");
        el.style.position = "fixed";
        el.style.opacity = "0";
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      setCopied(true);
      toast.success(`Copied ${label}`);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy. Select and copy manually.");
    }
  }, [value, label]);

  if (variant === "inline") {
    return (
      <Button
        type="button"
        variant="outline"
        size={size}
        onClick={handleCopy}
        className={cn("gap-1.5", className)}
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        <span>{copied ? "Copied" : "Copy"}</span>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      className={cn("size-8", className)}
      aria-label={`Copy ${label}`}
      title={`Copy ${label}`}
    >
      {copied ? (
        <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
      ) : (
        <Copy className="size-4" />
      )}
    </Button>
  );
}
