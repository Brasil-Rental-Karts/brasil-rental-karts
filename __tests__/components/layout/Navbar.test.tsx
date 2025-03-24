import { render, screen, fireEvent } from '@testing-library/react';
import { Navbar } from '@/components/layout/navbar';
import { usePathname } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    return <img {...props} />;
  },
}));

describe('Navbar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (usePathname as jest.Mock).mockReturnValue('/');
  });

  it('renders the logo', () => {
    render(<Navbar />);
    
    // Check if logos are rendered
    const logos = screen.getAllByAltText(/Brasil Rental Karts Logo|BRK Logo/);
    expect(logos.length).toBeGreaterThan(0);
  });

  it('renders the navigation links', () => {
    render(<Navbar />);
    
    // Check if the home link is rendered
    expect(screen.getByText('Início')).toBeInTheDocument();
  });

  it('renders the create account button', () => {
    render(<Navbar />);
    
    // Check if the create account button is rendered
    expect(screen.getByText('Criar Conta')).toBeInTheDocument();
  });

  it('applies active styling to the current route', () => {
    (usePathname as jest.Mock).mockReturnValue('/');
    
    render(<Navbar />);
    
    // Get the "Início" link which should be active
    const homeLink = screen.getByText('Início');
    
    // Check if it has the active class (text-primary)
    expect(homeLink.className).toContain('text-primary');
  });

  it('applies inactive styling to non-current routes', () => {
    // Mock a different current path
    (usePathname as jest.Mock).mockReturnValue('/different-path');
    
    render(<Navbar />);
    
    // Get the "Início" link which should not be active
    const homeLink = screen.getByText('Início');
    
    // Check if it has the inactive class (text-muted-foreground)
    expect(homeLink.className).toContain('text-muted-foreground');
  });

  it('opens the mobile menu when clicking the menu button', () => {
    render(<Navbar />);
    
    // Find and click the menu button
    const menuButton = screen.getByRole('button', { name: 'Menu' });
    fireEvent.click(menuButton);
    
    // Check if mobile menu is open (routes are visible)
    const mobileMenuLink = screen.getAllByText('Início')[1]; // Second instance is in the mobile menu
    expect(mobileMenuLink).toBeInTheDocument();
  });

  it('closes the mobile menu when clicking a link', () => {
    render(<Navbar />);
    
    // Open the mobile menu
    const menuButton = screen.getByRole('button', { name: 'Menu' });
    fireEvent.click(menuButton);
    
    // Find and click the mobile menu link
    const mobileMenuLink = screen.getAllByText('Início')[1]; // Second instance is in the mobile menu
    fireEvent.click(mobileMenuLink);
    
    // Check if mobile menu is closed (only one "Início" link should be visible)
    const homeLinks = screen.getAllByText('Início');
    expect(homeLinks.length).toBe(1);
  });
}); 