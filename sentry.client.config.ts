// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a page is visited.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Log para debug - verificar se a variável de ambiente está disponível
const isDev = process.env.NODE_ENV === 'development';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Ajusta a taxa de amostragem de rastreamentos. Ajuste esse valor em produção.
  tracesSampleRate: 1.0,

  // Configurações para o replay de sessões (opcional)
  // replaysSessionSampleRate: 0.1, // Captura 10% das sessões
  // replaysOnErrorSampleRate: 1.0, // Captura todas as sessões que têm erros

  // Define o ambiente atual
  environment: process.env.NODE_ENV,

  // Habilita o Sentry em qualquer ambiente para testes
  enabled: true,
  
  // Define a versão do release, útil para identificar quais commits contêm o erro
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'dev',
  
  // DEBUG para ajudar a identificar problemas - ativo apenas em desenvolvimento
  debug: isDev,
  
  // Configura o comportamento de acordo com o ambiente
  beforeSend(event) {
    // Em produção, reduzimos a quantidade de logs no console
    if (!isDev) {
      // Remover console logs em produção para reduzir ruído
      console.debug = () => {};
      console.log = () => {};
    }
    return event;
  },
}); 