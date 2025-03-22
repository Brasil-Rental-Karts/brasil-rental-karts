import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export const dynamic = "force-dynamic";

// A faulty API route to test Sentry's error monitoring - apenas para ambiente de desenvolvimento
export function GET() {
  // Verificar se estamos em ambiente de desenvolvimento
  const isDev = process.env.NODE_ENV === 'development';
  
  // Se não for ambiente de desenvolvimento, retornar 404
  if (!isDev) {
    console.log("Tentativa de acesso à API de teste do Sentry em ambiente de produção");
    return new NextResponse(
      JSON.stringify({
        error: "Not Found",
        message: "Esta API de teste só está disponível em ambiente de desenvolvimento",
      }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
  
  try {
    console.log("Iniciando API de exemplo do Sentry");
    
    // Adicionar algumas informações de contexto antes do erro
    Sentry.setContext("api_details", {
      name: "sentry-example-api",
      endpoint: "/api/sentry-example-api",
      method: "GET"
    });
    
    Sentry.setTag("environment", process.env.NODE_ENV || "development");
    
    // Adicionando breadcrumb para rastreamento
    Sentry.addBreadcrumb({
      category: 'api',
      message: 'API de exemplo do Sentry foi chamada',
      level: 'info'
    });
    
    // Forcefully throw an error para teste
    throw new Error("Sentry Example API Route Error - Teste de captura");
  } catch (error) {
    console.error("Erro capturado:", error);
    
    // Capture com mais contexto
    Sentry.captureException(error, {
      tags: {
        api: "sentry-example-api",
        component: "route-handler",
      },
      extra: {
        timestamp: new Date().toISOString(),
        details: "Erro proposital para testar o Sentry"
      }
    });
    
    // Retorna um erro 500 para o cliente
    return new NextResponse(
      JSON.stringify({
        error: "Internal Server Error",
        message: "Este erro foi capturado pelo Sentry",
        id: new Date().getTime() // ID único para rastreamento
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
