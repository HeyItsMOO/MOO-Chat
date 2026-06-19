import { ImageResponse } from 'next/og';
import { BRAND } from '@/lib/brand';

export const alt = `${BRAND.name} — ${BRAND.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Default social card for every page (overridden per-route where set).
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 80,
          background: 'linear-gradient(135deg, #166534 0%, #16a34a 60%, #22c55e 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 40,
              fontWeight: 800,
            }}
          >
            M
          </div>
          <div style={{ fontSize: 36, fontWeight: 700 }}>{BRAND.name}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, maxWidth: 900 }}>
            Your website&apos;s AI front desk.
          </div>
          <div style={{ marginTop: 28, fontSize: 34, color: 'rgba(255,255,255,0.92)', maxWidth: 980 }}>
            Answers questions, captures leads, and hands off to your team.
          </div>
        </div>

        <div style={{ fontSize: 26, color: 'rgba(255,255,255,0.85)' }}>
          {`Install with one line of code · a ${BRAND.parent} product`}
        </div>
      </div>
    ),
    { ...size },
  );
}
