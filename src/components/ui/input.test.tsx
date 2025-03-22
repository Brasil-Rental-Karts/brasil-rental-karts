import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './input';

describe('Input Component', () => {
  it('renders an input with default attributes', () => {
    render(<Input placeholder="Enter your name" />);
    const inputElement = screen.getByPlaceholderText('Enter your name');
    
    expect(inputElement).toBeInTheDocument();
    // O tipo não é definido por padrão, então não verificamos isso
  });

  it('renders an input with specified type', () => {
    render(<Input type="email" placeholder="Enter your email" />);
    const inputElement = screen.getByPlaceholderText('Enter your email');
    
    expect(inputElement).toBeInTheDocument();
    expect(inputElement).toHaveAttribute('type', 'email');
  });

  it('applies custom className', () => {
    render(<Input className="custom-class" placeholder="Custom class input" />);
    const inputElement = screen.getByPlaceholderText('Custom class input');
    
    expect(inputElement).toHaveClass('custom-class');
  });

  it('handles user input correctly', async () => {
    const user = userEvent.setup();
    render(<Input placeholder="Type here" />);
    const inputElement = screen.getByPlaceholderText('Type here') as HTMLInputElement;
    
    await user.type(inputElement, 'Hello World');
    
    expect(inputElement.value).toBe('Hello World');
  });

  it('forwards additional props to the input element', () => {
    render(<Input placeholder="Test input" data-testid="test-input" aria-label="Test label" />);
    const inputElement = screen.getByPlaceholderText('Test input');
    
    expect(inputElement).toHaveAttribute('data-testid', 'test-input');
    expect(inputElement).toHaveAttribute('aria-label', 'Test label');
  });
}); 