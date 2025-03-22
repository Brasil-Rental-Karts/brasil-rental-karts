import { render, screen } from '@testing-library/react';
import { Label } from './label';

// Mock do Radix UI
jest.mock('@radix-ui/react-label', () => ({
  Root: ({ children, className, ...props }: { children: React.ReactNode; className?: string; [key: string]: unknown }) => (
    <label className={className} data-slot="label" {...props}>
      {children}
    </label>
  ),
}));

describe('Label Component', () => {
  it('renders with the correct text', () => {
    render(<Label>Test Label</Label>);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Label className="custom-class" data-testid="label">Label with custom class</Label>);
    const label = screen.getByTestId('label');
    
    expect(label).toHaveClass('custom-class');
  });

  it('forwards additional props to the label element', () => {
    render(<Label data-testid="test-label" htmlFor="test-input">Label for input</Label>);
    const label = screen.getByTestId('test-label');
    
    expect(label).toHaveAttribute('data-testid', 'test-label');
  });

  it('renders with children components', () => {
    render(
      <Label data-testid="label-with-children">
        <span>Child span</span>
        <div>Child div</div>
      </Label>
    );
    
    expect(screen.getByText('Child span')).toBeInTheDocument();
    expect(screen.getByText('Child div')).toBeInTheDocument();
  });
}); 