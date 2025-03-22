import React from 'react';
import { render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField
} from './form';

// Mock para o @radix-ui/react-slot
jest.mock('@radix-ui/react-slot', () => ({
  Slot: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLElement>>) => (
    <div data-testid="slot-mock" {...props}>{children}</div>
  ),
}));

// Mock para o @radix-ui/react-label
jest.mock('@radix-ui/react-label', () => ({
  Root: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLLabelElement>>) => (
    <label data-testid="label-mock" {...props}>{children}</label>
  ),
}));

// Componente de teste que usa Form
function TestForm() {
  const form = useForm({
    defaultValues: {
      username: '',
    },
  });

  return (
    <Form {...form}>
      <form data-testid="test-form" onSubmit={form.handleSubmit(() => {})}>
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem data-testid="form-item">
              <FormLabel data-testid="form-label">Username</FormLabel>
              <FormControl data-testid="form-control">
                <input {...field} data-testid="form-input" />
              </FormControl>
              <FormDescription data-testid="form-description">
                Enter your username.
              </FormDescription>
              <FormMessage data-testid="form-message" />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}

// Componente de teste com erro
function TestFormWithError() {
  const form = useForm({
    defaultValues: {
      username: '',
    },
  });
  
  // Simular erro
  form.setError('username', { type: 'required', message: 'Username is required' });

  return (
    <Form {...form}>
      <form data-testid="test-form" onSubmit={form.handleSubmit(() => {})}>
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem data-testid="form-item">
              <FormLabel data-testid="form-label">Username</FormLabel>
              <FormControl data-testid="form-control">
                <input {...field} data-testid="form-input" />
              </FormControl>
              <FormDescription data-testid="form-description">
                Enter your username.
              </FormDescription>
              <FormMessage data-testid="form-message" />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}

// Componente para o teste de classes personalizadas
function CustomClassesForm() {
  const form = useForm();
  
  return (
    <Form {...form}>
      <form>
        <FormItem className="custom-item" data-testid="custom-item">
          <FormLabel className="custom-label" data-testid="custom-label">Custom Label</FormLabel>
          <FormDescription className="custom-desc" data-testid="custom-desc">Custom Description</FormDescription>
          <FormMessage className="custom-message" data-testid="custom-message">Custom Message</FormMessage>
        </FormItem>
      </form>
    </Form>
  );
}

describe('Form Component', () => {
  it('renders form components correctly', () => {
    render(<TestForm />);

    // Verificar se todos os componentes estão presentes
    expect(screen.getByTestId('test-form')).toBeInTheDocument();
    expect(screen.getByTestId('form-item')).toBeInTheDocument();
    expect(screen.getByTestId('form-label')).toBeInTheDocument();
    expect(screen.getByTestId('form-control')).toBeInTheDocument();
    expect(screen.getByTestId('form-input')).toBeInTheDocument();
    expect(screen.getByTestId('form-description')).toBeInTheDocument();
    
    // Verificar conteúdo
    expect(screen.getByText('Username')).toBeInTheDocument();
    expect(screen.getByText('Enter your username.')).toBeInTheDocument();
  });

  it('displays error message when form has errors', () => {
    render(<TestFormWithError />);
    
    // Verificar se a mensagem de erro é exibida
    expect(screen.getByText('Username is required')).toBeInTheDocument();
    
    // Verificar se o label tem o atributo data-error=true
    const label = screen.getByTestId('form-label');
    expect(label).toHaveAttribute('data-error', 'true');
    
    // Verificar se o campo de input tem aria-invalid=true
    const control = screen.getByTestId('form-control');
    expect(control).toHaveAttribute('aria-invalid', 'true');
  });

  it('applies custom classes to form components', () => {
    render(<CustomClassesForm />);
    
    // Verificar classes personalizadas
    expect(screen.getByTestId('custom-item')).toHaveClass('custom-item');
    expect(screen.getByTestId('custom-label')).toHaveClass('custom-label');
    expect(screen.getByTestId('custom-desc')).toHaveClass('custom-desc');
    expect(screen.getByTestId('custom-message')).toHaveClass('custom-message');
  });

  it('renders with data-slot attributes', () => {
    render(<TestForm />);
    
    // Verificar atributos data-slot
    expect(screen.getByTestId('form-item')).toHaveAttribute('data-slot', 'form-item');
    expect(screen.getByTestId('form-label')).toHaveAttribute('data-slot', 'form-label');
    expect(screen.getByTestId('form-control')).toHaveAttribute('data-slot', 'form-control');
    expect(screen.getByTestId('form-description')).toHaveAttribute('data-slot', 'form-description');
    
    // Usar queryByTestId para elementos que podem não estar presentes
    const formMessage = screen.queryByTestId('form-message');
    if (formMessage) {
      expect(formMessage).toHaveAttribute('data-slot', 'form-message');
    }
  });
}); 