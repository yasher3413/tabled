import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Server routes (e.g. /api/find) read the SQLite snapshot at request time.
  outputFileTracingIncludes: { "/**": ["./data/tabled.db"] },
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
