import type { NextConfig } from "next";
import path from 'path';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/property/:id',
        destination: '/prodaja/:id',
        permanent: true,
      },
    ];
  },
  // Указываем корректный workspace root для устранения предупреждения
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../'),
};

export default nextConfig;
