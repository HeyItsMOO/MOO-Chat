import { ImageResponse } from 'next/og';

export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

// Brand favicon / app icon: a white "M" mark on MOO Chat green.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#16a34a',
          color: 'white',
          fontSize: 340,
          fontWeight: 800,
          borderRadius: 96,
        }}
      >
        M
      </div>
    ),
    { ...size },
  );
}
