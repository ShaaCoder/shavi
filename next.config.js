/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: false,
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'yourdomain.com' },
      { protocol: 'https', hostname: 'assets.myntassets.com' },
      { protocol: 'https', hostname: 'www.pexels.com' },
      { protocol: 'https', hostname: 'encrypted-tbn0.gstatic.com' },
      // ✅ Allow Cloudinary images
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // ✅ Enhanced Security Headers (Cloudinary-safe)
  async headers() {
    const isProduction = process.env.NODE_ENV === 'production';
    const enableSecurityHeaders = process.env.ENABLE_SECURITY_HEADERS !== 'false';

    if (!enableSecurityHeaders) return [];

    const cspReportUri = process.env.CSP_REPORT_URI || '/api/csp-report';

    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://checkout.razorpay.com https://www.google.com https://www.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: https: blob:", // ✅ Allows Cloudinary & all HTTPS
      "media-src 'self' https:",
      "connect-src 'self' https://www.shavistore.in https://api.stripe.com https://api.razorpay.com https://apiv2.shiprocket.in https://track.delhivery.com https://apigateway.bluedart.com https://blktracksvc.dtdc.com",
      "frame-src 'self' https://js.stripe.com https://checkout.razorpay.com https://www.google.com",
      "worker-src 'self' blob:",
      "child-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
      ...(cspReportUri ? [`report-uri ${cspReportUri}`] : []),
    ].join('; ');

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=self',
          },
          { key: 'Content-Security-Policy', value: csp },
          ...(isProduction
            ? [
                {
                  key: 'Strict-Transport-Security',
                  value: 'max-age=63072000; includeSubDomains; preload',
                },
                // 🔒 Keep strict isolation only in production (relaxed for images)
                { key: 'Cross-Origin-Embedder-Policy', value: 'unsafe-none' },
                { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
                { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
              ]
            : [
                // 🧩 Relax headers in development to fix Cloudinary image load
                { key: 'Cross-Origin-Embedder-Policy', value: 'unsafe-none' },
                { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
                { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
              ]),
          { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
        ],
      },

      // API route headers
      {
        source: '/api/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        ],
      },

      // Cached uploads
      {
        source: '/uploads/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable, stale-while-revalidate=86400',
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Vary', value: 'Accept' },
          { key: 'X-Optimized-Images', value: 'true' },
        ],
      },

      // WebP optimization
      {
        source: '/uploads/(.*)\\.webp',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          { key: 'Content-Type', value: 'image/webp' },
        ],
      },

      // Cloudinary images CORS support
      {
        source: '/_next/image(.*)',
        headers: [
          { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET' },
        ],
      },
    ];
  },

  // ✅ Environment variables
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },

  // ✅ Optimize package imports
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

  // ✅ Webpack optimization
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      const TerserPlugin = require('terser-webpack-plugin');
      config.optimization.minimizer.push(
        new TerserPlugin({
          terserOptions: {
            compress: { drop_console: true },
          },
        })
      );
    }
    return config;
  },
};

module.exports = nextConfig;
