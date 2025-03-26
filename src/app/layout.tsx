import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import { initializeSchema } from "@/lib/supabase"

import { Header } from "@/components/header";
import { Footer } from "@/components/layout/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Initialize schema when the app starts
initializeSchema().catch(console.error)

export const metadata: Metadata = {
  title: "Brasil Rental Karts | Plataforma para Ligas de Kart Rental",
  description: "Ferramentas completas para gestão de ligas de kart rental, criação de campeonatos e perfis de pilotos.",
  icons: {
    icon: "/favicon.ico",
    apple: "/brk_logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Removendo declarações explícitas de favicon para evitar conflitos */}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
