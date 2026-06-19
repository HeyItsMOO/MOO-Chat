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
          padding: 70,
          background: '#f0fdf4',
          backgroundImage: 'radial-gradient(#4ade80 2px, transparent 2px)',
          backgroundSize: '44px 44px',
          border: '18px solid #1a1a1a',
          fontFamily: 'sans-serif',
          color: '#1a1a1a',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: '#4ade80',
              border: '4px solid #1a1a1a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 40,
              fontWeight: 800,
            }}
          >
            M
          </div>
          <div style={{ fontSize: 36, fontWeight: 800 }}>{BRAND.name}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 78, fontWeight: 800, lineHeight: 1.05, maxWidth: 980 }}>
            Your website&apos;s AI front desk.
          </div>
          <div style={{ display: 'flex', marginTop: 24, fontSize: 32, fontWeight: 700, color: '#374151', maxWidth: 1000 }}>
            Answers questions, captures leads, and hands off to your team.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', background: '#facc15', border: '3px solid #1a1a1a', borderRadius: 999, padding: '8px 18px', fontSize: 24, fontWeight: 800 }}>
            Live in 5 min
          </div>
          <div style={{ display: 'flex', fontSize: 24, fontWeight: 700, color: '#374151' }}>
            {`One line of code · a ${BRAND.parent} product`}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
