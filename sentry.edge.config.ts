// This file configures the initialization of Sentry for Edge API routes.
// The config you add here will be used whenever an Edge API route handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Verificar ambiente
const isDev = process.env.NODE_ENV === 'development';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Ajusta a taxa de amostragem de rastreamentos para Edge Runtime
  tracesSampleRate: 1.0,

  // Define o ambiente atual
  environment: process.env.NODE_ENV,

  // Habilita o Sentry em qualquer ambiente para testes
  enabled: true,
  
  // Ativa o debug para identificar problemas - apenas em desenvolvimento
  debug: isDev,
  
  // Configura o comportamento de acordo com o ambiente
  beforeSend(event) {
    // Registra logs apenas em ambiente de desenvolvimento
    if (isDev) {
      console.log(`Sentry capturou um evento no edge: ${event.event_id}`);
    }
    return event;
  },
}); 