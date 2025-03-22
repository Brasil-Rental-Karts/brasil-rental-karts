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
    // Registra o erro no Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 p-4 text-center">
      <h2 className="text-2xl font-bold">Algo deu errado!</h2>
      <p className="max-w-md text-muted-foreground">
        Ocorreu um erro inesperado. Nossa equipe foi notificada do problema.
      </p>
      <Button
        onClick={() => reset()}
        className="mt-4"
      >
        Tentar novamente
      </Button>
    </div>
  );
} 