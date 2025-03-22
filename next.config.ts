/** @type {import('next').NextConfig} */

import { withSentryConfig } from "@sentry/nextjs";
import type { Configuration as WebpackConfig } from 'webpack';

const nextConfig = {
  experimental: {
    // Permite que as variáveis de ambiente sejam definidas no lado do cliente
    // mesmo em tempo de desenvolvimento
    turbo: {
      resolveAlias: {
        '@sentry/nextjs': '@sentry/nextjs',
      }
    },
  },
  // Configurações do ESLint
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    // Garante que variáveis de ambiente críticas estejam disponíveis no cliente
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_SENTRY_URL: process.env.NEXT_PUBLIC_SENTRY_URL,
  },
  webpack: (config: WebpackConfig) => {
    // Ajusta a configuração do webpack para expor variáveis de ambiente
    return config;
  },
};

// Configurações do Sentry para o withSentryConfig
const sentryWebpackPluginOptions = {
  // Configurações adicionais para o plugin do Webpack do Sentry
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  
  // Desabilita o upload de source maps durante o build
  silent: true, // Silencia os logs do Sentry CLI
  disableSourceMapUpload: true, // Desabilita o upload de source maps
  hideSourceMaps: true, // Oculta os source maps em produção
  disableServerWebpackPlugin: true, // Desabilita o plugin do Webpack para o servidor
  disableClientWebpackPlugin: true, // Desabilita o plugin do Webpack para o cliente
  sourcemaps: {
    assets: './**', // Caminho para os assets
    ignore: ['node_modules/**/*'],
  },
};

export default withSentryConfig(
  nextConfig,
  sentryWebpackPluginOptions
);
