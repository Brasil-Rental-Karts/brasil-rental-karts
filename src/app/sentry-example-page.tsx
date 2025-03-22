"use client";

import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { useRouter } from "next/navigation";

// Página de exemplo para testar o Sentry - apenas para ambiente de desenvolvimento
export default function SentryExamplePage() {
  const [errorTriggered, setErrorTriggered] = useState(false);
  const [isDevEnvironment, setIsDevEnvironment] = useState(false);
  const router = useRouter();
  
  useEffect(() => {
    // Verificar se estamos em ambiente de desenvolvimento
    const isDev = process.env.NODE_ENV === 'development';
    setIsDevEnvironment(isDev);
    
    // Redirecionar para a home se não estiver em ambiente de desenvolvimento
    if (!isDev) {
      console.log("Redirecionando para home: esta página só está disponível em ambiente de desenvolvimento");
      router.push('/');
    }
  }, [router]);
  
  const triggerClientError = () => {
    try {
      console.log("Disparando erro no cliente...");
      console.log("DSN do Sentry:", process.env.NEXT_PUBLIC_SENTRY_DSN);
      
      // Configurar contexto adicional
      Sentry.setTag("trigger_source", "manual_client_button");
      Sentry.setUser({ id: "123", email: "teste@exemplo.com" });
      
      // Lançar erro para testar
      throw new Error("Erro intencional para testar o Sentry no cliente");
    } catch (error) {
      console.error("Erro capturado:", error);
      
      // Enviar para o Sentry
      Sentry.captureException(error, {
        tags: {
          component: "sentry-example-page",
          test_type: "client_test"
        }
      });
      
      setErrorTriggered(true);
    }
  };
  
  const triggerAPIError = async () => {
    try {
      console.log("Chamando API com erro...");
      const response = await fetch("/api/sentry-example-api");
      const data = await response.json();
      console.log("Resposta da API:", data);
    } catch (error) {
      console.error("Erro na chamada da API:", error);
    }
  };
  
  // Se não estiver em ambiente de desenvolvimento, mostra mensagem de carregamento
  // (o redirecionamento acontecerá via useEffect)
  if (!isDevEnvironment) {
    return <div className="container mx-auto py-10">Redirecionando...</div>;
  }
  
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Página de teste do Sentry</h1>
      
      <div className="p-4 mb-8 border rounded-lg bg-yellow-50 border-yellow-200">
        <p className="text-yellow-800 font-medium">⚠️ Esta página só está disponível em ambiente de desenvolvimento</p>
      </div>
      
      <div className="mb-8 p-6 border rounded-lg bg-card">
        <h2 className="text-xl font-semibold mb-4">Informações de depuração</h2>
        <div className="space-y-2">
          <p><strong>DSN disponível:</strong> {process.env.NEXT_PUBLIC_SENTRY_DSN ? "Sim" : "Não"}</p>
          <p><strong>Ambiente:</strong> {process.env.NODE_ENV}</p>
          <p><strong>URL do Sentry:</strong> {process.env.NEXT_PUBLIC_SENTRY_URL || "Não configurado"}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Teste de Erro no Cliente</h2>
          <p className="mb-4">Este botão dispara um erro no lado do cliente que deve ser capturado pelo Sentry.</p>
          <Button onClick={triggerClientError}>
            Disparar Erro no Cliente
          </Button>
          
          {errorTriggered && (
            <p className="mt-4 text-sm text-red-500">
              Erro disparado! Verifique o console e o dashboard do Sentry.
            </p>
          )}
        </div>
        
        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Teste de Erro na API</h2>
          <p className="mb-4">Este botão chama uma API que dispara um erro no lado do servidor.</p>
          <Button onClick={triggerAPIError} variant="outline">
            Disparar Erro na API
          </Button>
        </div>
      </div>
    </div>
  );
} 