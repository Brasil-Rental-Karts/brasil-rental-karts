import { render, screen } from '@testing-library/react';
import { Footer } from './footer';

// Mock next/image porque ele não funciona diretamente em testes
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ComponentProps<'img'>) => {
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    return <img {...props} />;
  },
}));

// Mock next/link para testes
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('Footer Component', () => {
  it('renders the footer with correct content', () => {
    render(<Footer />);
    
    // Verifica logo e título
    expect(screen.getByText('Brasil Rental Karts')).toBeInTheDocument();
    expect(screen.getByAltText('Brasil Rental Karts Logo')).toBeInTheDocument();
    
    // Verifica texto de descrição
    expect(screen.getByText(/plataforma definitiva para organização e gestão de ligas/i)).toBeInTheDocument();
    
    // Verifica links rápidos
    expect(screen.getByText('Links Rápidos')).toBeInTheDocument();
    expect(screen.getByText('Página Inicial')).toBeInTheDocument();
    expect(screen.getByText('Criar Conta')).toBeInTheDocument();
    
    // Verifica informações de contato
    expect(screen.getByText('Contato')).toBeInTheDocument();
    expect(screen.getByText('contato@brasilrentalkarts.com.br')).toBeInTheDocument();
    expect(screen.getByText('(47) 99999-9999')).toBeInTheDocument();
    expect(screen.getByText('Blumenau, SC')).toBeInTheDocument();
    
    // Verifica redes sociais
    expect(screen.getByText('Redes Sociais')).toBeInTheDocument();
    expect(screen.getByText(/Acompanhe nossas redes sociais/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Instagram')).toBeInTheDocument();
    expect(screen.getByLabelText('YouTube')).toBeInTheDocument();
    expect(screen.getByLabelText('X (Twitter)')).toBeInTheDocument();
    
    // Verifica links legais de rodapé
    expect(screen.getByText('Termos de Uso')).toBeInTheDocument();
    expect(screen.getByText('Política de Privacidade')).toBeInTheDocument();
    expect(screen.getByText('Cookies')).toBeInTheDocument();
    
    // Verifica copyright com o ano atual
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`© ${currentYear} Brasil Rental Karts`))).toBeInTheDocument();
  });

  it('renders all social media links with correct URLs', () => {
    render(<Footer />);
    
    const instagramLink = screen.getByLabelText('Instagram');
    const youtubeLink = screen.getByLabelText('YouTube');
    const xLink = screen.getByLabelText('X (Twitter)');
    
    expect(instagramLink).toHaveAttribute('href', 'https://instagram.com');
    expect(youtubeLink).toHaveAttribute('href', 'https://youtube.com');
    expect(xLink).toHaveAttribute('href', 'https://x.com');
  });

  it('renders WhatsApp link with correct URL', () => {
    render(<Footer />);
    
    const whatsappLink = screen.getByText('(47) 99999-9999');
    expect(whatsappLink).toHaveAttribute('href', 'https://wa.me/5547999999999');
    expect(whatsappLink).toHaveAttribute('target', '_blank');
    expect(whatsappLink).toHaveAttribute('rel', 'noopener noreferrer');
  });
}); 