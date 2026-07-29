"use client";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveProfileFieldsSchema } from "@/lib/validations/onboarding";
import type { WizardField } from "@/components/wizard/field-instance-row";

const GROUPS = [
  ["Personal details", ["designation", "photo"]], ["Business details", ["company_name", "company_description"]],
  ["Contact details", ["phone", "whatsapp", "email", "address", "google_maps_url"]],
  ["Online presence", ["website", "social_youtube", "social_instagram", "social_linkedin", "social_facebook", "social_twitter"]],
  ["Payments", ["upi_id", "upi_qr"]],
] as const;
const LABELS: Record<string, string> = { designation: "Designation", photo: "Profile photo URL", company_name: "Company / business name", company_description: "About company", phone: "Phone number", whatsapp: "WhatsApp number", email: "Email", address: "Address", google_maps_url: "Google Map link", website: "Website link", social_youtube: "YouTube link", social_instagram: "Instagram link", social_linkedin: "LinkedIn link", social_facebook: "Facebook link", social_twitter: "X (Twitter) link", upi_id: "UPI ID", upi_qr: "UPI QR code URL" };

export function Step1ProfileFields({ initialFields, initialCompany, initialName = "", onSaved }: { initialFields: WizardField[]; initialCompany: string | null; initialName?: string; onSaved: (fields: WizardField[], slug: string, company: string, name?: string) => void }) {
  const [name, setName] = useState(initialName); const [fields, setFields] = useState<WizardField[]>(initialFields); const [saving, setSaving] = useState(false);
  const find = (type: string) => fields.find((field) => field.fieldType === type)?.value ?? "";
  const set = (type: string, value: string) => setFields((previous) => { const current = previous.find((field) => field.fieldType === type); return current ? previous.map((field) => field.fieldType === type ? { ...field, value } : field) : [...previous, { clientId: `static-${type}`, fieldType: type, label: LABELS[type] || type, value }]; });
  const currentStats = fields.filter((field) => field.fieldType === "stat");
  async function save() { const payload = { name, company: find("company_name") || initialCompany || "", fields: fields.map(({ fieldType, label, value }) => ({ fieldType, label, value })) }; const parsed = saveProfileFieldsSchema.safeParse(payload); if (!parsed.success) return toast.error(parsed.error.issues[0]?.message || "Check your details"); setSaving(true); try { const response = await fetch("/api/onboarding/profile-fields", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) }); const data = await response.json().catch(() => ({})); if (!response.ok) return toast.error(data.error || "Could not save profile"); onSaved(data.fields.map((field: WizardField & { id: string }) => ({ ...field, clientId: field.id })), data.slug, data.company || "", name); } finally { setSaving(false); } }
  return <div className="space-y-4"><div><h2 className="text-lg font-semibold">Build your profile</h2><p className="text-sm text-muted-foreground">Keep your card focused with these organised details.</p></div><Accordion defaultValue={["Personal details"]} multiple className="rounded-2xl border bg-card px-4">{GROUPS.map(([title, types]) => <AccordionItem key={title} value={title}><AccordionTrigger>{title}</AccordionTrigger><AccordionContent className="space-y-3">{title === "Personal details" && <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" /></div>}{types.map((type) => <div key={type}><Label>{LABELS[type]}</Label>{type === "company_description" || type === "address" ? <Textarea value={find(type)} onChange={(e) => set(type, e.target.value)} /> : <Input value={find(type)} onChange={(e) => set(type, e.target.value)} placeholder={LABELS[type]} />}</div>)}{title === "Business details" && <div className="space-y-2"><Label>Stats</Label>{currentStats.map((stat) => { let value = ""; try { value = JSON.parse(stat.value).value || ""; } catch { value = stat.value; } return <div key={stat.clientId} className="flex gap-2"><Input value={stat.label} onChange={(e) => setFields((p) => p.map((f) => f.clientId === stat.clientId ? { ...f, label: e.target.value } : f))} placeholder="Years of experience" /><Input value={value} onChange={(e) => setFields((p) => p.map((f) => f.clientId === stat.clientId ? { ...f, value: JSON.stringify({ value: e.target.value }) } : f))} placeholder="10+" /><Button type="button" variant="ghost" size="icon" onClick={() => setFields((p) => p.filter((f) => f.clientId !== stat.clientId))}><Trash2 /></Button></div>; })}<Button type="button" variant="outline" size="sm" onClick={() => setFields((p) => [...p, { clientId: `stat-${p.length}`, fieldType: "stat", label: "", value: JSON.stringify({ value: "" }) }])}><Plus /> Add stat</Button></div>}</AccordionContent></AccordionItem>)}</Accordion><Button type="button" onClick={save} disabled={saving} className="float-right">{saving ? "Saving…" : "Save & Continue"}</Button></div>;
}
