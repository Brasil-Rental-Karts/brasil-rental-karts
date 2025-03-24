import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '@/app/login/page';
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

describe('LoginPage', () => {
  let mockSupabaseAuth: any;
  
  beforeEach(() => {
    // Reset do mock do router
    mockRouterPush.mockReset();
    
    // Setup mock da autenticação do Supabase
    mockSupabaseAuth = {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      signInWithPassword: jest.fn().mockResolvedValue({ error: null }),
      signUp: jest.fn().mockResolvedValue({ error: null }),
    };
    
    (createClientComponentClient as jest.Mock).mockReturnValue({
      auth: mockSupabaseAuth,
    });
    
    // Spy no console.error para evitar logs de erros que possam ocorrer
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders login form correctly', () => {
    render(<LoginPage />);
    
    // Verificar elementos da página
    expect(screen.getByText('Bem-vindo de volta')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
    expect(screen.getByText('Não tem uma conta? Criar conta')).toBeInTheDocument();
  });
  
  it('switches to sign up mode when clicking the toggle button', () => {
    render(<LoginPage />);
    
    // Clique no botão para alternar para modo de cadastro
    fireEvent.click(screen.getByText('Não tem uma conta? Criar conta'));
    
    // Verificar que elementos mudaram usando seletores mais específicos
    expect(screen.getByRole('heading', { name: 'Criar conta' })).toBeInTheDocument();
    expect(screen.getByText('Já tem uma conta? Faça login')).toBeInTheDocument();
  });
  
  it('calls signInWithPassword when submitting login form', async () => {
    render(<LoginPage />);
    
    // Preencher formulário
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' }
    });
    
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'password123' }
    });
    
    // Enviar formulário
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    
    // Verificar que a função foi chamada com os parâmetros corretos
    await waitFor(() => {
      expect(mockSupabaseAuth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });
  
  it('calls signUp when in signup mode and submitting form', async () => {
    render(<LoginPage />);
    
    // Alternar para modo de cadastro
    fireEvent.click(screen.getByText('Não tem uma conta? Criar conta'));
    
    // Preencher formulário
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'newuser@example.com' }
    });
    
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'newpassword123' }
    });
    
    // Enviar formulário - selecionando pelo tipo e texto
    const submitButton = screen.getByRole('button', { name: 'Criar conta' });
    fireEvent.click(submitButton);
    
    // Verificar que a função foi chamada com os parâmetros corretos
    await waitFor(() => {
      expect(mockSupabaseAuth.signUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'newpassword123',
        options: expect.objectContaining({
          emailRedirectTo: expect.any(String),
        }),
      });
    });
  });
  
  it('shows error message when login fails', async () => {
    // Setup mock para simular falha de login
    mockSupabaseAuth.signInWithPassword.mockResolvedValue({
      error: { message: 'Invalid login credentials' }
    });
    
    render(<LoginPage />);
    
    // Preencher e enviar formulário
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'wrong@example.com' }
    });
    
    fireEvent.change(screen.getByLabelText('Senha'), {
      target: { value: 'wrongpassword' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    
    // Verificar que mensagem de erro é exibida
    await waitFor(() => {
      expect(screen.getByText('Email ou senha incorretos')).toBeInTheDocument();
    });
  });
}); 