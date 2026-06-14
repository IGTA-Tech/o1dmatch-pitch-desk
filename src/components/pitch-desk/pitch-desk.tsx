"use client";

import * as React from "react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
import { Building2, Sliders, Users } from "lucide-react";

interface Props {
  settings: PitchDeskSettings;
  mockMode: boolean;
}

export function PitchDesk({ settings, mockMode }: Props) {
  const [company, setCompany] = React.useState<CompanyDraft>(emptyCompany());
  const [contacts, setContacts] = React.useState<ContactDraft[]>([emptyContact()]);
  const [selectedContact, setSelectedContact] = React.useState(0);
  const [activeTab, setActiveTab] = React.useState<"company" | "contacts" | "controls">("company");

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
        setActiveTab("company");
        return;
      }
      const target = contacts[index];
      if (!target?.contact_name.trim()) {
        toast.error("The selected contact needs a name.");
        setActiveTab("contacts");
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
        setMeta({
          modelUsed: result.meta?.modelUsed ?? "unknown",
          fellBack: !!result.meta?.fellBack,
        });
        toast.success(
          result.sheetMirror?.ok === false
            ? "Draft saved. Sheet mirror failed - check logs."
            : "Draft generated and saved.",
        );
      } catch (err) {
        toast.error(err instanceof Error ? err.message : String(err));
      } finally {
        setIsGenerating(false);
      }
    },
    [company.company_name, contacts, buildInput],
  );

  const runAll = React.useCallback(async () => {
    if (!company.company_name.trim()) {
      toast.error("Add a company name first.");
      setActiveTab("company");
      return;
    }
    const valid = contacts.filter((c) => c.contact_name.trim());
    if (valid.length === 0) {
      toast.error("Add at least one contact with a name.");
      setActiveTab("contacts");
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

  // Step indicators on each tab
  const companyReady = company.company_name.trim().length > 0;
  const contactsReady = contacts.some((c) => c.contact_name.trim().length > 0);
  const controlsReady =
    controls.sender.trim().length > 0 && controls.pitch_type.length > 0 && controls.goal.length > 0;

  return (
    <div className="grid grid-cols-1 gap-6 px-4 py-6 md:px-6 md:py-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      {/* Left: input tabs */}
      <section className="min-w-0">
        <div className="rounded-xl border border-border bg-card">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as typeof activeTab)}
            className="w-full"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
              <TabsList>
                <TabsTrigger value="company">
                  <Building2 />
                  Company
                  <StepDot done={companyReady} />
                </TabsTrigger>
                <TabsTrigger value="contacts">
                  <Users />
                  Contacts
                  <StepDot done={contactsReady} />
                </TabsTrigger>
                <TabsTrigger value="controls">
                  <Sliders />
                  Campaign
                  <StepDot done={controlsReady} />
                </TabsTrigger>
              </TabsList>
              {mockMode ? (
                <Badge variant="warning" className="text-[10px] uppercase">
                  Mock mode
                </Badge>
              ) : null}
            </div>

            <TabsContent value="company" className="mt-0 p-5">
              <CompanyPanel
                value={company}
                onChange={setCompany}
                onClear={() => setCompany(emptyCompany())}
              />
            </TabsContent>

            <TabsContent value="contacts" className="mt-0 p-5">
              <ContactsPanel
                contacts={contacts}
                selectedIndex={selectedContact}
                onChange={setContacts}
                onSelect={setSelectedContact}
                contactTypes={settings.contactTypes}
              />
            </TabsContent>

            <TabsContent value="controls" className="mt-0 p-5">
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
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Right: output panel - capped to viewport height on lg+ so long drafts
          scroll inside the panel instead of pushing the whole page down. */}
      <section className="min-w-0">
        <div className="lg:sticky lg:top-[4.5rem] lg:h-[calc(100svh-5.5rem)]">
          <OutputsPanel
            output={output}
            isGenerating={isGenerating}
            modelUsed={meta?.modelUsed}
            fellBack={meta?.fellBack}
          />
        </div>
      </section>
    </div>
  );
}

function StepDot({ done }: { done?: boolean }) {
  return (
    <span
      aria-hidden
      className={
        done
          ? "ml-0.5 inline-block size-1.5 rounded-full bg-emerald-500"
          : "ml-0.5 inline-block size-1.5 rounded-full bg-muted-foreground/40"
      }
    />
  );
}
