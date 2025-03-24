import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '@/components/ui/input';

describe('Input Component', () => {
  it('renders correctly with default props', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Input className="custom-input" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('custom-input');
  });

  it('accepts input type attribute', () => {
    render(<Input type="password" data-testid="password-input" />);
    const input = screen.getByTestId("password-input");
    expect(input).toHaveAttribute('type', 'password');
  });

  it('handles placeholder correctly', () => {
    render(<Input placeholder="Enter text here" />);
    const input = screen.getByPlaceholderText('Enter text here');
    expect(input).toBeInTheDocument();
  });

  it('handles value changes', () => {
    const handleChange = jest.fn();
    render(<Input onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test value' } });
    
    expect(handleChange).toHaveBeenCalled();
  });

  it('accepts disabled attribute', () => {
    render(<Input disabled />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('accepts required attribute', () => {
    render(<Input required />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('required');
  });

  it('applies id attribute correctly', () => {
    render(<Input id="test-input" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('id', 'test-input');
  });

  it('can be disabled', () => {
    render(<Input disabled placeholder="Disabled input" />);
    const input = screen.getByPlaceholderText('Disabled input');
    expect(input).toBeDisabled();
  });

  it('accepts user input', () => {
    render(<Input placeholder="Type here" />);
    const input = screen.getByPlaceholderText('Type here');
    
    fireEvent.change(input, { target: { value: 'Hello World' } });
    expect(input).toHaveValue('Hello World');
  });

  it('calls onChange when input value changes', () => {
    const handleChange = jest.fn();
    render(<Input placeholder="Test input" onChange={handleChange} />);
    const input = screen.getByPlaceholderText('Test input');
    
    fireEvent.change(input, { target: { value: 'test value' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('can have autocomplete attributes', () => {
    render(<Input autoComplete="username" placeholder="Username" />);
    const input = screen.getByPlaceholderText('Username');
    expect(input).toHaveAttribute('autoComplete', 'username');
  });

  it('forwards additional props to the input element', () => {
    render(
      <Input 
        placeholder="Enter email" 
        maxLength={50}
        aria-label="Email input"
        data-testid="email-input"
      />
    );
    const input = screen.getByPlaceholderText('Enter email');
    expect(input).toHaveAttribute('maxLength', '50');
    expect(input).toHaveAttribute('aria-label', 'Email input');
    expect(input).toHaveAttribute('data-testid', 'email-input');
  });
}); 