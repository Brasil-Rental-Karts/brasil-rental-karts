'use client';

import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Registra o erro no Sentry (com contexto adicional)
    Sentry.captureException(error, {
      tags: {
        page: 'sentry-example-page'
      },
      extra: {
        errorInfo: error.toString()
      }
    });
  }, [error]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 p-4 text-center">
      <h2 className="text-2xl font-bold">Erro de teste do Sentry!</h2>
      <p className="max-w-md text-muted-foreground">
        Este é um exemplo de erro capturado pelo Sentry. Nossa equipe foi notificada do problema.
      </p>
      <div className="bg-muted p-4 rounded-md text-left">
        <p className="font-mono text-sm">{error.message}</p>
      </div>
      <Button
        onClick={() => reset()}
        className="mt-4"
      >
        Tentar novamente
      </Button>
    </div>
  );
} 