import { BRAND } from '@/lib/brand';

/** A static, on-brand mockup of the chat widget — used as the hero visual. */
export function ChatMockup() {
  return (
    <div className="relative mx-auto w-full max-w-sm">
      {/* glow */}
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-brand-500/30 blur-2xl" aria-hidden="true" />

      <div className="overflow-hidden rounded-3xl border border-white/15 bg-white shadow-2xl">
        {/* header */}
        <div className="flex items-center gap-3 bg-brand-600 px-4 py-3 text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-lg">{BRAND.emoji}</span>
          <div className="leading-tight">
            <div className="text-sm font-semibold">AI Assistant</div>
            <div className="flex items-center gap-1.5 text-[11px] text-white/80">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Online now
            </div>
          </div>
        </div>

        {/* messages */}
        <div className="space-y-3 bg-slate-50 px-4 py-5">
          <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-white px-3.5 py-2.5 text-sm text-ink shadow-sm">
            Hi! 👋 How can I help you today?
          </div>
          <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-brand-600 px-3.5 py-2.5 text-sm text-white">
            Do you service my area and what are your hours?
          </div>
          <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white px-3.5 py-2.5 text-sm text-ink shadow-sm">
            Yes — we cover the whole metro area, 7am–6pm Mon–Sat. Want a free quote? I can grab a few details.
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-ink-soft">Get a quote</span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-ink-soft">Pricing</span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-ink-soft">Talk to a human</span>
          </div>
        </div>

        {/* input */}
        <div className="flex items-center gap-2 border-t border-slate-100 bg-white px-3 py-3">
          <div className="flex-1 rounded-full bg-slate-100 px-4 py-2 text-sm text-ink-mute">Type your message…</div>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 11l18-8-8 18-2-7-8-3z" /></svg>
          </span>
        </div>
      </div>
    </div>
  );
}
