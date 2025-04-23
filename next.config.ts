import { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_URL || 'http://localhost:8000'}/:path*` // Proxy ke backend
      }
    ]
  }
};

export default config;