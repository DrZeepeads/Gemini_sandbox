/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverComponentsExternalPackages: [
      '@google/generative-ai',
      '@e2b/code-interpreter',
      'openai',
      '@anthropic-ai/sdk',
      'rate-limiter-flexible'
    ]
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    return config;
  },
  // For Vercel Edge Runtime optimization
  images: {
    domains: ['example.com'],
  },
};

module.exports = nextConfig;