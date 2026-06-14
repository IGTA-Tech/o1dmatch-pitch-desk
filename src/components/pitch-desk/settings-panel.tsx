"use client";

import * as React from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Layers,
  Plus,
  Save,
  Sliders,
  Target,
  UserCircle2,
  Users,
  Wand2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  addSetting,
  toggleSettingActive,
  updatePitchSubPitches,
} from "@/server/actions/settings-admin";
import type {
  AllSettings,
  PitchSetting,
  SimpleSetting,
} from "@/server/repos/settings-admin";

interface Props {
  data: AllSettings;
  models: {
    primary: string;
    bulk: string;
    fallback: string;
    mockMode: boolean;
  };
}

export function SettingsPanel({ data, models }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <Tabs defaultValue="senders" className="w-full">
        <div className="overflow-x-auto border-b border-border/60 px-4 py-3">
          <TabsList className="w-max">
            <TabsTrigger value="senders">
              <Users />
              Senders
              <CountChip n={data.senders.length} />
            </TabsTrigger>
            <TabsTrigger value="pitches">
              <Sliders />
              Pitches
              <CountChip n={data.pitchTypes.length} />
            </TabsTrigger>
            <TabsTrigger value="offers">
              <Layers />
              Offers
              <CountChip n={data.productOffers.length} />
            </TabsTrigger>
            <TabsTrigger value="tones">
              <Wand2 />
              Tones
              <CountChip n={data.tones.length} />
            </TabsTrigger>
            <TabsTrigger value="goals">
              <Target />
              Goals
              <CountChip n={data.goals.length} />
            </TabsTrigger>
            <TabsTrigger value="contact_types">
              <UserCircle2 />
              Contact types
              <CountChip n={data.contactTypes.length} />
            </TabsTrigger>
            <TabsTrigger value="models">
              <Sliders />
              Models
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="senders" className="mt-0 p-5">
          <SimpleList
            type="sender"
            label="sender"
            description="People who can be picked as the From in a draft. Custom typed names also work on the form."
            entries={data.senders}
          />
        </TabsContent>

        <TabsContent value="pitches" className="mt-0 p-5">
          <PitchList entries={data.pitchTypes} />
        </TabsContent>

        <TabsContent value="offers" className="mt-0 p-5">
          <SimpleList
            type="product_offer"
            label="offer"
            description="What you are pitching at the CTA. Maps directly to the Product / Offer dropdown."
            entries={data.productOffers}
          />
        </TabsContent>

        <TabsContent value="tones" className="mt-0 p-5">
          <SimpleList
            type="tone"
            label="tone"
            description="Voice of the email. Used by the AI as a style hint."
            entries={data.tones}
          />
        </TabsContent>

        <TabsContent value="goals" className="mt-0 p-5">
          <SimpleList
            type="goal"
            label="goal"
            description="The single CTA the email is asking for."
            entries={data.goals}
          />
        </TabsContent>

        <TabsContent value="contact_types" className="mt-0 p-5">
          <SimpleList
            type="contact_type"
            label="contact type"
            description="The role of the recipient. Drives the AI's choice of wording per contact."
            entries={data.contactTypes}
          />
        </TabsContent>

        <TabsContent value="models" className="mt-0 p-5">
          <ModelsView models={models} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CountChip({ n }: { n: number }) {
  return (
    <span className="ml-1 rounded bg-muted px-1.5 py-px text-[10px] font-medium tabular-nums text-muted-foreground">
      {n}
    </span>
  );
}

/* ---------- Simple list (senders, offers, tones, goals, contact types) ---------- */

function SimpleList({
  type,
  label,
  description,
  entries,
}: {
  type: string;
  label: string;
  description: string;
  entries: SimpleSetting[];
}) {
  const [adding, setAdding] = React.useState(false);
  const [newKey, setNewKey] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  const handleAdd = () => {
    const key = newKey.trim();
    if (!key) return;
    startTransition(async () => {
      const r = await addSetting({ type, key });
      if (r.ok) {
        toast.success(`Added ${label} "${key}"`);
        setNewKey("");
        setAdding(false);
      } else {
        toast.error(r.error ?? "Failed to add");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">{description}</p>
        {!adding ? (
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus className="size-3.5" />
            Add {label}
          </Button>
        ) : null}
      </div>

      {adding ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              autoFocus
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAdd();
                } else if (e.key === "Escape") {
                  setAdding(false);
                  setNewKey("");
                }
              }}
              placeholder={`New ${label} name`}
              className="min-w-[260px] flex-1"
            />
            <Button size="sm" onClick={handleAdd} disabled={pending || !newKey.trim()}>
              <Save className="size-3.5" />
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setAdding(false);
                setNewKey("");
              }}
              disabled={pending}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
        {entries.map((e) => (
          <SettingRow key={e.id} entry={e} />
        ))}
        {entries.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-muted-foreground">
            No {label}s yet. Click "Add {label}" to create one.
          </li>
        ) : null}
      </ul>
    </div>
  );
}

function SettingRow({ entry }: { entry: SimpleSetting }) {
  const [pending, startTransition] = React.useTransition();
  const [active, setActive] = React.useState(entry.active);

  const handleToggle = () => {
    const next = !active;
    setActive(next); // optimistic
    startTransition(async () => {
      const r = await toggleSettingActive(entry.id);
      if (!r.ok) {
        setActive(!next); // revert
        toast.error(r.error ?? "Failed to toggle");
      }
    });
  };

  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3">
      <span className={cn("truncate text-sm", !active && "text-muted-foreground line-through")}>
        {entry.key}
      </span>
      <button
        type="button"
        onClick={handleToggle}
        disabled={pending}
        className={cn(
          "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider transition-colors",
          active
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:border-emerald-500/60"
            : "border-border bg-muted text-muted-foreground hover:bg-muted/70",
        )}
        aria-label={active ? "Disable entry" : "Enable entry"}
      >
        {active ? <Check className="size-3" /> : null}
        {active ? "Active" : "Disabled"}
      </button>
    </li>
  );
}

/* ---------- Pitch list (with sub-pitches editor) ---------- */

function PitchList({ entries }: { entries: PitchSetting[] }) {
  const [adding, setAdding] = React.useState(false);
  const [name, setName] = React.useState("");
  const [subs, setSubs] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  const handleAdd = () => {
    const key = name.trim();
    const subPitches = subs.split("\n").map((s) => s.trim()).filter(Boolean);
    if (!key) {
      toast.error("Pitch name is required");
      return;
    }
    if (subPitches.length === 0) {
      toast.error("At least one sub-pitch is required");
      return;
    }
    startTransition(async () => {
      const r = await addSetting({ type: "pitch_type", key, subPitches });
      if (r.ok) {
        toast.success(`Added pitch type "${key}"`);
        setName("");
        setSubs("");
        setAdding(false);
      } else {
        toast.error(r.error ?? "Failed to add");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Pitch types drive the AI's market context. Each has its own list of sub-pitches that
          map to specific arguments. "Other / custom" is added automatically as an escape hatch.
        </p>
        {!adding ? (
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus className="size-3.5" />
            Add pitch type
          </Button>
        ) : null}
      </div>

      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-2.5 text-xs text-amber-700 dark:text-amber-300">
        Heads up: the AI prompt has detailed instructions for each existing pitch type. New types
        you add here work in the dropdown but produce less specific output until you also add
        guidance in <span className="font-mono">src/lib/ai/system-prompt.ts</span>.
      </div>

      {adding ? (
        <div className="space-y-3 rounded-lg border border-dashed border-border bg-muted/30 p-4">
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Pitch type name (e.g. Renewables / Climate Tech)"
          />
          <Textarea
            rows={5}
            value={subs}
            onChange={(e) => setSubs(e.target.value)}
            placeholder={"Sub-pitches, one per line\nExample:\nGrid-scale storage talent\nWind / solar PM hiring\nPolicy / regulatory recruiter angle"}
          />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={pending || !name.trim() || !subs.trim()}
            >
              <Save className="size-3.5" />
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setAdding(false);
                setName("");
                setSubs("");
              }}
              disabled={pending}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
        {entries.map((e) => (
          <PitchRow key={e.id} entry={e} />
        ))}
        {entries.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-muted-foreground">
            No pitch types yet.
          </li>
        ) : null}
      </ul>
    </div>
  );
}

function PitchRow({ entry }: { entry: PitchSetting }) {
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(entry.active);
  const [editing, setEditing] = React.useState(false);
  const [subsText, setSubsText] = React.useState(entry.subPitches.join("\n"));
  const [pending, startTransition] = React.useTransition();
  const [togglePending, startToggle] = React.useTransition();

  const handleToggle = () => {
    const next = !active;
    setActive(next);
    startToggle(async () => {
      const r = await toggleSettingActive(entry.id);
      if (!r.ok) {
        setActive(!next);
        toast.error(r.error ?? "Failed to toggle");
      }
    });
  };

  const handleSaveSubs = () => {
    const list = subsText.split("\n").map((s) => s.trim()).filter(Boolean);
    if (list.length === 0) {
      toast.error("At least one sub-pitch is required");
      return;
    }
    startTransition(async () => {
      const r = await updatePitchSubPitches({ id: entry.id, subPitches: list });
      if (r.ok) {
        toast.success("Sub-pitches updated");
        setEditing(false);
      } else {
        toast.error(r.error ?? "Failed to save");
      }
    });
  };

  return (
    <li className="px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          {open ? (
            <ChevronUp className="size-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
          )}
          <span className={cn("truncate text-sm font-medium", !active && "text-muted-foreground line-through")}>
            {entry.key}
          </span>
          <Badge variant="secondary" className="shrink-0 tabular-nums">
            {entry.subPitches.length}
          </Badge>
        </button>
        <button
          type="button"
          onClick={handleToggle}
          disabled={togglePending}
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider transition-colors",
            active
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border-border bg-muted text-muted-foreground",
          )}
        >
          {active ? <Check className="size-3" /> : null}
          {active ? "Active" : "Disabled"}
        </button>
      </div>

      {open ? (
        <div className="mt-3 ml-5 space-y-2">
          {editing ? (
            <div className="space-y-2">
              <Textarea
                rows={Math.max(5, entry.subPitches.length + 2)}
                value={subsText}
                onChange={(e) => setSubsText(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleSaveSubs} disabled={pending}>
                  <Save className="size-3.5" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditing(false);
                    setSubsText(entry.subPitches.join("\n"));
                  }}
                  disabled={pending}
                >
                  Cancel
                </Button>
                <p className="text-xs text-muted-foreground">
                  One sub-pitch per line. "Other / custom" auto-added.
                </p>
              </div>
            </div>
          ) : (
            <>
              <ul className="space-y-0.5 text-sm text-muted-foreground">
                {entry.subPitches.map((s, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="text-muted-foreground/50">-</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                Edit sub-pitches
              </Button>
            </>
          )}
        </div>
      ) : null}
    </li>
  );
}

/* ---------- Models (read-only) ---------- */

function ModelsView({
  models,
}: {
  models: { primary: string; bulk: string; fallback: string; mockMode: boolean };
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          Model routing is controlled by environment variables and applied on dev-server start.
          Change <span className="font-mono">.env.local</span> and restart to swap models.
        </p>
        {models.mockMode ? (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
            BETA_MOCK_MODE is on - generation returns canned mock output and never calls OpenRouter.
          </div>
        ) : null}
      </div>

      <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
        <ModelRow
          slot="Primary"
          model={models.primary}
          envName="AI_MODEL_PRIMARY"
          description="Default for every generation. Picked for IFBench / instruction-following."
        />
        <ModelRow
          slot="Bulk"
          model={models.bulk}
          envName="AI_MODEL_BULK"
          description='Used when "Generate for all contacts" is clicked. Cheapest viable option.'
        />
        <ModelRow
          slot="Fallback"
          model={models.fallback}
          envName="AI_MODEL_FALLBACK"
          description="Automatically retried when the primary errors or returns invalid JSON."
        />
      </ul>
    </div>
  );
}

function ModelRow({
  slot,
  model,
  envName,
  description,
}: {
  slot: string;
  model: string;
  envName: string;
  description: string;
}) {
  return (
    <li className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{slot}</span>
          <Separator orientation="vertical" className="h-3" />
          <span className="font-mono text-xs text-muted-foreground">{envName}</span>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{description}</p>
      </div>
      <Badge variant="outline" className="self-start font-mono text-[11px] normal-case sm:self-center">
        {model}
      </Badge>
    </li>
  );
}
