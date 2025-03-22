import { render, screen } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction
} from './card';

describe('Card Components', () => {
  describe('Card Component', () => {
    it('renders correctly with default props', () => {
      render(<Card data-testid="card">Card Content</Card>);
      const card = screen.getByTestId('card');
      
      expect(card).toBeInTheDocument();
      expect(card).toHaveTextContent('Card Content');
      expect(card).toHaveClass('bg-card', 'text-card-foreground');
    });

    it('applies custom className', () => {
      render(<Card className="custom-class" data-testid="card">Card Content</Card>);
      const card = screen.getByTestId('card');
      
      expect(card).toHaveClass('custom-class');
    });
  });

  describe('CardHeader Component', () => {
    it('renders correctly with default props', () => {
      render(<CardHeader data-testid="card-header">Header Content</CardHeader>);
      const header = screen.getByTestId('card-header');
      
      expect(header).toBeInTheDocument();
      expect(header).toHaveTextContent('Header Content');
    });

    it('applies custom className', () => {
      render(<CardHeader className="custom-header" data-testid="card-header">Header Content</CardHeader>);
      const header = screen.getByTestId('card-header');
      
      expect(header).toHaveClass('custom-header');
    });
  });

  describe('CardTitle Component', () => {
    it('renders correctly with default props', () => {
      render(<CardTitle data-testid="card-title">Title Content</CardTitle>);
      const title = screen.getByTestId('card-title');
      
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent('Title Content');
      expect(title).toHaveClass('font-semibold');
    });
  });

  describe('CardDescription Component', () => {
    it('renders correctly with default props', () => {
      render(<CardDescription data-testid="card-description">Description Content</CardDescription>);
      const description = screen.getByTestId('card-description');
      
      expect(description).toBeInTheDocument();
      expect(description).toHaveTextContent('Description Content');
      expect(description).toHaveClass('text-muted-foreground');
    });
  });

  describe('CardContent Component', () => {
    it('renders correctly with default props', () => {
      render(<CardContent data-testid="card-content">Content</CardContent>);
      const content = screen.getByTestId('card-content');
      
      expect(content).toBeInTheDocument();
      expect(content).toHaveTextContent('Content');
      expect(content).toHaveClass('px-6');
    });
  });

  describe('CardFooter Component', () => {
    it('renders correctly with default props', () => {
      render(<CardFooter data-testid="card-footer">Footer Content</CardFooter>);
      const footer = screen.getByTestId('card-footer');
      
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveTextContent('Footer Content');
      expect(footer).toHaveClass('flex', 'items-center');
    });
  });

  describe('CardAction Component', () => {
    it('renders correctly with default props', () => {
      render(<CardAction data-testid="card-action">Action Content</CardAction>);
      const action = screen.getByTestId('card-action');
      
      expect(action).toBeInTheDocument();
      expect(action).toHaveTextContent('Action Content');
      expect(action).toHaveClass('col-start-2');
    });
  });

  describe('Card Composition', () => {
    it('renders a complete card with all components', () => {
      render(
        <Card data-testid="complete-card">
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card Description</CardDescription>
            <CardAction>
              <button>Action</button>
            </CardAction>
          </CardHeader>
          <CardContent>
            This is the main content of the card.
          </CardContent>
          <CardFooter>
            <button>Cancel</button>
            <button>Submit</button>
          </CardFooter>
        </Card>
      );
      
      const card = screen.getByTestId('complete-card');
      expect(card).toBeInTheDocument();
      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText('Card Description')).toBeInTheDocument();
      expect(screen.getByText('This is the main content of the card.')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Submit')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
    });
  });
}); 