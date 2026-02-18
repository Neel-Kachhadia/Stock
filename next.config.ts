import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['smartapi-javascript', 'otplib', 'technicalindicators'],
};

export default nextConfig;
