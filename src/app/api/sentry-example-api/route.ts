import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export const dynamic = "force-dynamic";

// A faulty API route to test Sentry's error monitoring
export function GET() {
  try {
    // Forcefully throw an error para teste
    throw new Error("Sentry Example API Route Error");
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        api: "sentry-example-api",
      },
    });
    
    // Retorna um erro 500 para o cliente
    return new NextResponse(
      JSON.stringify({
        error: "Internal Server Error",
        message: "This error was captured by Sentry",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
