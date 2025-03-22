"use client";

import * as Sentry from "@sentry/nextjs";
import { Button } from '@/components/ui/button';
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex h-screen w-full flex-col items-center justify-center gap-4 p-4 text-center bg-background text-foreground">
          <h2 className="text-2xl font-bold">Erro crítico!</h2>
          <p className="max-w-md text-muted-foreground">
            Ocorreu um erro inesperado na aplicação. Nossa equipe foi notificada do problema.
          </p>
          <Button
            onClick={() => reset()}
            className="mt-4"
          >
            Tentar novamente
          </Button>
        </div>
      </body>
    </html>
  );
}