import Anthropic from '@anthropic-ai/sdk';

export const ANTHROPIC_CONFIGURED = !!process.env.ANTHROPIC_API_KEY;

let client: Anthropic | null = null;
function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResult {
  ok: boolean;
  text: string;
  tokensIn: number;
  tokensOut: number;
  error?: string;
}

/**
 * Single completion against the central key. Returns plain text + token usage
 * so callers can meter per tenant.
 */
export async function chat(opts: {
  model: string;
  system: string;
  messages: ChatTurn[];
  maxTokens: number;
}): Promise<ChatResult> {
  const c = getClient();
  if (!c) {
    return { ok: false, text: '', tokensIn: 0, tokensOut: 0, error: 'not_configured' };
  }
  try {
    const res = await c.messages.create({
      model: opts.model,
      max_tokens: opts.maxTokens,
      system: opts.system,
      messages: opts.messages.map((m) => ({ role: m.role, content: m.content })),
    });
    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n\n')
      .trim();
    return {
      ok: true,
      text,
      tokensIn: res.usage?.input_tokens ?? 0,
      tokensOut: res.usage?.output_tokens ?? 0,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return { ok: false, text: '', tokensIn: 0, tokensOut: 0, error: message };
  }
}
