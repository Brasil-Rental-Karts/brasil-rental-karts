import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption
} from './table';

describe('Table Component', () => {
  it('renders full table with all subcomponents', () => {
    render(
      <Table>
        <TableCaption>Dados de usuários</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>John Doe</TableCell>
            <TableCell>john@example.com</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Jane Smith</TableCell>
            <TableCell>jane@example.com</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={2}>Total: 2 usuários</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    );

    // Verificar se a tabela e o container estão presentes
    expect(screen.getByRole('table')).toBeInTheDocument();
    
    // Verificar cabeçalho
    expect(screen.getAllByRole('columnheader')).toHaveLength(2);
    expect(screen.getByText('Nome')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    
    // Verificar corpo da tabela
    expect(screen.getAllByRole('row')).toHaveLength(4); // 1 header + 2 body + 1 footer
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    
    // Verificar rodapé
    expect(screen.getByText('Total: 2 usuários')).toBeInTheDocument();
    
    // Verificar legenda
    expect(screen.getByText('Dados de usuários')).toBeInTheDocument();
  });

  it('applies custom classes to table components', () => {
    render(
      <Table className="custom-table" data-testid="table">
        <TableHeader className="custom-header" data-testid="table-header">
          <TableRow className="custom-row" data-testid="header-row">
            <TableHead className="custom-head" data-testid="table-head">Título</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="custom-body" data-testid="table-body">
          <TableRow className="custom-row" data-testid="body-row">
            <TableCell className="custom-cell" data-testid="table-cell">Conteúdo</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter className="custom-footer" data-testid="table-footer">
          <TableRow data-testid="footer-row">
            <TableCell>Rodapé</TableCell>
          </TableRow>
        </TableFooter>
        <TableCaption className="custom-caption" data-testid="table-caption">Legenda</TableCaption>
      </Table>
    );

    // Verificar classes personalizadas
    expect(screen.getByTestId('table')).toHaveClass('custom-table');
    expect(screen.getByTestId('table-header')).toHaveClass('custom-header');
    expect(screen.getByTestId('header-row')).toHaveClass('custom-row');
    expect(screen.getByTestId('table-head')).toHaveClass('custom-head');
    expect(screen.getByTestId('table-body')).toHaveClass('custom-body');
    expect(screen.getByTestId('body-row')).toHaveClass('custom-row');
    expect(screen.getByTestId('table-cell')).toHaveClass('custom-cell');
    expect(screen.getByTestId('table-footer')).toHaveClass('custom-footer');
    expect(screen.getByTestId('table-caption')).toHaveClass('custom-caption');
  });
  
  it('renders with data-slot attributes', () => {
    render(
      <Table data-testid="table">
        <TableHeader data-testid="table-header">
          <TableRow data-testid="header-row">
            <TableHead data-testid="table-head">Título</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody data-testid="table-body">
          <TableRow data-testid="body-row">
            <TableCell data-testid="table-cell">Conteúdo</TableCell>
          </TableRow>
        </TableBody>
        <TableCaption data-testid="table-caption">Legenda</TableCaption>
      </Table>
    );
    
    // Verificar data-slot attributes
    expect(screen.getByTestId('table').parentElement).toHaveAttribute('data-slot', 'table-container');
    expect(screen.getByTestId('table')).toHaveAttribute('data-slot', 'table');
    expect(screen.getByTestId('table-header')).toHaveAttribute('data-slot', 'table-header');
    expect(screen.getByTestId('header-row')).toHaveAttribute('data-slot', 'table-row');
    expect(screen.getByTestId('table-head')).toHaveAttribute('data-slot', 'table-head');
    expect(screen.getByTestId('table-body')).toHaveAttribute('data-slot', 'table-body');
    expect(screen.getByTestId('body-row')).toHaveAttribute('data-slot', 'table-row');
    expect(screen.getByTestId('table-cell')).toHaveAttribute('data-slot', 'table-cell');
    expect(screen.getByTestId('table-caption')).toHaveAttribute('data-slot', 'table-caption');
  });
}); 