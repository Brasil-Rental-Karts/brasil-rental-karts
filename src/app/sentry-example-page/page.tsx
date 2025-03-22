"use client";

import { Button } from '@/components/ui/button';
import * as Sentry from '@sentry/nextjs';
import { useState } from 'react';

export default function SentryExamplePage() {
  const [error, setError] = useState<string | null>(null);

  // Função que causa um erro para testar o Sentry
  const handleError = () => {
    try {
      // Aqui forçamos um erro para testar
      throw new Error('Isso é um teste de erro para o Sentry');
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
        throw e; // Isso irá acionar o componente de erro
      }
    }
  };

  // Função para enviar um evento ao Sentry manualmente
  const handleSendEvent = () => {
    // Enviando um evento customizado ao Sentry
    Sentry.captureMessage('Teste de evento manual enviado ao Sentry', {
      level: 'info',
      tags: {
        component: 'SentryExamplePage',
        action: 'manual-event'
      }
    });
    
    alert('Evento enviado ao Sentry com sucesso!');
  };

  return (
    <div className="container mx-auto py-12">
      <h1 className="text-3xl font-bold mb-8">Teste do Sentry</h1>
      
      <div className="grid gap-6 mb-8">
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Gerar um erro para testar</h2>
          <p className="mb-4 text-muted-foreground">
            Este botão irá gerar um erro que será capturado pelo Sentry e acionará o componente de erro.
          </p>
          <Button variant="destructive" onClick={handleError}>
            Gerar Erro
          </Button>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Enviar evento manual</h2>
          <p className="mb-4 text-muted-foreground">
            Este botão envia um evento personalizado ao Sentry sem gerar um erro na aplicação.
          </p>
          <Button variant="outline" onClick={handleSendEvent}>
            Enviar Evento ao Sentry
          </Button>
        </div>
      </div>

      <div className="bg-muted p-4 rounded-md">
        <h3 className="font-medium mb-2">Como verificar?</h3>
        <p className="text-sm text-muted-foreground">
          Após gerar um erro ou enviar um evento, acesse o dashboard do Sentry para visualizar os dados capturados.
        </p>
      </div>
    </div>
  );
}
