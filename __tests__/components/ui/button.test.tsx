import React from 'react';
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Button className="custom-button">Button</Button>);
    const button = screen.getByRole('button', { name: 'Button' });
    expect(button).toHaveClass('custom-button');
  });

  it('applies default variant class', () => {
    render(<Button>Default Button</Button>);
    const button = screen.getByRole('button', { name: 'Default Button' });
    expect(button).toHaveClass('bg-primary');
  });

  it('applies outline variant class when specified', () => {
    render(<Button variant="outline">Outline Button</Button>);
    const button = screen.getByRole('button', { name: 'Outline Button' });
    expect(button).toHaveClass('border-input');
  });

  it('can be disabled', () => {
    render(<Button disabled>Disabled Button</Button>);
    expect(screen.getByRole('button', { name: 'Disabled Button' })).toBeDisabled();
  });

  it('renders with variant primary by default', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: 'Click me' });
    // O estilo exato depende da implementação do componente
    expect(button).not.toHaveClass('outline');
    expect(button).not.toHaveClass('secondary');
  });

  it('renders with different variants', () => {
    render(<Button variant="destructive">Destructive</Button>);
    const destructiveButton = screen.getByRole('button', { name: 'Destructive' });
    expect(destructiveButton).toHaveClass('bg-destructive');
    expect(destructiveButton).toHaveClass('text-destructive-foreground');
  });

  it('renders with different sizes', () => {
    render(<Button size="sm">Small</Button>);
    const smallButton = screen.getByRole('button', { name: 'Small' });
    expect(smallButton).toHaveClass('h-8 px-3 text-xs');
  });

  it('renders as a different element when using asChild', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );
    const linkButton = screen.getByRole('link', { name: 'Link Button' });
    expect(linkButton).toBeInTheDocument();
    expect(linkButton).toHaveAttribute('href', '/test');
  });

  it('disables the button when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    const disabledButton = screen.getByRole('button', { name: 'Disabled' });
    expect(disabledButton).toBeDisabled();
  });
}); 