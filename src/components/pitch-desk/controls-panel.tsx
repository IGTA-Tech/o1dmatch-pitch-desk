"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field } from "./field";
import type { ControlsDraft } from "./types";
import { Sparkles, Layers, FlaskConical } from "lucide-react";

interface Props {
  value: ControlsDraft;
  onChange: (next: ControlsDraft) => void;
  pitchMap: Record<string, string[]>;
  senders: string[];
  productOffers: string[];
  tones: string[];
  goals: string[];
  isGenerating: boolean;
  mockMode: boolean;
  onGenerateSelected: () => void;
  onGenerateAll: () => void;
}

export function ControlsPanel({
  value,
  onChange,
  pitchMap,
  senders,
  productOffers,
  tones,
  goals,
  isGenerating,
  mockMode,
  onGenerateSelected,
  onGenerateAll,
}: Props) {
  const set = <K extends keyof ControlsDraft>(key: K, v: ControlsDraft[K]) =>
    onChange({ ...value, [key]: v });

  const pitchTypes = useMemo(() => Object.keys(pitchMap), [pitchMap]);
  const subPitches = useMemo(() => pitchMap[value.pitch_type] ?? [], [pitchMap, value.pitch_type]);

  const showCustomPitch = value.sub_pitch === "Other / custom";
  const showCustomOffer = value.product_offer === "Custom";
  const showCustomGoal = value.goal === "Custom";

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>3. Campaign controls</CardTitle>
          <CardDescription>
            Sub-pitch overrides pitch type. Custom notes override presets.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field label="Sender">
          <Select value={value.sender} onValueChange={(v) => set("sender", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Pick a sender" />
            </SelectTrigger>
            <SelectContent>
              {senders.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Pitch type">
          <Select
            value={value.pitch_type}
            onValueChange={(v) => {
              const subs = pitchMap[v] ?? [];
              onChange({ ...value, pitch_type: v, sub_pitch: subs[0] ?? "" });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pick a pitch type" />
            </SelectTrigger>
            <SelectContent>
              {pitchTypes.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Sub-pitch">
          <Select
            value={value.sub_pitch}
            onValueChange={(v) => set("sub_pitch", v)}
            disabled={subPitches.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pick a sub-pitch" />
            </SelectTrigger>
            <SelectContent>
              {subPitches.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {showCustomPitch ? (
          <Field
            label="Custom sub-pitch notes"
            hint="Used when 'Other / custom' is selected. The model follows this over presets."
          >
            <Textarea
              rows={3}
              value={value.custom_pitch_notes}
              onChange={(e) => set("custom_pitch_notes", e.target.value)}
            />
          </Field>
        ) : null}

        <Field label="Product / offer">
          <Select value={value.product_offer} onValueChange={(v) => set("product_offer", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Pick an offer" />
            </SelectTrigger>
            <SelectContent>
              {productOffers.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {showCustomOffer ? (
          <Field label="Custom offer notes">
            <Textarea
              rows={2}
              value={value.custom_offer_notes}
              onChange={(e) => set("custom_offer_notes", e.target.value)}
            />
          </Field>
        ) : null}

        <Field label="Tone">
          <Select value={value.tone} onValueChange={(v) => set("tone", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Pick a tone" />
            </SelectTrigger>
            <SelectContent>
              {tones.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Goal">
          <Select value={value.goal} onValueChange={(v) => set("goal", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Pick a goal" />
            </SelectTrigger>
            <SelectContent>
              {goals.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {showCustomGoal ? (
          <Field label="Custom goal notes">
            <Textarea
              rows={2}
              value={value.custom_goal_notes}
              onChange={(e) => set("custom_goal_notes", e.target.value)}
            />
          </Field>
        ) : null}

        <div className="space-y-2 pt-1">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={value.includeSignoff}
              onChange={(e) => set("includeSignoff", e.target.checked)}
              className="size-4 rounded border-border"
            />
            Include signoff
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={value.saveToSheet}
              onChange={(e) => set("saveToSheet", e.target.checked)}
              className="size-4 rounded border-border"
            />
            Mirror to Google Sheet
          </label>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Button onClick={onGenerateSelected} disabled={isGenerating} className="w-full">
            <Sparkles className="size-4" />
            {isGenerating ? "Generating..." : "Generate for selected contact"}
          </Button>
          <Button
            onClick={onGenerateAll}
            disabled={isGenerating}
            variant="outline"
            className="w-full"
          >
            <Layers className="size-4" />
            Generate for all contacts
          </Button>
          {mockMode ? (
            <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <FlaskConical className="size-3.5" />
              Mock mode is on. No live API calls.
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
