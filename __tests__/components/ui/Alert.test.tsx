import { render, screen } from '@testing-library/react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

describe('Alert Component', () => {
  it('renders the alert with default variant', () => {
    render(
      <Alert>Alert content</Alert>
    );
    
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveClass('bg-background');
    expect(alert).toHaveTextContent('Alert content');
  });

  it('renders the alert with destructive variant', () => {
    render(
      <Alert variant="destructive">Alert content</Alert>
    );
    
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveClass('border-destructive/50');
    expect(alert).toHaveTextContent('Alert content');
  });

  it('renders with custom className', () => {
    render(
      <Alert className="test-class">Alert content</Alert>
    );
    
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('test-class');
  });

  it('renders nested content correctly', () => {
    render(
      <Alert>
        <p>Paragraph inside alert</p>
        <span>Span inside alert</span>
      </Alert>
    );
    
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Paragraph inside alert');
    expect(alert).toHaveTextContent('Span inside alert');
  });
});

describe('AlertTitle Component', () => {
  it('renders the alert title', () => {
    render(
      <AlertTitle>Alert Title</AlertTitle>
    );
    
    const title = screen.getByRole('heading', { level: 5 });
    expect(title).toBeInTheDocument();
    expect(title).toHaveTextContent('Alert Title');
    expect(title).toHaveClass('mb-1');
    expect(title).toHaveClass('font-medium');
  });

  it('renders with custom className', () => {
    render(
      <AlertTitle className="test-class">Alert Title</AlertTitle>
    );
    
    const title = screen.getByRole('heading', { level: 5 });
    expect(title).toHaveClass('test-class');
  });
});

describe('AlertDescription Component', () => {
  it('renders the alert description', () => {
    render(
      <AlertDescription>Alert Description</AlertDescription>
    );
    
    const description = screen.getByText('Alert Description');
    expect(description).toBeInTheDocument();
    expect(description).toHaveClass('text-sm');
  });

  it('renders with custom className', () => {
    render(
      <AlertDescription className="test-class">Alert Description</AlertDescription>
    );
    
    const description = screen.getByText('Alert Description');
    expect(description).toHaveClass('test-class');
  });
});

describe('Alert Integration', () => {
  it('renders a complete alert with title and description', () => {
    render(
      <Alert>
        <AlertTitle>Alert Title</AlertTitle>
        <AlertDescription>Alert Description</AlertDescription>
      </Alert>
    );
    
    const alert = screen.getByRole('alert');
    const title = screen.getByRole('heading', { level: 5 });
    const description = screen.getByText('Alert Description');
    
    expect(alert).toContainElement(title);
    expect(alert).toContainElement(description);
  });

  it('renders a destructive alert with title and description', () => {
    render(
      <Alert variant="destructive">
        <AlertTitle>Error Alert</AlertTitle>
        <AlertDescription>There was an error processing your request.</AlertDescription>
      </Alert>
    );
    
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('border-destructive/50');
    expect(screen.getByText('Error Alert')).toBeInTheDocument();
    expect(screen.getByText('There was an error processing your request.')).toBeInTheDocument();
  });
}); 