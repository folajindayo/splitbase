/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['basescan.org'],
  },
  webpack: (config) => {
    config.externals.push('pino-pretty');
    return config;
  },
};

module.exports = nextConfig;
