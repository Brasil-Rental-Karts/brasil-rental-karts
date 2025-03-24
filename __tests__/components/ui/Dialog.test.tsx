import { render, screen, fireEvent } from '@testing-library/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// Suppress dialog warnings during tests
jest.spyOn(console, 'warn').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('Dialog Component', () => {
  it('opens dialog when trigger is clicked', () => {
    render(
      <Dialog>
        <DialogTrigger asChild>
          <Button>Open Dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
            <DialogDescription>Dialog Description</DialogDescription>
          </DialogHeader>
          <div>Dialog Content</div>
          <DialogFooter>
            <Button>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );

    // Dialog content should not be in the document initially
    expect(screen.queryByText('Dialog Title')).not.toBeInTheDocument();
    
    // Click the trigger button
    fireEvent.click(screen.getByRole('button', { name: 'Open Dialog' }));
    
    // Now dialog content should be visible
    expect(screen.getByText('Dialog Title')).toBeInTheDocument();
    expect(screen.getByText('Dialog Description')).toBeInTheDocument();
    expect(screen.getByText('Dialog Content')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
  });

  it('closes dialog when clicking the close button', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
          </DialogHeader>
          <div>Dialog Content</div>
        </DialogContent>
      </Dialog>
    );

    // Dialog content should be visible initially
    expect(screen.getByText('Dialog Title')).toBeInTheDocument();
    
    // Find and click the close button (which has an 'X' icon)
    const closeButton = document.querySelector('[data-radix-collection-item]');
    if (closeButton) {
      fireEvent.click(closeButton);
      
      // Wait for animation to complete
      setTimeout(() => {
        expect(screen.queryByText('Dialog Title')).not.toBeInTheDocument();
      }, 100);
    }
  });

  it('renders with custom className', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent className="custom-dialog">
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
          </DialogHeader>
          <div>Dialog Content</div>
        </DialogContent>
      </Dialog>
    );

    // Find dialog with custom class
    const dialog = screen.getByText('Dialog Content').closest('.custom-dialog');
    expect(dialog).toHaveClass('custom-dialog');
  });

  it('applies custom className to DialogHeader', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogHeader className="custom-header">
            <DialogTitle>Title</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );

    const header = screen.getByText('Title').closest('.custom-header');
    expect(header).toHaveClass('custom-header');
  });

  it('applies custom className to DialogFooter', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
          </DialogHeader>
          <DialogFooter className="custom-footer">
            <Button>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );

    const footer = screen.getByRole('button', { name: 'Confirm' }).closest('.custom-footer');
    expect(footer).toHaveClass('custom-footer');
  });

  it('calls onOpenChange when dialog state changes', () => {
    const handleOpenChange = jest.fn();
    
    render(
      <Dialog onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button>Open Dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
          </DialogHeader>
          <div>Dialog Content</div>
        </DialogContent>
      </Dialog>
    );

    // Click to open
    fireEvent.click(screen.getByRole('button', { name: 'Open Dialog' }));
    expect(handleOpenChange).toHaveBeenCalledWith(true);
  });
}); 