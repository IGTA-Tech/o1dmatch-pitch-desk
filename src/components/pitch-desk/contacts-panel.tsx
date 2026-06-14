"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Field } from "./field";
import { emptyContact, type ContactDraft } from "./types";
import { Plus, Trash2, UserCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  contacts: ContactDraft[];
  selectedIndex: number;
  onChange: (next: ContactDraft[]) => void;
  onSelect: (index: number) => void;
  contactTypes: string[];
}

export function ContactsPanel({
  contacts,
  selectedIndex,
  onChange,
  onSelect,
  contactTypes,
}: Props) {
  const set = (index: number, patch: Partial<ContactDraft>) => {
    const next = contacts.map((c, i) => (i === index ? { ...c, ...patch } : c));
    onChange(next);
  };
  const add = () => onChange([...contacts, emptyContact()]);
  const remove = (i: number) => {
    if (contacts.length === 1) return;
    const next = contacts.filter((_, idx) => idx !== i);
    onChange(next);
    if (selectedIndex >= next.length) onSelect(next.length - 1);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold tracking-tight">Contacts</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Add every contact for this company. Generation drafts for the selected one.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={add}>
          <Plus className="size-3.5" />
          Add contact
        </Button>
      </div>
      <div className="space-y-3">
        {contacts.map((c, i) => {
          const isSelected = i === selectedIndex;
          return (
            <div
              key={i}
              className={cn(
                "group rounded-lg border bg-card p-4 transition-colors",
                isSelected
                  ? "border-primary/60 ring-1 ring-primary/30 bg-primary/[0.03]"
                  : "border-border hover:border-border/80",
              )}
            >
              <div className="mb-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => onSelect(i)}
                  className="flex items-center gap-2 text-left"
                >
                  <UserCircle2 className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {c.contact_name || `Contact ${i + 1}`}
                  </span>
                  {isSelected ? (
                    <Badge variant="default" className="ml-1">
                      Selected
                    </Badge>
                  ) : null}
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(i)}
                  disabled={contacts.length === 1}
                  aria-label="Remove contact"
                  className="size-7 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <Field label="Name">
                  <Input
                    value={c.contact_name}
                    onChange={(e) => set(i, { contact_name: e.target.value })}
                    placeholder="Colleen Ryan"
                  />
                </Field>
                <Field label="Title">
                  <Input
                    value={c.contact_title}
                    onChange={(e) => set(i, { contact_title: e.target.value })}
                    placeholder="Senior HR Generalist"
                  />
                </Field>
                <Field label="Email">
                  <Input
                    value={c.contact_email}
                    onChange={(e) => set(i, { contact_email: e.target.value })}
                    placeholder="colleen.ryan@example.com"
                  />
                </Field>
                <Field label="Contact type">
                  <Select
                    value={c.contact_type || "Unknown"}
                    onValueChange={(v) => set(i, { contact_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {contactTypes.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Notes">
                  <Textarea
                    rows={2}
                    value={c.contact_notes}
                    onChange={(e) => set(i, { contact_notes: e.target.value })}
                    placeholder="Local Charlotte HR contact."
                  />
                </Field>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
