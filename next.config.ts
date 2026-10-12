import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Two root layouts (English and French) need a standalone 404 for unmatched URLs.
  experimental: { globalNotFound: true },
  // Server routes (e.g. /api/find) read the SQLite snapshot at request time.
  outputFileTracingIncludes: { "/**": ["./data/tabled.db", "./assets/fonts/*.ttf"] },
  serverExternalPackages: ["better-sqlite3"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
}

export default nextConfig
