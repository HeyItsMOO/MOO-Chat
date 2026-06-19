import { ImageResponse } from 'next/og';
import { BRAND } from '@/lib/brand';
import { getContent } from '@/lib/content';

export const alt = 'ChatMOO blog post';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function BlogOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getContent('blog', slug);
  const title = post?.title ?? `${BRAND.name} Blog`;

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
          background: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: '#16a34a',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 34,
              fontWeight: 800,
            }}
          >
            M
          </div>
          <div style={{ fontSize: 30, fontWeight: 700, color: '#0f172a' }}>{`${BRAND.name} Blog`}</div>
        </div>

        <div style={{ display: 'flex', fontSize: 64, fontWeight: 800, color: '#0f172a', lineHeight: 1.12, maxWidth: 1040 }}>
          {title}
        </div>

        <div style={{ display: 'flex', height: 12, width: 200, background: '#16a34a', borderRadius: 999 }} />
      </div>
    ),
    { ...size },
  );
}
