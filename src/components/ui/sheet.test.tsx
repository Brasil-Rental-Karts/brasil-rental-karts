import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  SheetClose
} from './sheet';

// Mock radix-ui/react-dialog
jest.mock('@radix-ui/react-dialog', () => {
  const Dialog = ({ children }: { children: React.ReactNode }) => <>{children}</>;
  Dialog.Trigger = ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <button {...props}>{children}</button>
  );
  Dialog.Portal = ({ children }: { children: React.ReactNode }) => <div data-testid="portal">{children}</div>;
  Dialog.Overlay = ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <div data-testid="overlay" className={className} {...props} />
  );
  Dialog.Content = ({ className, children, ...props }: { className?: string; children: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="content" className={className} {...props}>{children}</div>
  );
  Dialog.Close = ({ className, children, ...props }: { className?: string; children?: React.ReactNode; [key: string]: unknown }) => (
    <button data-testid="close" className={className} {...props}>{children}</button>
  );
  Dialog.Title = ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <h2 data-testid="title" className={className} {...props} />
  );
  Dialog.Description = ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <p data-testid="description" className={className} {...props} />
  );
  
  return {
    Root: Dialog,
    Trigger: Dialog.Trigger,
    Portal: Dialog.Portal,
    Overlay: Dialog.Overlay,
    Content: Dialog.Content,
    Close: Dialog.Close,
    Title: Dialog.Title,
    Description: Dialog.Description,
  };
});

// Mock lucide-react for Icon
jest.mock('lucide-react', () => ({
  XIcon: () => <span data-testid="x-icon">X</span>,
}));

describe('Sheet Component', () => {
  it('renders Sheet with all its subcomponents', () => {
    render(
      <Sheet>
        <SheetTrigger data-testid="trigger">Open Sheet</SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Sheet Title</SheetTitle>
            <SheetDescription>Sheet Description</SheetDescription>
          </SheetHeader>
          <div>Content</div>
          <SheetFooter>
            <SheetClose data-testid="close-button">Close</SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );

    // Verifica se o trigger foi renderizado
    const trigger = screen.getByTestId('trigger');
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveTextContent('Open Sheet');

    // Verifica se os outros componentes foram renderizados
    expect(screen.getByTestId('portal')).toBeInTheDocument();
    expect(screen.getByTestId('overlay')).toBeInTheDocument();
    expect(screen.getByTestId('content')).toBeInTheDocument();
    expect(screen.getByTestId('title')).toBeInTheDocument();
    expect(screen.getByTestId('description')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.getByTestId('close')).toBeInTheDocument();
    expect(screen.getByTestId('x-icon')).toBeInTheDocument();
  });

  it('renders sheet content with different sides', () => {
    const { rerender } = render(
      <SheetContent side="right" data-testid="content" />
    );
    expect(screen.getByTestId('content')).toHaveClass('inset-y-0', 'right-0');
    
    rerender(<SheetContent side="left" data-testid="content" />);
    expect(screen.getByTestId('content')).toHaveClass('inset-y-0', 'left-0');
    
    rerender(<SheetContent side="top" data-testid="content" />);
    expect(screen.getByTestId('content')).toHaveClass('inset-x-0', 'top-0');
    
    rerender(<SheetContent side="bottom" data-testid="content" />);
    expect(screen.getByTestId('content')).toHaveClass('inset-x-0', 'bottom-0');
  });

  it('applies custom classes to all components', () => {
    render(
      <Sheet>
        <SheetTrigger className="custom-trigger" data-testid="trigger">Trigger</SheetTrigger>
        <SheetContent className="custom-content">
          <SheetHeader className="custom-header" data-testid="header">
            <SheetTitle className="custom-title">Title</SheetTitle>
            <SheetDescription className="custom-description">Description</SheetDescription>
          </SheetHeader>
          <SheetFooter className="custom-footer" data-testid="footer">
            Footer
          </SheetFooter>
          <SheetClose className="custom-close" data-testid="custom-close">Close</SheetClose>
        </SheetContent>
      </Sheet>
    );
    
    expect(screen.getByTestId('trigger')).toHaveClass('custom-trigger');
    expect(screen.getByTestId('content')).toHaveClass('custom-content');
    expect(screen.getByTestId('header')).toHaveClass('custom-header');
    expect(screen.getByTestId('title')).toHaveClass('custom-title');
    expect(screen.getByTestId('description')).toHaveClass('custom-description');
    expect(screen.getByTestId('footer')).toHaveClass('custom-footer');
    expect(screen.getByTestId('custom-close')).toHaveClass('custom-close');
  });
}); 