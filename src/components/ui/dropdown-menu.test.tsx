import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
} from './dropdown-menu';

// Mock radix-ui/react-dropdown-menu
jest.mock('@radix-ui/react-dropdown-menu', () => {
  const DropdownMenu = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dropdown-menu-root">{children}</div>
  );
  
  DropdownMenu.Trigger = ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <button data-testid="dropdown-menu-trigger" {...props}>{children}</button>
  );
  
  DropdownMenu.Portal = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dropdown-menu-portal">{children}</div>
  );
  
  DropdownMenu.Content = ({ className, children, ...props }: { className?: string; children: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="dropdown-menu-content" className={className} {...props}>{children}</div>
  );
  
  DropdownMenu.Group = ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="dropdown-menu-group" {...props}>{children}</div>
  );
  
  DropdownMenu.Item = ({ className, children, ...props }: { className?: string; children: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="dropdown-menu-item" className={className} {...props}>{children}</div>
  );
  
  DropdownMenu.CheckboxItem = ({ className, children, checked, ...props }: 
    { className?: string; children: React.ReactNode; checked?: boolean; [key: string]: unknown }) => (
    <div data-testid="dropdown-menu-checkbox-item" className={className} data-checked={checked} {...props}>{children}</div>
  );
  
  DropdownMenu.RadioGroup = ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="dropdown-menu-radio-group" {...props}>{children}</div>
  );
  
  DropdownMenu.RadioItem = ({ className, children, ...props }: { className?: string; children: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="dropdown-menu-radio-item" className={className} {...props}>{children}</div>
  );
  
  DropdownMenu.Label = ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <div data-testid="dropdown-menu-label" className={className} {...props} />
  );
  
  DropdownMenu.Separator = ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
    <hr data-testid="dropdown-menu-separator" className={className} {...props} />
  );
  
  DropdownMenu.Sub = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dropdown-menu-sub">{children}</div>
  );
  
  DropdownMenu.SubTrigger = ({ className, children, ...props }: 
    { className?: string; children: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="dropdown-menu-sub-trigger" className={className} {...props}>{children}</div>
  );
  
  DropdownMenu.SubContent = ({ className, children, ...props }: 
    { className?: string; children?: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="dropdown-menu-sub-content" className={className} {...props}>{children}</div>
  );

  DropdownMenu.ItemIndicator = ({ children }: { children: React.ReactNode }) => (
    <span data-testid="dropdown-menu-item-indicator">{children}</span>
  );

  return {
    Root: DropdownMenu,
    Trigger: DropdownMenu.Trigger,
    Portal: DropdownMenu.Portal,
    Content: DropdownMenu.Content,
    Group: DropdownMenu.Group,
    Item: DropdownMenu.Item,
    CheckboxItem: DropdownMenu.CheckboxItem,
    RadioGroup: DropdownMenu.RadioGroup,
    RadioItem: DropdownMenu.RadioItem,
    Label: DropdownMenu.Label,
    Separator: DropdownMenu.Separator,
    Sub: DropdownMenu.Sub,
    SubTrigger: DropdownMenu.SubTrigger,
    SubContent: DropdownMenu.SubContent,
    ItemIndicator: DropdownMenu.ItemIndicator
  };
});

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  CheckIcon: () => <span data-testid="check-icon">✓</span>,
  ChevronRightIcon: () => <span data-testid="chevron-right-icon">›</span>,
  CircleIcon: () => <span data-testid="circle-icon">○</span>,
}));

describe('DropdownMenu Component', () => {
  it('renders dropdown menu with trigger and content', () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item 1</DropdownMenuItem>
          <DropdownMenuItem>Item 2</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    expect(screen.getByTestId('dropdown-menu-root')).toBeInTheDocument();
    expect(screen.getByTestId('dropdown-menu-trigger')).toBeInTheDocument();
    expect(screen.getByText('Menu')).toBeInTheDocument();
    expect(screen.getByTestId('dropdown-menu-content')).toBeInTheDocument();
    expect(screen.getAllByTestId('dropdown-menu-item')).toHaveLength(2);
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('renders dropdown menu with checkbox items', () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Options</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem checked={true}>Option 1</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={false}>Option 2</DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const checkboxItems = screen.getAllByTestId('dropdown-menu-checkbox-item');
    expect(checkboxItems).toHaveLength(2);
    expect(checkboxItems[0]).toHaveAttribute('data-checked', 'true');
    expect(checkboxItems[1]).toHaveAttribute('data-checked', 'false');
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('renders dropdown menu with radio group', () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Select</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup>
            <DropdownMenuRadioItem value="1">Radio 1</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="2">Radio 2</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    expect(screen.getByTestId('dropdown-menu-radio-group')).toBeInTheDocument();
    expect(screen.getAllByTestId('dropdown-menu-radio-item')).toHaveLength(2);
    expect(screen.getByText('Radio 1')).toBeInTheDocument();
    expect(screen.getByText('Radio 2')).toBeInTheDocument();
  });

  it('renders dropdown menu with label, separator, and shortcut', () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>More</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem>New File</DropdownMenuItem>
          <DropdownMenuShortcut>⌘N</DropdownMenuShortcut>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Open</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    expect(screen.getByTestId('dropdown-menu-label')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
    expect(screen.getByTestId('dropdown-menu-separator')).toBeInTheDocument();
    expect(screen.getByText('⌘N')).toBeInTheDocument();
  });

  it('renders dropdown menu with submenu', () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Advanced</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Basic</DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>More Options</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Sub Item 1</DropdownMenuItem>
              <DropdownMenuItem>Sub Item 2</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    expect(screen.getByTestId('dropdown-menu-sub')).toBeInTheDocument();
    expect(screen.getByTestId('dropdown-menu-sub-trigger')).toBeInTheDocument();
    expect(screen.getByText('More Options')).toBeInTheDocument();
    expect(screen.getByTestId('dropdown-menu-sub-content')).toBeInTheDocument();
    expect(screen.getByText('Sub Item 1')).toBeInTheDocument();
    expect(screen.getByText('Sub Item 2')).toBeInTheDocument();
    expect(screen.getByTestId('chevron-right-icon')).toBeInTheDocument();
  });

  it('applies custom classes to dropdown menu items', () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger className="custom-trigger">Menu</DropdownMenuTrigger>
        <DropdownMenuContent className="custom-content">
          <DropdownMenuItem className="custom-item" inset>Item with inset</DropdownMenuItem>
          <DropdownMenuItem variant="destructive">Destructive Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    expect(screen.getByTestId('dropdown-menu-trigger')).toHaveClass('custom-trigger');
    expect(screen.getByTestId('dropdown-menu-content')).toHaveClass('custom-content');
    
    const items = screen.getAllByTestId('dropdown-menu-item');
    expect(items[0]).toHaveClass('custom-item');
    expect(items[0]).toHaveAttribute('data-inset', 'true');
    expect(items[1]).toHaveAttribute('data-variant', 'destructive');
  });
}); 