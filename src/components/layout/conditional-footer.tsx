"use client";

import { usePathname } from "next/navigation";
import { Footer } from "./footer";

// Lista de caminhos que requerem autenticação e não devem mostrar o footer
const AUTHENTICATED_PATHS = [
  '/pilot',
  '/league/',
  '/auth',
  '/login'
];

export function ConditionalFooter() {
  const pathname = usePathname();
  
  // Verifica se o caminho atual é uma rota autenticada
  const isAuthenticatedPath = AUTHENTICATED_PATHS.some(path => {
    // Verifica exatamente /league ou inicia com /league/
    if (path === '/league/') {
      return pathname === '/league' || pathname?.startsWith('/league/');
    }
    return pathname?.startsWith(path);
  });
  
  // Renderiza o footer apenas para rotas não autenticadas
  if (!isAuthenticatedPath) {
    return <Footer />;
  }
  
  return null;
} 