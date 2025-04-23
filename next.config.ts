import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  ignoreBuildErrors: true,
  experimental: {
    serverActions: {
      // Allows Server Actions to work with Supabase Auth
      allowedOrigins: ["localhost:3000", "pagamentos.foxworldpanel.com"],
    },
  },
};

export default nextConfig;
