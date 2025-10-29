import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  eslint: {
    // Keep shipping even if ESLint finds issues during `next build`
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  webpack: (config) => {
    // Stub optional pretty logger dependency pulled by walletconnect/pino in the browser
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'pino-pretty': false as unknown as string,
    }
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      os: false,
      path: false,
    }
    return config
  },
}

export default nextConfig
