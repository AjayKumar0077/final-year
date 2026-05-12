import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
        ],
      },
    ]
  },
  allowedDevOrigins: [
    'localhost',
    'localhost:3000',
    'localhost:3001',
    '192.168.5.177',
    '192.168.5.177:3000',
    '192.168.5.177:3001',
    '10.254.178.177',
    '10.254.178.177:3000',
    '10.254.178.177:3001',
    '192.168.169.177',
    'vm-r0edinaiw1mh20pinmp3m6.vusercontent.net',
    '*.vusercontent.net',
  ],
}

export default nextConfig
