/** Lead form field definitions — the configurable, generalized quote form. */

export type LeadFieldType = 'text' | 'email' | 'tel' | 'textarea' | 'select';

export interface LeadField {
  key: string;
  label: string;
  type: LeadFieldType;
  required: boolean;
  options?: string[]; // for select
  placeholder?: string;
}

export const FIELD_TYPES: { value: LeadFieldType; label: string }[] = [
  { value: 'text', label: 'Short text' },
  { value: 'email', label: 'Email' },
  { value: 'tel', label: 'Phone' },
  { value: 'textarea', label: 'Long text' },
  { value: 'select', label: 'Dropdown' },
];

/** A sensible default contact form for new tenants. */
export const DEFAULT_LEAD_FIELDS: LeadField[] = [
  { key: 'name', label: 'Your name', type: 'text', required: true },
  { key: 'email', label: 'Email', type: 'email', required: true },
  { key: 'phone', label: 'Phone', type: 'tel', required: false },
  { key: 'message', label: 'How can we help?', type: 'textarea', required: false },
];

export function parseFields(json: string | null | undefined): LeadField[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    if (!Array.isArray(arr)) return [];
    return arr.filter(isValidField);
  } catch {
    return [];
  }
}

function isValidField(f: any): f is LeadField {
  return (
    f &&
    typeof f.key === 'string' &&
    typeof f.label === 'string' &&
    ['text', 'email', 'tel', 'textarea', 'select'].includes(f.type) &&
    typeof f.required === 'boolean'
  );
}

export function slugifyKey(label: string, existing: string[] = []): string {
  let base =
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 40) || 'field';
  let key = base;
  let n = 1;
  while (existing.includes(key)) {
    n += 1;
    key = `${base}_${n}`;
  }
  return key;
}

/** Validate a submission against the field defs. Returns { errors, clean }. */
export function validateSubmission(
  fields: LeadField[],
  values: Record<string, unknown>,
): { errors: Record<string, string>; clean: Record<string, string> } {
  const errors: Record<string, string> = {};
  const clean: Record<string, string> = {};
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  for (const f of fields) {
    const raw = values[f.key];
    const val = typeof raw === 'string' ? raw.trim().slice(0, 2000) : '';
    if (f.required && !val) {
      errors[f.key] = 'Required.';
      continue;
    }
    if (val && f.type === 'email' && !emailRe.test(val)) {
      errors[f.key] = 'Enter a valid email.';
      continue;
    }
    if (val && f.type === 'select' && f.options && f.options.length && !f.options.includes(val)) {
      errors[f.key] = 'Please choose an option.';
      continue;
    }
    clean[f.key] = val;
  }
  return { errors, clean };
}

/** Pull best-guess name/email/phone out of a submission for the Lead columns. */
export function extractContact(fields: LeadField[], clean: Record<string, string>) {
  const byType = (t: LeadFieldType) => fields.find((f) => f.type === t)?.key;
  const nameKey =
    fields.find((f) => /name/i.test(f.key) || /name/i.test(f.label))?.key || fields[0]?.key;
  const emailKey = byType('email') || fields.find((f) => /email/i.test(f.key))?.key;
  const phoneKey = byType('tel') || fields.find((f) => /phone/i.test(f.key))?.key;
  return {
    name: nameKey ? clean[nameKey] || '' : '',
    email: emailKey ? clean[emailKey] || '' : '',
    phone: phoneKey ? clean[phoneKey] || '' : '',
  };
}
