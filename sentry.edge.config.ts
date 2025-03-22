// This file configures the initialization of Sentry for Edge API routes.
// The config you add here will be used whenever an Edge API route handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Ajusta a taxa de amostragem de rastreamentos para Edge Runtime
  tracesSampleRate: 1.0,

  // Define o ambiente atual
  environment: process.env.NODE_ENV,

  // Habilita o Sentry em qualquer ambiente para testes
  enabled: true,
  
  // Ativa o debug para identificar problemas
  debug: true,
}); 