/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The embed widget + API are called cross-origin from customer sites.
  // Per-route CORS is handled in the route handlers; this just keeps headers sane.
  async headers() {
    return [
      {
        source: '/embed.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=300, s-maxage=300' },
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
        ],
      },
      {
        source: '/widget.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=300, s-maxage=300' },
        ],
      },
    ];
  },
};

export default nextConfig;
