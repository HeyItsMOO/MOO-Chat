import type { Assistant } from '@prisma/client';

/**
 * Build the system prompt: persona + knowledge base + guardrails.
 *
 * This generalizes the InsureGroup plugin's hard-coded prompt. Persona and
 * guardrails are now editable per tenant, with safe defaults, while the
 * universal safety rules are always appended so a customer can't accidentally
 * remove them.
 */
export function buildSystemPrompt(a: Assistant): string {
  const company = a.companyName?.trim() || a.headerTitle?.trim() || 'this business';

  const persona =
    a.persona?.trim() ||
    `You are the ${company} virtual assistant, embedded on the ${company} website. ` +
      `You help visitors with questions about ${company}'s products and services. ` +
      `STYLE: Warm, professional and plain-English. Keep answers short — usually 2 to 4 sentences. ` +
      `Use a short bullet list only when it genuinely helps. When a topic maps to a specific page ` +
      `in the knowledge base, include that page's URL so the visitor can read more.`;

  const kb = a.knowledgeBase?.trim() || `(No knowledge base has been added yet.)`;

  const universalRules =
    `\n\n=== RULES YOU MUST ALWAYS FOLLOW ===\n` +
    `1. Answer ONLY using the knowledge base above and general, widely-known facts. ` +
    `If you don't know or it isn't covered, say so plainly and point the visitor to contact the team. Never invent specifics (prices, policies, availability, terms).\n` +
    `2. Never claim to be a human. If asked, say you're an automated assistant that can help with general questions and connect them to the team.\n` +
    `3. Do not ask for sensitive personal data (full card numbers, passwords, government IDs) in the chat.\n` +
    `4. Stay on topic for ${company}. If asked something unrelated, briefly and politely steer back.\n` +
    (a.phone ? `5. For anything you can't resolve, share the contact details (phone ${a.phone}${a.contactEmail ? ` / ${a.contactEmail}` : ''}).\n` : '');

  const extra = a.guardrails?.trim() ? `\n\n=== ADDITIONAL RULES ===\n${a.guardrails.trim()}\n` : '';

  return `${persona}\n\n=== KNOWLEDGE BASE ===\n${kb}${universalRules}${extra}`;
}

const MAX_MSG_CHARS = 2000;
const MAX_HISTORY = 16;

/** Clean + cap the incoming conversation (ported from the plugin's prepare_messages). */
export function prepareMessages(raw: unknown): { role: 'user' | 'assistant'; content: string }[] {
  if (!Array.isArray(raw)) return [];
  const clean: { role: 'user' | 'assistant'; content: string }[] = [];

  for (const m of raw) {
    if (!m || typeof m !== 'object') continue;
    const role = (m as any).role;
    const rawContent = (m as any).content;
    if (typeof rawContent !== 'string') continue;
    if (role === 'system') continue; // status lines aren't part of the AI dialogue

    const normRole = role === 'assistant' || role === 'agent' ? 'assistant' : 'user';
    const text = stripTags(rawContent).slice(0, MAX_MSG_CHARS).trim();
    if (!text) continue;
    clean.push({ role: normRole, content: text });
  }

  const trimmed = clean.slice(-MAX_HISTORY);
  // The API requires the first message to be from the user.
  while (trimmed.length && trimmed[0].role !== 'user') trimmed.shift();
  return trimmed;
}

function stripTags(s: string) {
  return s.replace(/<[^>]*>/g, '');
}
