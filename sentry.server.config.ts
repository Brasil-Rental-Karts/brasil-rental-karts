// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Verificar ambiente
const isDev = process.env.NODE_ENV === 'development';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: isDev,
  
  // Defina o ambiente (development, production)
  environment: process.env.NODE_ENV,
  
  // Habilita o Sentry em qualquer ambiente para testes
  enabled: true,
  
  // Configura o comportamento de acordo com o ambiente
  beforeSend(event) {
    // Registra logs apenas em ambiente de desenvolvimento
    if (isDev) {
      console.log(`Sentry capturou um evento no servidor: ${event.event_id}`);
    }
    return event;
  },
});
