import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Статический экспорт для Render Static Site
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true, // Для static export нужно отключить оптимизацию
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  // Редиректы не работают в static export, убираем
};

export default nextConfig;
