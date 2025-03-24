import { render, screen } from '@testing-library/react';
import { Label } from '@/components/ui/label';

describe('Label Component', () => {
  it('renders correctly with text content', () => {
    render(<Label htmlFor="test-input">Test Label</Label>);
    const label = screen.getByText('Test Label');
    expect(label).toBeInTheDocument();
    expect(label).toHaveAttribute('for', 'test-input');
  });

  it('applies custom className', () => {
    render(<Label className="custom-label" htmlFor="name">Name</Label>);
    const label = screen.getByText('Name');
    expect(label).toHaveClass('custom-label');
  });

  it('renders with children components', () => {
    render(
      <Label htmlFor="complex-input">
        Label Text
        <span>Required</span>
      </Label>
    );
    
    expect(screen.getByText('Label Text')).toBeInTheDocument();
    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('forwards additional attributes to the label element', () => {
    render(
      <Label 
        htmlFor="test-input"
        data-testid="test-label"
        aria-label="Test label"
      >
        Test Label
      </Label>
    );
    
    const label = screen.getByText('Test Label');
    expect(label).toHaveAttribute('data-testid', 'test-label');
    expect(label).toHaveAttribute('aria-label', 'Test label');
  });

  it('renders as a different element when using asChild', () => {
    render(
      <Label asChild>
        <p id="description">Description Label</p>
      </Label>
    );
    
    const label = screen.getByText('Description Label');
    expect(label.tagName.toLowerCase()).toBe('p');
    expect(label).toHaveAttribute('id', 'description');
  });
}); 