import React from 'react';
import { render, screen } from '@testing-library/react';
import * as nextFontGoogle from 'next/font/google';
import RootLayout from './layout';

// Mock para os componentes importados
jest.mock('@/components/layout/navbar', () => ({
  Navbar: () => <nav data-testid="navbar-mock">Navbar Mock</nav>,
}));

jest.mock('@/components/layout/footer', () => ({
  Footer: () => <footer data-testid="footer-mock">Footer Mock</footer>,
}));

// Mock para next/font/google
jest.mock('next/font/google', () => ({
  Geist: jest.fn().mockReturnValue({
    variable: 'geist-sans-mock',
  }),
  Geist_Mono: jest.fn().mockReturnValue({
    variable: 'geist-mono-mock',
  }),
}));

// Criar uma versão simplificada do RootLayout para teste
// Esta abordagem permite testar a lógica sem problemas com a tag html
const SimplifiedRootLayout = () => {
  const { children } = { children: <div data-testid="child-content">Test Content</div> };
  const layout = RootLayout({ children });
  
  // Verificar propriedades específicas no JSX retornado
  const htmlProps = layout.props;
  const bodyProps = layout.props.children[1].props;
  const mainProps = layout.props.children[1].props.children[1].props;
  
  return (
    <div data-testid="test-container">
      <div data-testid="html-props" data-lang={htmlProps.lang} />
      <div data-testid="body-props" className={bodyProps.className} />
      <div data-testid="main-props" className={mainProps.className} />
      <nav data-testid="navbar-component">{layout.props.children[1].props.children[0]}</nav>
      <main data-testid="main-component">{layout.props.children[1].props.children[1].props.children}</main>
      <footer data-testid="footer-component">{layout.props.children[1].props.children[2]}</footer>
    </div>
  );
};

describe('RootLayout Component', () => {
  it('renders layout with correct attributes and components', () => {
    render(<SimplifiedRootLayout />);
    
    // Verificar atributos HTML
    const htmlProps = screen.getByTestId('html-props');
    expect(htmlProps).toHaveAttribute('data-lang', 'pt-BR');
    
    // Verificar classes no body
    const bodyProps = screen.getByTestId('body-props');
    expect(bodyProps.className).toContain('geist-sans-mock');
    expect(bodyProps.className).toContain('geist-mono-mock');
    expect(bodyProps.className).toContain('antialiased');
    
    // Verificar classes no main
    const mainProps = screen.getByTestId('main-props');
    expect(mainProps.className).toContain('pt-16');
    expect(mainProps.className).toContain('min-h-screen');
    
    // Verificar componentes
    expect(screen.getByTestId('navbar-component')).toBeInTheDocument();
    expect(screen.getByTestId('main-component')).toBeInTheDocument();
    expect(screen.getByTestId('footer-component')).toBeInTheDocument();
  });
  
  it('uses correct font configurations', () => {
    render(<SimplifiedRootLayout />);
    
    // Verificar se as fontes foram configuradas corretamente
    expect(nextFontGoogle.Geist).toHaveBeenCalledWith({
      variable: '--font-geist-sans',
      subsets: ['latin'],
    });
    
    expect(nextFontGoogle.Geist_Mono).toHaveBeenCalledWith({
      variable: '--font-geist-mono',
      subsets: ['latin'],
    });
  });
}); 