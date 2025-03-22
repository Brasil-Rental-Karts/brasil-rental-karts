import React from 'react';
import { render, screen } from '@testing-library/react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';

// Mock radix-ui/react-tabs
jest.mock('@radix-ui/react-tabs', () => {
  const Tabs = ({ children, className, ...props }: { children: React.ReactNode; className?: string; [key: string]: unknown }) => (
    <div data-testid="tabs-root" className={className} {...props}>{children}</div>
  );
  
  Tabs.List = ({ children, className, ...props }: { children: React.ReactNode; className?: string; [key: string]: unknown }) => (
    <div data-testid="tabs-list" className={className} {...props}>{children}</div>
  );
  
  Tabs.Trigger = ({ children, className, ...props }: { children: React.ReactNode; className?: string; [key: string]: unknown }) => (
    <button data-testid="tabs-trigger" className={className} {...props}>{children}</button>
  );
  
  Tabs.Content = ({ children, className, ...props }: { children?: React.ReactNode; className?: string; [key: string]: unknown }) => (
    <div data-testid="tabs-content" className={className} {...props}>{children}</div>
  );
  
  return {
    Root: Tabs,
    List: Tabs.List,
    Trigger: Tabs.Trigger,
    Content: Tabs.Content,
  };
});

describe('Tabs Component', () => {
  it('renders tabs with all subcomponents', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );
    
    // Verificar se os componentes base foram renderizados
    expect(screen.getByTestId('tabs-root')).toBeInTheDocument();
    expect(screen.getByTestId('tabs-list')).toBeInTheDocument();
    expect(screen.getAllByTestId('tabs-trigger')).toHaveLength(2);
    expect(screen.getAllByTestId('tabs-content')).toHaveLength(2);
    
    // Verificar conteúdo
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Tab 2')).toBeInTheDocument();
    expect(screen.getByText('Content 1')).toBeInTheDocument();
    expect(screen.getByText('Content 2')).toBeInTheDocument();
  });
  
  it('applies custom classes to tab components', () => {
    render(
      <Tabs className="custom-tabs" defaultValue="tab1">
        <TabsList className="custom-list">
          <TabsTrigger className="custom-trigger" value="tab1">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent className="custom-content" value="tab1">Content</TabsContent>
      </Tabs>
    );
    
    expect(screen.getByTestId('tabs-root')).toHaveClass('custom-tabs');
    expect(screen.getByTestId('tabs-list')).toHaveClass('custom-list');
    expect(screen.getByTestId('tabs-trigger')).toHaveClass('custom-trigger');
    expect(screen.getByTestId('tabs-content')).toHaveClass('custom-content');
  });
  
  it('passes values and defaultValue correctly', () => {
    render(
      <Tabs defaultValue="tab2">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2" data-state="active">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );
    
    const triggers = screen.getAllByTestId('tabs-trigger');
    expect(triggers[1]).toHaveAttribute('data-state', 'active');
    expect(triggers[1]).toHaveAttribute('value', 'tab2');
    
    const contents = screen.getAllByTestId('tabs-content');
    expect(contents[0]).toHaveAttribute('value', 'tab1');
    expect(contents[1]).toHaveAttribute('value', 'tab2');
  });
  
  it('renders tabs with additional attributes', () => {
    render(
      <Tabs data-test="tabs-attr">
        <TabsList aria-label="Tabs Example">
          <TabsTrigger value="tab1" disabled>Disabled Tab</TabsTrigger>
          <TabsTrigger value="tab2" aria-selected="true">Selected Tab</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1" hidden>Hidden Content</TabsContent>
        <TabsContent value="tab2" role="tabpanel">Visible Content</TabsContent>
      </Tabs>
    );
    
    expect(screen.getByTestId('tabs-root')).toHaveAttribute('data-test', 'tabs-attr');
    expect(screen.getByTestId('tabs-list')).toHaveAttribute('aria-label', 'Tabs Example');
    
    const triggers = screen.getAllByTestId('tabs-trigger');
    expect(triggers[0]).toHaveAttribute('disabled');
    expect(triggers[1]).toHaveAttribute('aria-selected', 'true');
    
    const contents = screen.getAllByTestId('tabs-content');
    expect(contents[0]).toHaveAttribute('hidden');
    expect(contents[1]).toHaveAttribute('role', 'tabpanel');
  });
}); 