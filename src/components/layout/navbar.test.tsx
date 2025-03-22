import { render, screen, fireEvent } from '@testing-library/react';
import { Navbar } from './navbar';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ComponentProps<'img'>) => {
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    return <img {...props} />;
  },
}));

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <a {...props}>{children}</a>
  ),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

describe('Navbar Component', () => {
  it('renders the navbar with logo and links', () => {
    render(<Navbar />);
    
    // Verifica se o logo está presente
    expect(screen.getByAltText('Brasil Rental Karts Logo')).toBeInTheDocument();
    expect(screen.getByAltText('BRK Logo')).toBeInTheDocument();
    
    // Verifica se os links de navegação estão presentes
    expect(screen.getByText('Início')).toBeInTheDocument();
    
    // Verifica se o botão "Criar Conta" está presente
    expect(screen.getByText('Criar Conta')).toBeInTheDocument();
  });

  it('applies active styles to current route', () => {
    render(<Navbar />);
    
    // Como o pathname mockado é '/', o link "Início" deve ter a classe text-primary
    const homeLink = screen.getByText('Início');
    expect(homeLink).toHaveClass('text-primary');
  });

  it('renders mobile menu button on small screens', () => {
    render(<Navbar />);
    
    // Verifica se o botão de menu mobile está presente
    const menuButton = screen.getByRole('button', { name: 'Menu' });
    expect(menuButton).toBeInTheDocument();
  });

  it('toggles mobile menu when menu button is clicked', () => {
    render(<Navbar />);
    
    // Clica no botão do menu
    const menuButton = screen.getByRole('button', { name: 'Menu' });
    fireEvent.click(menuButton);
    
    // Verifica se o menu mobile está visível
    const mobileNav = screen.getByRole('navigation');
    expect(mobileNav).toBeInTheDocument();
    
    // Verifica se o link "Início" está presente no menu mobile
    const mobileHomeLink = screen.getAllByText('Início')[1]; // O segundo "Início" é o do menu mobile
    expect(mobileHomeLink).toBeInTheDocument();
    
    // Clica no link para fechar o menu
    fireEvent.click(mobileHomeLink);
  });
}); 