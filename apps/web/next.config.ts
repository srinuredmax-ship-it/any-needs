import type { NextConfig } from "next";

// The browser uses /api on the website's own domain. Only the web server
// connects to the API, so customers never need a local API process.
const apiOrigin = (process.env.API_INTERNAL_URL || "http://127.0.0.1:4000").replace(/\/$/, "");
const config: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiOrigin}/:path*` }];
  },
};
export default config;
