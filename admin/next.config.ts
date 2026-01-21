import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '10.11.1.44',
        port: '8000',
        pathname: '/attaches/**',
      },
      {
        protocol: 'http',
        hostname: '10.11.1.44',
        port: '8000',
        pathname: '/attaches/**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
