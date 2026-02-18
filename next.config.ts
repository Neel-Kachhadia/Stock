import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mark server-only packages as external so Next.js doesn't bundle them
  serverExternalPackages: ['smartapi-javascript', 'otplib', 'ws', 'axios', 'yahoo-finance2'],
  // Transpile client-side indicator library
  transpilePackages: ['technicalindicators'],
};

export default nextConfig;
