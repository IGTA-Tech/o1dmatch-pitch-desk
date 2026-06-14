"use client";

import * as React from "react";
import { toast } from "sonner";
import { CompanyPanel } from "./company-panel";
import { ContactsPanel } from "./contacts-panel";
import { ControlsPanel } from "./controls-panel";
import { OutputsPanel } from "./outputs-panel";
import {
  emptyCompany,
  emptyContact,
  emptyControls,
  type CompanyDraft,
  type ContactDraft,
  type ControlsDraft,
} from "./types";
import { generateDraftAction } from "@/server/actions/generate-draft";
import type { PitchDeskOutput, GenerateInput } from "@/lib/ai/schema";
import type { PitchDeskSettings } from "@/server/actions/load-settings";

interface Props {
  settings: PitchDeskSettings;
  mockMode: boolean;
}

export function PitchDesk({ settings, mockMode }: Props) {
  const [company, setCompany] = React.useState<CompanyDraft>(emptyCompany());
  const [contacts, setContacts] = React.useState<ContactDraft[]>([emptyContact()]);
  const [selectedContact, setSelectedContact] = React.useState(0);
  const [controls, setControls] = React.useState<ControlsDraft>(() => ({
    ...emptyControls(),
    sender: settings.senders[0] ?? "",
    pitch_type: Object.keys(settings.pitchMap)[0] ?? "",
    sub_pitch: Object.values(settings.pitchMap)[0]?.[0] ?? "",
    product_offer: settings.productOffers[0] ?? "",
    tone: settings.tones[0] ?? "",
    goal: settings.goals[0] ?? "",
  }));

  const [output, setOutput] = React.useState<PitchDeskOutput | null>(null);
  const [meta, setMeta] = React.useState<{ modelUsed: string; fellBack: boolean } | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);

  const buildInput = React.useCallback(
    (index: number, mode: "primary" | "bulk"): GenerateInput => {
      const target = contacts[index] ?? emptyContact();
      return {
        company,
        contact: target,
        allContacts: contacts.map((c) => ({
          contact_name: c.contact_name,
          contact_title: c.contact_title,
          contact_email: c.contact_email,
          contact_type: c.contact_type,
        })),
        controls,
        strategyNotes: company.company_strategy_notes,
        mode,
      };
    },
    [company, contacts, controls],
  );

  const runOne = React.useCallback(
    async (index: number, mode: "primary" | "bulk" = "primary") => {
      if (!company.company_name.trim()) {
        toast.error("Add a company name first.");
        return;
      }
      const target = contacts[index];
      if (!target?.contact_name.trim()) {
        toast.error("The selected contact needs a name.");
        return;
      }
      setIsGenerating(true);
      try {
        const result = await generateDraftAction(buildInput(index, mode));
        if (!result.ok || !result.output) {
          toast.error(result.error ?? "Generation failed.");
          return;
        }
        setOutput(result.output);
        setMeta({ modelUsed: result.meta?.modelUsed ?? "unknown", fellBack: !!result.meta?.fellBack });
        toast.success(
          result.sheetMirror?.ok === false
            ? "Draft saved. Sheet mirror failed - check logs."
            : "Draft generated and saved.",
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        toast.error(msg);
      } finally {
        setIsGenerating(false);
      }
    },
    [company.company_name, contacts, buildInput],
  );

  const runAll = React.useCallback(async () => {
    if (!company.company_name.trim()) {
      toast.error("Add a company name first.");
      return;
    }
    const valid = contacts.filter((c) => c.contact_name.trim());
    if (valid.length === 0) {
      toast.error("Add at least one contact with a name.");
      return;
    }
    setIsGenerating(true);
    try {
      for (let i = 0; i < contacts.length; i++) {
        if (!contacts[i].contact_name.trim()) continue;
        const result = await generateDraftAction(buildInput(i, "bulk"));
        if (!result.ok || !result.output) {
          toast.error(`Contact ${i + 1}: ${result.error ?? "failed"}`);
          continue;
        }
        // Show the LAST one in the panel; all are saved to DB + Sheet.
        if (i === contacts.length - 1) {
          setOutput(result.output);
          setMeta({
            modelUsed: result.meta?.modelUsed ?? "unknown",
            fellBack: !!result.meta?.fellBack,
          });
        }
      }
      toast.success(`Generated ${valid.length} drafts.`);
    } finally {
      setIsGenerating(false);
    }
  }, [company.company_name, contacts, buildInput]);

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-6 md:py-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          <CompanyPanel
            value={company}
            onChange={setCompany}
            onClear={() => setCompany(emptyCompany())}
          />
          <ContactsPanel
            contacts={contacts}
            selectedIndex={selectedContact}
            onChange={setContacts}
            onSelect={setSelectedContact}
            contactTypes={settings.contactTypes}
          />
        </div>

        <div className="lg:col-span-3 xl:col-span-3">
          <ControlsPanel
            value={controls}
            onChange={setControls}
            pitchMap={settings.pitchMap}
            senders={settings.senders}
            productOffers={settings.productOffers}
            tones={settings.tones}
            goals={settings.goals}
            isGenerating={isGenerating}
            mockMode={mockMode}
            onGenerateSelected={() => runOne(selectedContact, "primary")}
            onGenerateAll={runAll}
          />
        </div>

        <div className="lg:col-span-4 xl:col-span-5">
          <OutputsPanel
            output={output}
            isGenerating={isGenerating}
            modelUsed={meta?.modelUsed}
            fellBack={meta?.fellBack}
          />
        </div>
      </div>
    </div>
  );
}
