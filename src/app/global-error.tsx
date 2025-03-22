'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Captura erros no Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex items-center justify-center min-h-screen bg-red-50">
          <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md border border-red-100">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Erro crítico!</h1>
            <p className="text-gray-700 mb-4">
              Ocorreu um erro inesperado na aplicação.
              Nossa equipe foi notificada do problema.
            </p>
            {error.message && (
              <div className="p-4 mb-4 bg-gray-50 rounded border border-gray-200">
                <p className="text-sm font-mono text-red-500">
                  {error.message}
                </p>
                {error.stack && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-gray-600">
                      Detalhes técnicos
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto text-xs">
                      {error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}
            <button
              onClick={reset}
              className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </body>
    </html>
  );
} 