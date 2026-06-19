/**
 * Transactional email. Uses Resend if RESEND_API_KEY is set; otherwise logs the
 * email to the server console so everything works in local dev without a provider.
 */
export const EMAIL_CONFIGURED = !!process.env.RESEND_API_KEY;

const FROM = process.env.EMAIL_FROM || 'ChatMOO <onboarding@resend.dev>';

export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!opts.to) return { ok: false, error: 'no recipient' };

  if (!process.env.RESEND_API_KEY) {
    console.log(
      `\n📧 [email:dev] to=${opts.to} replyTo=${opts.replyTo || '-'}\n   subject: ${opts.subject}\n   ${opts.text.replace(/\n/g, '\n   ')}\n`,
    );
    return { ok: true };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: [opts.to],
        subject: opts.subject,
        text: opts.text,
        reply_to: opts.replyTo,
      }),
    });
    if (!res.ok) return { ok: false, error: `Resend ${res.status}: ${await res.text()}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'email error' };
  }
}
