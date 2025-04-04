/** @type {import('next').NextConfig} */

const nextConfig = {
  experimental: {
    // Habilitando Turbopack
    turbo: {
      enabled: true
    },
  },
  // Configurações do ESLint
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    // Ajusta a configuração do webpack se necessário
    return config;
  },
  // Configuração para permitir o uso do next/font com Babel
  transpilePackages: ['next/font'],
  // Configuração para permitir imagens de domínios externos
  images: {
    domains: ['hgfdpzyiicowqyxglswu.supabase.co', 'images.unsplash.com'],
  },
};

module.exports = nextConfig; 