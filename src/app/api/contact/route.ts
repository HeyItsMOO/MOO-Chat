import { NextResponse } from 'next/server';
import { z } from 'zod';
import { BRAND } from '@/lib/brand';
import { sendEmail } from '@/lib/email';

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  email: z.string().trim().email('A valid email is required').max(200),
  company: z.string().trim().max(160).optional().default(''),
  message: z.string().trim().min(10, 'Please add a little more detail').max(5000),
  // Honeypot: real users never fill this hidden field.
  website: z.string().max(0).optional().default(''),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message || 'Invalid submission';
    return NextResponse.json({ error: first }, { status: 400 });
  }

  const { name, email, company, message, website } = parsed.data;

  // Silently accept honeypot hits so bots don't learn anything.
  if (website) return NextResponse.json({ ok: true });

  const text =
    `New contact form submission\n\n` +
    `Name: ${name}\n` +
    `Email: ${email}\n` +
    (company ? `Company: ${company}\n` : '') +
    `\nMessage:\n${message}\n`;

  const result = await sendEmail({
    to: BRAND.supportEmail,
    subject: `Contact form — ${name}`,
    text,
    replyTo: email,
  });

  if (!result.ok) {
    return NextResponse.json({ error: 'Could not send your message. Please email us directly.' }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
