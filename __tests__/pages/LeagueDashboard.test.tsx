import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LeagueDashboard from '@/app/league/[id]/page';
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// Mock de next/navigation
const mockRouterPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

// Mock do Supabase
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: jest.fn(),
}));

// Mock do React use
jest.mock('react', () => {
  const originalReact = jest.requireActual('react');
  return {
    ...originalReact,
    use: jest.fn((promise) => ({ id: 'league-123' })),
  };
});

describe('LeagueDashboard', () => {
  let mockSupabaseAuth: any;
  let mockSupabase: any;
  const mockLeague = {
    id: 'league-123',
    name: 'Liga de Teste',
    description: 'Descrição da liga de teste',
    created_at: '2023-01-01T00:00:00.000Z',
  };
  
  beforeEach(() => {
    // Reset do mock do router
    mockRouterPush.mockReset();
    
    // Setup mock da autenticação do Supabase
    mockSupabaseAuth = {
      getSession: jest.fn().mockResolvedValue({
        data: {
          session: {
            user: {
              id: 'user-123',
              email: 'test@example.com',
            }
          }
        }
      }),
    };
    
    // Setup mock para o Supabase client
    mockSupabase = {
      auth: mockSupabaseAuth,
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockLeague,
          error: null
        })
      })
    };
    
    (createClientComponentClient as jest.Mock).mockReturnValue(mockSupabase);
    
    // Spy no console.error para evitar logs de erros que possam ocorrer
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  it('exibe o loader durante o carregamento dos dados', () => {
    render(<LeagueDashboard params={Promise.resolve({ id: 'league-123' })} />);
    
    // Verificar que o loader está sendo exibido (usando a classe em vez de role)
    expect(screen.getByText('', { selector: '.animate-spin' })).toBeInTheDocument();
  });
  
  it('redireciona para a página de login se não houver sessão ativa', async () => {
    // Modificar mock para retornar uma sessão nula
    mockSupabaseAuth.getSession.mockResolvedValue({
      data: { session: null }
    });
    
    render(<LeagueDashboard params={Promise.resolve({ id: 'league-123' })} />);
    
    // Verificar que o redirecionamento ocorre
    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/login');
    }, { timeout: 2000 });
  });
  
  it('exibe uma mensagem quando a liga não é encontrada', async () => {
    // Modificar mock para retornar um erro
    mockSupabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Liga não encontrada' }
      })
    });
    
    render(<LeagueDashboard params={Promise.resolve({ id: 'league-123' })} />);
    
    // Verificar que a mensagem de liga não encontrada é exibida
    await waitFor(() => {
      expect(screen.getByText('Liga não encontrada')).toBeInTheDocument();
      expect(screen.getByText('Voltar para Minhas Ligas')).toBeInTheDocument();
    });
  });
  
  it('exibe os detalhes da liga corretamente', async () => {
    render(<LeagueDashboard params={Promise.resolve({ id: 'league-123' })} />);
    
    // Aguardar dados serem carregados
    await waitFor(() => {
      // Verificar nome da liga
      expect(screen.getByText('Liga de Teste')).toBeInTheDocument();
      // Verificar descrição da liga
      expect(screen.getByText('Descrição da liga de teste')).toBeInTheDocument();
      // Verificar elementos do dashboard
      expect(screen.getByText('Campeonatos Ativos')).toBeInTheDocument();
      expect(screen.getByText('Total de Pilotos')).toBeInTheDocument();
      expect(screen.getByText('Próxima Corrida')).toBeInTheDocument();
      // Verificar ações rápidas
      expect(screen.getByText('Ações Rápidas')).toBeInTheDocument();
      expect(screen.getByText('Campeonatos')).toBeInTheDocument();
      expect(screen.getByText('Estatísticas')).toBeInTheDocument();
      expect(screen.getByText('Rankings')).toBeInTheDocument();
    });
  });
  
  it('navega para a página de campeonatos ao clicar no botão', async () => {
    render(<LeagueDashboard params={Promise.resolve({ id: 'league-123' })} />);
    
    // Aguardar dados serem carregados e clicar no botão
    await waitFor(() => {
      // Clicar no botão de gerenciar campeonatos
      const button = screen.getByText('Gerenciar Campeonatos');
      fireEvent.click(button);
    });
    
    // Verificar que o redirecionamento ocorre para a página correta
    expect(mockRouterPush).toHaveBeenCalledWith('/league/league-123/championships');
  });
  
  it('volta para a página de pilotos ao clicar no botão voltar', async () => {
    render(<LeagueDashboard params={Promise.resolve({ id: 'league-123' })} />);
    
    // Aguardar dados serem carregados e clicar no botão
    await waitFor(() => {
      // Clicar no botão voltar
      const button = screen.getByText('Voltar');
      fireEvent.click(button);
    });
    
    // Verificar que o redirecionamento ocorre para a página correta
    expect(mockRouterPush).toHaveBeenCalledWith('/pilot');
  });
}); 