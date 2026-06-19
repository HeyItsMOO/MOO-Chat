import { BRAND } from '@/lib/brand';

/** A static, on-brand mockup of the chat widget — used as the hero visual. */
export function ChatMockup() {
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div
        className="overflow-hidden rounded-3xl border-4 border-cow-black bg-white"
        style={{ boxShadow: '10px 10px 0 #1a1a1a' }}
      >
        {/* header */}
        <div className="flex items-center gap-3 border-b-4 border-cow-black bg-pasture px-4 py-3 text-cow-black">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-cow-black bg-white text-lg">{BRAND.emoji}</span>
          <div className="leading-tight">
            <div className="font-heading text-sm font-bold">AI Assistant</div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-cow-black" /> Online now
            </div>
          </div>
        </div>

        {/* messages */}
        <div className="space-y-3 bg-paper px-4 py-5">
          <div className="max-w-[80%] rounded-2xl rounded-tl-sm border-2 border-cow-black bg-white px-3.5 py-2.5 text-sm font-semibold text-cow-black">
            Hi! 👋 How can I help you today?
          </div>
          <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm border-2 border-cow-black bg-pasture px-3.5 py-2.5 text-sm font-semibold text-cow-black">
            Do you service my area and what are your hours?
          </div>
          <div className="max-w-[85%] rounded-2xl rounded-tl-sm border-2 border-cow-black bg-white px-3.5 py-2.5 text-sm font-semibold text-cow-black">
            Yes — we cover the whole metro area, 7am–6pm Mon–Sat. Want a free quote? I can grab a few details.
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {['Get a quote', 'Pricing', 'Talk to a human'].map((c) => (
              <span key={c} className="rounded-full border-2 border-cow-black bg-white px-3 py-1 text-xs font-bold text-cow-black">{c}</span>
            ))}
          </div>
        </div>

        {/* input */}
        <div className="flex items-center gap-2 border-t-4 border-cow-black bg-white px-3 py-3">
          <div className="flex-1 rounded-full border-2 border-cow-black/20 bg-paper px-4 py-2 text-sm font-semibold text-ink-mute">Type your message…</div>
          <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-cow-black bg-accent text-cow-black">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 11l18-8-8 18-2-7-8-3z" /></svg>
          </span>
        </div>
      </div>

      {/* sticker badge */}
      <div
        className="absolute -right-3 -top-4 rotate-6 rounded-xl border-[3px] border-cow-black bg-accent px-3 py-1.5 font-heading text-sm font-bold text-cow-black"
        style={{ boxShadow: '3px 3px 0 #1a1a1a' }}
      >
        Live in 5 min!
      </div>
    </div>
  );
}
