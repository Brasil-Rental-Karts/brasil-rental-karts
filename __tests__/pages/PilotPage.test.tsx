import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PilotPage from '@/app/pilot/page';
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

describe('PilotPage', () => {
  let mockSupabaseAuth: any;
  let mockSupabase: any;
  const mockLeagues = [
    {
      id: '1',
      name: 'Liga Teste 1',
      description: 'Descrição da liga teste 1',
      created_at: '2023-01-01T00:00:00.000Z',
    },
    {
      id: '2',
      name: 'Liga Teste 2',
      description: 'Descrição da liga teste 2',
      created_at: '2023-01-02T00:00:00.000Z',
    },
  ];
  
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
              user_metadata: {
                name: 'Piloto Teste',
                avatar_url: 'https://example.com/avatar.jpg'
              }
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
        order: jest.fn().mockResolvedValue({
          data: mockLeagues,
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
    render(<PilotPage />);
    
    // Verificar que o loader está sendo exibido (usando a classe em vez de role)
    expect(screen.getByText('', { selector: '.animate-spin' })).toBeInTheDocument();
  });
  
  it('redireciona para a página de login se não houver sessão ativa', async () => {
    // Modificar mock para retornar uma sessão nula
    mockSupabaseAuth.getSession.mockResolvedValue({
      data: { session: null }
    });
    
    render(<PilotPage />);
    
    // Verificar que o redirecionamento ocorre
    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/login');
    }, { timeout: 2000 });
  });
  
  it('exibe os dados do usuário e as ligas corretamente', async () => {
    // Corrigir o mock do Supabase para retornar os dados corretamente
    mockSupabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis()
    });
    
    mockSupabase.from().order.mockResolvedValue({
      data: mockLeagues,
      error: null
    });
    
    render(<PilotPage />);
    
    // Aguardar dados serem carregados
    await waitFor(() => {
      // Verificar nome do usuário
      expect(screen.getByText('Piloto Teste')).toBeInTheDocument();
      // Verificar email do usuário
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      // Verificar contagem de ligas
      expect(screen.getByText('2')).toBeInTheDocument();
      // Verificar nomes das ligas
      expect(screen.getByText('Liga Teste 1')).toBeInTheDocument();
      expect(screen.getByText('Liga Teste 2')).toBeInTheDocument();
    });
  });
  
  it('navega para os detalhes da liga ao clicar no botão', async () => {
    // Corrigir o mock do Supabase para retornar os dados corretamente
    mockSupabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis()
    });
    
    mockSupabase.from().order.mockResolvedValue({
      data: mockLeagues,
      error: null
    });
    
    render(<PilotPage />);
    
    // Aguardar dados serem carregados e clicar no botão
    await waitFor(() => {
      // Obter todos os botões "Ver Detalhes"
      const buttons = screen.getAllByText('Ver Detalhes');
      // Clicar no primeiro botão
      fireEvent.click(buttons[0]);
    });
    
    // Verificar que o redirecionamento ocorre para a página correta
    expect(mockRouterPush).toHaveBeenCalledWith('/league/1');
  });
}); 