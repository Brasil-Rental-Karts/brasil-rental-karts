import { render, screen } from '@testing-library/react';
import { Button } from './button';

describe('Button Component', () => {
  it('renders a button with the correct text', () => {
    render(<Button>Test Button</Button>);
    const buttonElement = screen.getByRole('button', { name: /test button/i });
    expect(buttonElement).toBeInTheDocument();
  });

  it('renders a button with the default variant', () => {
    render(<Button>Default Button</Button>);
    const buttonElement = screen.getByRole('button', { name: /default button/i });
    expect(buttonElement).toHaveClass('bg-primary');
  });

  it('renders a button with a custom variant', () => {
    render(<Button variant="outline">Outline Button</Button>);
    const buttonElement = screen.getByRole('button', { name: /outline button/i });
    expect(buttonElement).toHaveClass('border');
  });
}); 