// const withPWA = require("next-pwa")({
//   dest: "public",
//   register: true,
//   skipWaiting: true,
//   disable: process.env.NODE_ENV === "development",
//   fallbacks: {
//     document: "/offline",
//     image: '/icon-512x512.png',
//     font: '/fonts/fallback.woff2',
//   },
//   cacheOnFrontEndNav: true,
//   reloadOnOnline: true,
//   sw: "/sw.js",
//   runtimeCaching: [
//     {
//       urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
//       handler: "CacheFirst",
//       options: {
//         cacheName: "google-fonts",
//         expiration: {
//           maxEntries: 4,
//           maxAgeSeconds: 365 * 24 * 60 * 60 // 365 days
//         }
//       }
//     },
//     {
//       urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
//       handler: "CacheFirst",
//       options: {
//         cacheName: "images",
//         expiration: {
//           maxEntries: 64,
//           maxAgeSeconds: 24 * 60 * 60 // 24 hours
//         }
//       }
//     },
//     {
//       urlPattern: /\/_next\/image\?url=.+$/i,
//       handler: "CacheFirst",
//       options: {
//         cacheName: "next-images",
//         expiration: {
//           maxEntries: 64,
//           maxAgeSeconds: 24 * 60 * 60 // 24 hours
//         }
//       }
//     },
//     {
//       urlPattern: /\.(?:js|css)$/i,
//       handler: "StaleWhileRevalidate",
//       options: {
//         cacheName: "static-resources",
//         expiration: {
//           maxEntries: 32,
//           maxAgeSeconds: 24 * 60 * 60 // 24 hours
//         }
//       }
//     },
//     {
//       urlPattern: /^https?.*/,
//       handler: "NetworkFirst",
//       options: {
//         cacheName: "offlineCache",
//         networkTimeoutSeconds: 10,
//         expiration: {
//           maxEntries: 200,
//           maxAgeSeconds: 24 * 60 * 60 // 24 hours
//         },
//         cacheableResponse: {
//           statuses: [0, 200]
//         }
//       }
//     }
//   ],
//   buildExcludes: [/middleware-manifest\.json$/],
//   modifyURLPrefix: {
//     "": "/_next/",
//   },
//   maximumFileSizeToCacheInBytes: 5000000,
// })

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react'],
    optimisticClientCache: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ['error', 'warn'],
    } : false,
  },
}

module.exports = nextConfig
// module.exports = withPWA(nextConfig)