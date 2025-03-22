import React from 'react';
import { render, screen } from '@testing-library/react';
import Home from './page';

// Mock next/link
jest.mock('next/link', () => {
  return ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href} data-testid="next-link">{children}</a>
  );
});

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Trophy: () => <div data-testid="trophy-icon">Trophy</div>,
  UserRound: () => <div data-testid="user-icon">User</div>,
  Users: () => <div data-testid="users-icon">Users</div>,
  Medal: () => <div data-testid="medal-icon">Medal</div>,
}));

describe('Home Page', () => {
  it('renders the hero section with heading and call to action buttons', () => {
    render(<Home />);

    // Verifica o título principal
    expect(screen.getByText('A Plataforma Definitiva para Ligas de Kart Rental')).toBeInTheDocument();

    // Verifica a descrição
    expect(screen.getByText(/Gerenciamento completo de competições/)).toBeInTheDocument();

    // Verifica os botões de call to action
    const links = screen.getAllByTestId('next-link');
    const createLeagueLink = links.find(link => link.textContent === 'Criar Liga');
    const pilotProfileLink = links.find(link => link.textContent === 'Perfil de Piloto');

    expect(createLeagueLink).toBeInTheDocument();
    expect(pilotProfileLink).toBeInTheDocument();
    expect(createLeagueLink).toHaveAttribute('href', '/ligas');
    expect(pilotProfileLink).toHaveAttribute('href', '/pilotos');
  });

  it('renders the features section with 3 cards', () => {
    render(<Home />);

    // Verifica o título da seção
    expect(screen.getByText('Por que usar a Brasil Rental Karts?')).toBeInTheDocument();

    // Verifica os títulos das features - usando uma consulta mais específica
    const titles = screen.getAllByText('Gestão de Competições');
    const featuresTitle = titles.find(el => el.closest('[data-slot="card-title"]'));
    expect(featuresTitle).toBeInTheDocument();
    
    expect(screen.getByText('Perfis de Pilotos')).toBeInTheDocument();
    expect(screen.getByText('Comunidade Conectada')).toBeInTheDocument();

    // Verifica as descrições
    expect(screen.getByText(/Sistema completo para criação e gerenciamento de campeonatos/)).toBeInTheDocument();
    expect(screen.getByText(/Cadastro de pilotos com histórico de resultados/)).toBeInTheDocument();
    expect(screen.getByText(/Conecte-se com outras ligas e pilotos/)).toBeInTheDocument();

    // Verifica os ícones
    expect(screen.getAllByTestId('trophy-icon')[0]).toBeInTheDocument();
    expect(screen.getByTestId('user-icon')).toBeInTheDocument();
    expect(screen.getByTestId('users-icon')).toBeInTheDocument();
  });

  it('renders the solutions section with 2 cards', () => {
    render(<Home />);

    // Verifica o título da seção
    expect(screen.getByText('Para Ligas e Pilotos')).toBeInTheDocument();

    // Verifica os títulos das soluções
    expect(screen.getByText('Para Organizadores de Ligas')).toBeInTheDocument();
    expect(screen.getByText('Para Pilotos')).toBeInTheDocument();

    // Verifica as categorias - usando uma consulta mais específica para evitar duplicatas
    const categories = screen.getAllByText('Gestão de Competições');
    const categoryText = categories.find(el => el.closest('[data-slot="card-description"]'));
    expect(categoryText).toBeInTheDocument();
    
    expect(screen.getByText('Perfil e Participação')).toBeInTheDocument();

    // Verifica as descrições
    expect(screen.getByText(/Ferramentas para criar campeonatos/)).toBeInTheDocument();
    expect(screen.getByText(/Crie seu perfil, acompanhe seu histórico de corridas/)).toBeInTheDocument();

    // Verifica os botões de "Saiba Mais"
    const buttons = screen.getAllByText('Saiba Mais');
    expect(buttons).toHaveLength(2);
  });

  it('renders the CTA section with button', () => {
    render(<Home />);

    // Verifica o título da seção
    expect(screen.getByText('Pronto para transformar sua liga?')).toBeInTheDocument();

    // Verifica a descrição
    expect(screen.getByText(/Crie uma conta e comece a gerenciar suas competições/)).toBeInTheDocument();

    // Verifica o botão
    const createAccountLink = screen.getAllByTestId('next-link').find(link => link.textContent === 'Criar Conta');
    expect(createAccountLink).toBeInTheDocument();
    expect(createAccountLink).toHaveAttribute('href', '/cadastro');
  });

  it('renders all required sections in the correct order', () => {
    render(<Home />);

    const pageContent = document.body.textContent || '';
    
    // Verifica se as seções estão na ordem correta verificando a posição dos títulos
    const heroTitlePos = pageContent.indexOf('A Plataforma Definitiva para Ligas de Kart Rental');
    const featuresTitlePos = pageContent.indexOf('Por que usar a Brasil Rental Karts?');
    const solutionsTitlePos = pageContent.indexOf('Para Ligas e Pilotos');
    const ctaTitlePos = pageContent.indexOf('Pronto para transformar sua liga?');
    
    expect(heroTitlePos).toBeLessThan(featuresTitlePos);
    expect(featuresTitlePos).toBeLessThan(solutionsTitlePos);
    expect(solutionsTitlePos).toBeLessThan(ctaTitlePos);
  });
}); 