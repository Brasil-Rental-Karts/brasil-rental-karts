import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose
} from './dialog';

// Mock radix-ui/react-dialog
jest.mock('@radix-ui/react-dialog', () => {
  const Dialog = ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-root">{children}</div>;
  Dialog.Trigger = ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <button data-testid="dialog-trigger" {...props}>{children}</button>
  );
  Dialog.Portal = ({ children }: { children: React.ReactNode }) => <div data-testid="dialog-portal">{children}</div>;
  Dialog.Overlay = ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <div data-testid="dialog-overlay" className={className} {...props} />
  );
  Dialog.Content = ({ className, children, ...props }: { className?: string; children: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="dialog-content" className={className} {...props}>{children}</div>
  );
  Dialog.Close = ({ className, children, ...props }: { className?: string; children?: React.ReactNode; [key: string]: unknown }) => (
    <button data-testid="dialog-close" className={className} {...props}>{children}</button>
  );
  Dialog.Title = ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <h2 data-testid="dialog-title" className={className} {...props} />
  );
  Dialog.Description = ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <p data-testid="dialog-description" className={className} {...props} />
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

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  XIcon: () => <span data-testid="x-icon">X</span>,
}));

describe('Dialog Component', () => {
  it('renders Dialog with all its subcomponents', () => {
    render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
            <DialogDescription>Dialog Description</DialogDescription>
          </DialogHeader>
          <div>Content</div>
          <DialogFooter>
            <button>Action Button</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );

    // Verifica se o Dialog e o trigger foram renderizados
    expect(screen.getByTestId('dialog-root')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-trigger')).toBeInTheDocument();
    expect(screen.getByText('Open Dialog')).toBeInTheDocument();

    // Verifica se o conteúdo do Dialog foi renderizado
    expect(screen.getByTestId('dialog-portal')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
    
    // Verifica elementos internos do Dialog
    expect(screen.getByTestId('dialog-title')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-description')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.getByText('Action Button')).toBeInTheDocument();
    expect(screen.getByTestId('x-icon')).toBeInTheDocument();
  });

  it('applies custom classes to dialog components', () => {
    render(
      <Dialog>
        <DialogTrigger className="custom-trigger">Open</DialogTrigger>
        <DialogContent className="custom-content">
          <DialogHeader className="custom-header">
            <DialogTitle className="custom-title">Title</DialogTitle>
            <DialogDescription className="custom-description">Description</DialogDescription>
          </DialogHeader>
          <DialogFooter className="custom-footer" data-testid="dialog-footer">
            <DialogClose className="custom-close" data-testid="custom-dialog-close">Close Button</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );

    // Verifica as classes personalizadas
    expect(screen.getByTestId('dialog-trigger')).toHaveClass('custom-trigger');
    expect(screen.getByTestId('dialog-content')).toHaveClass('custom-content');
    expect(screen.getByTestId('dialog-title')).toHaveClass('custom-title');
    expect(screen.getByTestId('dialog-description')).toHaveClass('custom-description');
    expect(screen.getByTestId('custom-dialog-close')).toHaveClass('custom-close');
    
    // Verifica classes nos elementos div do DialogHeader e DialogFooter
    const header = screen.getByText('Title').closest('div');
    const footer = screen.getByTestId('dialog-footer');
    expect(header).toHaveClass('custom-header');
    expect(footer).toHaveClass('custom-footer');
  });

  it('renders dialog with correct ARIA and data attributes', () => {
    render(
      <Dialog>
        <DialogTrigger aria-label="Open dialog">Open</DialogTrigger>
        <DialogContent aria-labelledby="dialog-title">
          <DialogHeader>
            <DialogTitle id="dialog-title">Accessible Title</DialogTitle>
            <DialogDescription id="dialog-desc">Accessible Description</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );

    // Verifica atributos de acessibilidade
    expect(screen.getByTestId('dialog-trigger')).toHaveAttribute('aria-label', 'Open dialog');
    expect(screen.getByTestId('dialog-content')).toHaveAttribute('aria-labelledby', 'dialog-title');
    expect(screen.getByTestId('dialog-title')).toHaveAttribute('id', 'dialog-title');
    expect(screen.getByTestId('dialog-description')).toHaveAttribute('id', 'dialog-desc');
  });
}); 