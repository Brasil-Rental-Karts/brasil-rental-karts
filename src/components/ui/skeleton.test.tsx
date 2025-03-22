import { render, screen } from '@testing-library/react';
import { Skeleton } from './skeleton';

describe('Skeleton Component', () => {
  it('renders with default styles', () => {
    render(<Skeleton data-testid="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('bg-accent');
    expect(skeleton).toHaveClass('animate-pulse');
    expect(skeleton).toHaveClass('rounded-md');
  });

  it('applies custom className', () => {
    render(<Skeleton className="custom-class" data-testid="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    
    expect(skeleton).toHaveClass('custom-class');
    expect(skeleton).toHaveClass('bg-accent');
    expect(skeleton).toHaveClass('animate-pulse');
    expect(skeleton).toHaveClass('rounded-md');
  });

  it('renders with children', () => {
    render(
      <Skeleton data-testid="skeleton">
        <div>Child content</div>
      </Skeleton>
    );
    const skeleton = screen.getByTestId('skeleton');
    
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveTextContent('Child content');
  });
}); 