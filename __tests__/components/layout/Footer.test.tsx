import { render, screen } from '@testing-library/react';
import { Footer } from '@/components/layout/footer';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    return <img {...props} />;
  },
}));

describe('Footer Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the logo and title', () => {
    render(<Footer />);
    
    // Check if the logo is rendered
    expect(screen.getByAltText('Brasil Rental Karts Logo')).toBeInTheDocument();
    
    // Check if the title is rendered
    expect(screen.getByText('Brasil Rental Karts')).toBeInTheDocument();
  });

  it('renders the about text', () => {
    render(<Footer />);
    
    // Check if the about text is rendered
    expect(screen.getByText(/A plataforma definitiva para organização e gestão de ligas de kart rental no Brasil/i)).toBeInTheDocument();
  });

  it('renders the quick links section', () => {
    render(<Footer />);
    
    // Check if the quick links header is rendered
    expect(screen.getByText('Links Rápidos')).toBeInTheDocument();
    
    // Check if the links are rendered
    expect(screen.getByText('Página Inicial')).toBeInTheDocument();
    expect(screen.getByText('Criar Conta')).toBeInTheDocument();
  });

  it('renders the contact section', () => {
    render(<Footer />);
    
    // Check if the contact header is rendered
    expect(screen.getByText('Contato')).toBeInTheDocument();
    
    // Check if contact details are rendered
    expect(screen.getByText('contato@brasilrentalkarts.com.br')).toBeInTheDocument();
    expect(screen.getByText('(47) 99999-9999')).toBeInTheDocument();
    expect(screen.getByText('Blumenau, SC')).toBeInTheDocument();
  });

  it('renders the social media section', () => {
    render(<Footer />);
    
    // Check if the social media header is rendered
    expect(screen.getByText('Redes Sociais')).toBeInTheDocument();
    
    // Check if the social media text is rendered
    expect(screen.getByText(/Acompanhe nossas redes sociais para novidades do mundo do kart rental/i)).toBeInTheDocument();
    
    // Check if the social media links are rendered
    expect(screen.getByLabelText('Instagram')).toBeInTheDocument();
    expect(screen.getByLabelText('YouTube')).toBeInTheDocument();
    expect(screen.getByLabelText('X (Twitter)')).toBeInTheDocument();
  });

  it('renders the copyright information with current year', () => {
    // Mock current year
    const currentYear = new Date().getFullYear();
    
    render(<Footer />);
    
    // Check if the copyright text with current year is rendered
    expect(screen.getByText(`© ${currentYear} Brasil Rental Karts. Todos os direitos reservados.`)).toBeInTheDocument();
  });

  it('renders the legal links', () => {
    render(<Footer />);
    
    // Check if legal links are rendered
    expect(screen.getByText('Termos de Uso')).toBeInTheDocument();
    expect(screen.getByText('Política de Privacidade')).toBeInTheDocument();
    expect(screen.getByText('Cookies')).toBeInTheDocument();
  });
}); 