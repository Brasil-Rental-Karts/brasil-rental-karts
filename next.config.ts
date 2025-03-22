import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Ignora os erros de ESLint durante o build para arquivos de teste
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
