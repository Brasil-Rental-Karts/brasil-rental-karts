import React from 'react';
import { render, screen } from '@testing-library/react';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';

// Mock para o @radix-ui/react-avatar
jest.mock('@radix-ui/react-avatar', () => ({
  Root: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => (
    <div data-testid="avatar-root" {...props}>{children}</div>
  ),
  Image: ({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img src={src} alt={alt} data-testid="avatar-image" {...props} />
  ),
  Fallback: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => (
    <div data-testid="avatar-fallback" {...props}>{children}</div>
  ),
}));

describe('Avatar Component', () => {
  it('renders avatar with image', () => {
    render(
      <Avatar>
        <AvatarImage src="/test-avatar.jpg" alt="User avatar" />
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    );
    
    // Verificar se o avatar root está presente
    expect(screen.getByTestId('avatar-root')).toBeInTheDocument();
    
    // Verificar se a imagem está presente com os atributos corretos
    const image = screen.getByTestId('avatar-image');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/test-avatar.jpg');
    expect(image).toHaveAttribute('alt', 'User avatar');
    
    // O fallback está no DOM mas não deveria ser visível quando a imagem existe
    expect(screen.getByTestId('avatar-fallback')).toBeInTheDocument();
  });
  
  it('renders avatar with fallback when image is not available', () => {
    render(
      <Avatar>
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    );
    
    // Verificar se o avatar root está presente
    expect(screen.getByTestId('avatar-root')).toBeInTheDocument();
    
    // Verificar se o fallback está presente e tem o conteúdo correto
    const fallback = screen.getByTestId('avatar-fallback');
    expect(fallback).toBeInTheDocument();
    expect(fallback).toHaveTextContent('JD');
  });
  
  it('applies custom classes to Avatar components', () => {
    render(
      <Avatar className="custom-avatar" data-testid="custom-avatar">
        <AvatarImage
          className="custom-image"
          data-testid="custom-image"
          src="/test-avatar.jpg"
          alt="User avatar"
        />
        <AvatarFallback className="custom-fallback" data-testid="custom-fallback">
          JD
        </AvatarFallback>
      </Avatar>
    );
    
    // Verificar classes personalizadas
    expect(screen.getByTestId('custom-avatar')).toHaveClass('custom-avatar');
    expect(screen.getByTestId('custom-image')).toHaveClass('custom-image');
    expect(screen.getByTestId('custom-fallback')).toHaveClass('custom-fallback');
  });
  
  it('renders Avatar with data-slot attributes', () => {
    render(
      <Avatar data-testid="avatar">
        <AvatarImage data-testid="image" src="/test-avatar.jpg" alt="User avatar" />
        <AvatarFallback data-testid="fallback">JD</AvatarFallback>
      </Avatar>
    );
    
    // Verificar data-slot attributes
    expect(screen.getByTestId('avatar')).toHaveAttribute('data-slot', 'avatar');
    expect(screen.getByTestId('image')).toHaveAttribute('data-slot', 'avatar-image');
    expect(screen.getByTestId('fallback')).toHaveAttribute('data-slot', 'avatar-fallback');
  });
}); 