/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'admin.bml.co.kr',
        port: '8000',
        pathname: '/attaches/**',
      }
    ],
  },
};

module.exports = nextConfig;