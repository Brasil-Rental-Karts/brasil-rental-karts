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
} from '@/components/ui/table';

describe('Table Component', () => {
  it('renders the table with default classes', () => {
    render(
      <Table>
        <tbody>
          <tr>
            <td>Content</td>
          </tr>
        </tbody>
      </Table>
    );
    
    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();
    expect(table).toHaveClass('w-full');
    expect(table).toHaveClass('caption-bottom');
    expect(table).toHaveClass('text-sm');
  });
  
  it('renders with custom className', () => {
    render(
      <Table className="test-class">
        <tbody>
          <tr>
            <td>Content</td>
          </tr>
        </tbody>
      </Table>
    );
    
    const table = screen.getByRole('table');
    expect(table).toHaveClass('test-class');
  });
  
  it('renders with children', () => {
    render(
      <Table>
        <tbody>
          <tr>
            <td>Test Content</td>
          </tr>
        </tbody>
      </Table>
    );
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
});

describe('TableHeader Component', () => {
  it('renders the table header with default classes', () => {
    render(
      <Table>
        <TableHeader>
          <tr>
            <th>Header</th>
          </tr>
        </TableHeader>
      </Table>
    );
    
    const thead = screen.getByRole('rowgroup');
    expect(thead).toBeInTheDocument();
    expect(thead).toHaveAttribute('data-slot', 'table-header');
    expect(thead.className).toContain('[&_tr]:border-b');
  });
  
  it('renders with custom className', () => {
    render(
      <Table>
        <TableHeader className="test-class">
          <tr>
            <th>Header</th>
          </tr>
        </TableHeader>
      </Table>
    );
    
    const thead = screen.getByRole('rowgroup');
    expect(thead).toHaveClass('test-class');
  });
});

describe('TableBody Component', () => {
  it('renders the table body with default classes', () => {
    render(
      <Table>
        <TableBody>
          <tr>
            <td>Body Cell</td>
          </tr>
        </TableBody>
      </Table>
    );
    
    const tbody = screen.getByRole('rowgroup');
    expect(tbody).toBeInTheDocument();
    expect(tbody).toHaveAttribute('data-slot', 'table-body');
    expect(tbody.className).toContain('[&_tr:last-child]:border-0');
  });
  
  it('renders with custom className', () => {
    render(
      <Table>
        <TableBody className="test-class">
          <tr>
            <td>Body Cell</td>
          </tr>
        </TableBody>
      </Table>
    );
    
    const tbody = screen.getByRole('rowgroup');
    expect(tbody).toHaveClass('test-class');
  });
});

describe('TableFooter Component', () => {
  it('renders the table footer with default classes', () => {
    render(
      <Table>
        <TableFooter>
          <tr>
            <td>Footer</td>
          </tr>
        </TableFooter>
      </Table>
    );
    
    const tfoot = screen.getByRole('rowgroup');
    expect(tfoot).toBeInTheDocument();
    expect(tfoot).toHaveAttribute('data-slot', 'table-footer');
    expect(tfoot.className).toContain('bg-muted/50');
    expect(tfoot.className).toContain('border-t');
  });
  
  it('renders with custom className', () => {
    render(
      <Table>
        <TableFooter className="test-class">
          <tr>
            <td>Footer</td>
          </tr>
        </TableFooter>
      </Table>
    );
    
    const tfoot = screen.getByRole('rowgroup');
    expect(tfoot).toHaveClass('test-class');
  });
});

describe('TableRow Component', () => {
  it('renders the table row with default classes', () => {
    render(
      <Table>
        <tbody>
          <TableRow>
            <td>Row Cell</td>
          </TableRow>
        </tbody>
      </Table>
    );
    
    const tr = screen.getByRole('row');
    expect(tr).toBeInTheDocument();
    expect(tr).toHaveAttribute('data-slot', 'table-row');
    expect(tr.className).toContain('hover:bg-muted/50');
    expect(tr.className).toContain('border-b');
  });
  
  it('renders with custom className', () => {
    render(
      <Table>
        <tbody>
          <TableRow className="test-class">
            <td>Row Cell</td>
          </TableRow>
        </tbody>
      </Table>
    );
    
    const tr = screen.getByRole('row');
    expect(tr).toHaveClass('test-class');
  });
});

describe('TableHead Component', () => {
  it('renders the table header cell with default classes', () => {
    render(
      <Table>
        <TableHeader>
          <tr>
            <TableHead>Header Cell</TableHead>
          </tr>
        </TableHeader>
      </Table>
    );
    
    const th = screen.getByRole('columnheader');
    expect(th).toBeInTheDocument();
    expect(th).toHaveAttribute('data-slot', 'table-head');
    expect(th.className).toContain('text-foreground');
    expect(th.className).toContain('font-medium');
  });
  
  it('renders with custom className', () => {
    render(
      <Table>
        <TableHeader>
          <tr>
            <TableHead className="test-class">Header Cell</TableHead>
          </tr>
        </TableHeader>
      </Table>
    );
    
    const th = screen.getByRole('columnheader');
    expect(th).toHaveClass('test-class');
  });
});

describe('TableCell Component', () => {
  it('renders the table cell with default classes', () => {
    render(
      <Table>
        <tbody>
          <tr>
            <TableCell>Cell Content</TableCell>
          </tr>
        </tbody>
      </Table>
    );
    
    const td = screen.getByRole('cell');
    expect(td).toBeInTheDocument();
    expect(td).toHaveAttribute('data-slot', 'table-cell');
    expect(td.className).toContain('p-2');
    expect(td.className).toContain('align-middle');
  });
  
  it('renders with custom className', () => {
    render(
      <Table>
        <tbody>
          <tr>
            <TableCell className="test-class">Cell Content</TableCell>
          </tr>
        </tbody>
      </Table>
    );
    
    const td = screen.getByRole('cell');
    expect(td).toHaveClass('test-class');
  });
});

describe('TableCaption Component', () => {
  it('renders the table caption with default classes', () => {
    render(
      <Table>
        <TableCaption>Table Caption</TableCaption>
        <tbody>
          <tr>
            <td>Content</td>
          </tr>
        </tbody>
      </Table>
    );
    
    const caption = screen.getByText('Table Caption');
    expect(caption).toBeInTheDocument();
    expect(caption).toHaveAttribute('data-slot', 'table-caption');
    expect(caption.className).toContain('text-muted-foreground');
    expect(caption.className).toContain('mt-4');
  });
  
  it('renders with custom className', () => {
    render(
      <Table>
        <TableCaption className="test-class">Table Caption</TableCaption>
        <tbody>
          <tr>
            <td>Content</td>
          </tr>
        </tbody>
      </Table>
    );
    
    const caption = screen.getByText('Table Caption');
    expect(caption).toHaveClass('test-class');
  });
});

describe('Table Integration', () => {
  it('renders a complete table with all components', () => {
    render(
      <Table>
        <TableCaption>Sample users data</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
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
            <TableCell colSpan={2}>Total users: 2</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    );
    
    // Check if main components are rendered
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Sample users data')).toBeInTheDocument();
    
    // Check if header cells are rendered
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    
    // Check if body cells are rendered
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    
    // Check if footer is rendered
    expect(screen.getByText('Total users: 2')).toBeInTheDocument();
  });
}); 