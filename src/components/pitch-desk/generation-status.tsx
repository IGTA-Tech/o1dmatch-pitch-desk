"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

export interface BulkProgress {
  current: number;
  total: number;
  contactName: string;
}

interface Props {
  isGenerating: boolean;
  modelHint?: string;
  bulkProgress?: BulkProgress | null;
}

const STATUS_MESSAGES = [
  "Reading your input",
  "Calling the model",
  "Generating drafts",
  "Running quality checks",
  "Almost done",
  "Still working on it",
];

/**
 * Animated progress strip that lives at the top of the OutputsPanel during
 * generation. Three signals layered together:
 *   1. Indeterminate CSS-only sweeping bar  -> "something is happening"
 *   2. Cycling status text                  -> "this is the phase we're in"
 *   3. Elapsed seconds                      -> "how long it's been"
 * Plus a separate bulk-progress line ("Generating for X of Y") when the user
 * fired the "Generate for all contacts" button.
 */
export function GenerationStatus({ isGenerating, modelHint, bulkProgress }: Props) {
  const [elapsed, setElapsed] = React.useState(0);
  const [phase, setPhase] = React.useState(0);

  React.useEffect(() => {
    if (!isGenerating) {
      setElapsed(0);
      setPhase(0);
      return;
    }
    const startedAt = Date.now();
    const tick = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 250);
    const cycle = window.setInterval(() => {
      setPhase((p) => Math.min(p + 1, STATUS_MESSAGES.length - 1));
    }, 3500);
    return () => {
      window.clearInterval(tick);
      window.clearInterval(cycle);
    };
  }, [isGenerating]);

  if (!isGenerating) return null;

  const message = STATUS_MESSAGES[Math.min(phase, STATUS_MESSAGES.length - 1)];

  return (
    <div className="border-b border-border/60 px-5 py-3">
      <div className="progress-track">
        <div className="progress-indicator" />
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 text-xs">
        <div className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
          <Loader2 className="size-3 shrink-0 animate-spin" />
          {bulkProgress ? (
            <span className="truncate">
              Generating for{" "}
              <span className="font-medium text-foreground">{bulkProgress.contactName}</span>{" "}
              <span className="tabular-nums">
                ({bulkProgress.current} of {bulkProgress.total})
              </span>
            </span>
          ) : (
            <span className="truncate">
              {message}
              {modelHint ? (
                <span className="ml-1 font-mono text-muted-foreground/70">
                  ({modelHint})
                </span>
              ) : null}
            </span>
          )}
        </div>
        <span className="shrink-0 font-mono tabular-nums text-muted-foreground">
          {elapsed}s
        </span>
      </div>
    </div>
  );
}
