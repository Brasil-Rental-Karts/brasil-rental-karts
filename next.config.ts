import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// Configuração base do Next.js
const nextConfig: NextConfig = {
  eslint: {
    // Ignora os erros de ESLint durante o build para arquivos de teste
    ignoreDuringBuilds: true,
  },
};

// Opções do Sentry para integração com Next.js
const sentryWebpackPluginOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true, // Suprime os logs do SDK durante build
  hideSourceMaps: true, // Oculta sourcemaps em produção
};

// Exportamos a configuração com Sentry
export default withSentryConfig(
  nextConfig, 
  sentryWebpackPluginOptions
);
