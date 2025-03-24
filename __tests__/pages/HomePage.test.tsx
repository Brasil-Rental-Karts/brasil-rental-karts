import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

describe('Home Page', () => {
  it('renders the hero section with correct title', () => {
    render(<Home />);
    
    const title = screen.getByText('A Plataforma Definitiva para Ligas de Kart Rental');
    expect(title).toBeInTheDocument();
  });

  it('renders the features section', () => {
    render(<Home />);
    
    const featuresTitle = screen.getByText('Por que usar a Brasil Rental Karts?');
    expect(featuresTitle).toBeInTheDocument();
    
    // Check if all features are rendered
    expect(screen.getByText('Gestão de Competições')).toBeInTheDocument();
    expect(screen.getByText('Perfis de Pilotos')).toBeInTheDocument();
    expect(screen.getByText('Comunidade Conectada')).toBeInTheDocument();
  });

  it('renders the CTA section', () => {
    render(<Home />);
    
    const ctaTitle = screen.getByText('Pronto para começar?');
    expect(ctaTitle).toBeInTheDocument();
    
    const loginButton = screen.getAllByText('Login')[1]; // Get the second Login button (CTA section)
    expect(loginButton).toBeInTheDocument();
    expect(loginButton.closest('a')).toHaveAttribute('href', '/login');
  });
}); 