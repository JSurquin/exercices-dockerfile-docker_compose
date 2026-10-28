import { execSync } from 'node:child_process';
import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

import { codeInspectorPlugin } from 'code-inspector-plugin';

function parseBooleanEnv(value: string | undefined): boolean {
  if (value === undefined || value === '') return false;
  return value === 'true' || value === '1';
}

function resolveGitSha(): string {
  const fromEnv = (
    process.env.SOURCE_COMMIT ||
    process.env.GIT_SHA ||
    process.env.NEXT_PUBLIC_GIT_SHA ||
    process.env.NIXPACKS_GIT_COMMIT_SHA ||
    ''
  ).trim();
  if (fromEnv) return fromEnv.slice(0, 12);
  try {
    return execSync('git rev-parse --short HEAD', {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
  } catch {
    return '';
  }
}

const showSentry = parseBooleanEnv(process.env.SHOW_SENTRY);
const gitSha = resolveGitSha();

const nextConfig: NextConfig = {
  output: 'standalone',
  generateBuildId: async () => gitSha || `b${Date.now().toString(36)}`,
  env: {
    NEXT_PUBLIC_SHOW_SENTRY: showSentry ? 'true' : 'false',
    GIT_SHA: gitSha,
  },
  poweredByHeader: false,
  serverExternalPackages: ['sharp'],
  async headers() {
    const isProd = process.env.NODE_ENV === 'production';
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://community.cloudflare.steamstatic.com",
      "style-src 'self' 'unsafe-inline'",
      // https: requis pour logos/avatars partenaires (URLs externes saisies dans l'admin)
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.ingest.sentry.io https://o*.ingest.sentry.io https://api.frankfurter.dev",
      "worker-src 'self' blob:",
      "frame-src 'none'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=()',
          },
          ...(isProd ? [{
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          }] : []),
          {
            key: 'Content-Security-Policy',
            value: cspDirectives,
          },
        ],
      },
    ];
  },
  ...(process.env.NODE_ENV === 'production'
    ? {}
    : {
        turbopack: {
          rules: codeInspectorPlugin({
            bundler: 'turbopack',
          }),
        },
      }),
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'community.cloudflare.steamstatic.com',
        pathname: '/economy/image/**',
      },
      {
        protocol: 'https',
        hostname: 'steamcommunity-a.akamaihd.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.steamstatic.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'steamcdn-a.akamaihd.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.steamstatic.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        pathname: '/vi/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'yt3.ggpht.com',
        pathname: '/**',
      },
    ],
  },
};

export default showSentry
  ? withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "andromed",

  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
})
  : nextConfig;
