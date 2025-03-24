import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';

describe('Card Component', () => {
  it('renders Card with all subcomponents', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Card Content</p>
        </CardContent>
        <CardFooter>
          <p>Card Footer</p>
        </CardFooter>
      </Card>
    );

    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Description')).toBeInTheDocument();
    expect(screen.getByText('Card Content')).toBeInTheDocument();
    expect(screen.getByText('Card Footer')).toBeInTheDocument();
  });

  it('renders Card with custom className', () => {
    render(
      <Card className="custom-card">
        <CardContent>Content</CardContent>
      </Card>
    );

    const content = screen.getByText('Content');
    const card = content.closest('.custom-card');
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('custom-card');
  });

  it('applies custom className to CardHeader', () => {
    render(
      <Card>
        <CardHeader className="custom-header">
          <CardTitle>Title</CardTitle>
        </CardHeader>
      </Card>
    );

    const title = screen.getByText('Title');
    const header = title.closest('.custom-header');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('custom-header');
  });

  it('applies custom className to CardFooter', () => {
    render(
      <Card>
        <CardFooter className="custom-footer">
          <p>Footer</p>
        </CardFooter>
      </Card>
    );

    const footer = screen.getByText('Footer').closest('.custom-footer');
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveClass('custom-footer');
  });

  it('applies custom className to CardTitle', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle className="custom-title">Title</CardTitle>
        </CardHeader>
      </Card>
    );

    const title = screen.getByText('Title');
    expect(title).toHaveClass('custom-title');
  });

  it('applies custom className to CardDescription', () => {
    render(
      <Card>
        <CardHeader>
          <CardDescription className="custom-description">Description</CardDescription>
        </CardHeader>
      </Card>
    );

    const description = screen.getByText('Description');
    expect(description).toHaveClass('custom-description');
  });

  it('applies custom className to CardContent', () => {
    render(
      <Card>
        <CardContent className="custom-content">Content</CardContent>
      </Card>
    );

    const content = screen.getByText('Content').closest('.custom-content');
    expect(content).toBeInTheDocument();
    expect(content).toHaveClass('custom-content');
  });

  it('renders Card as a different element when using asChild', () => {
    render(
      <Card asChild>
        <article>
          <CardContent>Article Content</CardContent>
        </article>
      </Card>
    );

    const article = screen.getByText('Article Content').closest('article');
    expect(article).toBeInTheDocument();
  });

  it('renders card with children', () => {
    render(
      <Card>
        <div>Card Content</div>
      </Card>
    );
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('renders CardHeader with title and description', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
      </Card>
    );
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Description')).toBeInTheDocument();
  });

  it('renders CardContent with content', () => {
    render(
      <Card>
        <CardContent>
          <p>Content paragraph</p>
        </CardContent>
      </Card>
    );
    expect(screen.getByText('Content paragraph')).toBeInTheDocument();
  });

  it('renders CardFooter with footer content', () => {
    render(
      <Card>
        <CardFooter>
          <button>Footer Button</button>
        </CardFooter>
      </Card>
    );
    expect(screen.getByRole('button', { name: 'Footer Button' })).toBeInTheDocument();
  });

  it('applies custom className to CardHeader', () => {
    render(
      <Card>
        <CardHeader className="custom-header">
          <CardTitle>Card Title</CardTitle>
        </CardHeader>
      </Card>
    );
    const header = screen.getByText('Card Title').closest('[data-slot="card-header"]');
    expect(header).toHaveClass('custom-header');
  });

  it('applies custom className to CardContent', () => {
    render(
      <Card>
        <CardContent className="custom-content">
          Content
        </CardContent>
      </Card>
    );
    const content = screen.getByText('Content').closest('[data-slot="card-content"]');
    expect(content).toHaveClass('custom-content');
  });

  it('renders with children', () => {
    render(<Card>Card Content</Card>);
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Card className="custom-card">Card Content</Card>);
    const card = screen.getByText('Card Content');
    expect(card).toHaveClass('custom-card');
  });

  it('renders CardHeader with title and description', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
      </Card>
    );
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Description')).toBeInTheDocument();
  });

  it('renders CardContent with content', () => {
    render(
      <Card>
        <CardContent>Content paragraph</CardContent>
      </Card>
    );
    expect(screen.getByText('Content paragraph')).toBeInTheDocument();
  });

  it('renders CardFooter with footer content', () => {
    render(
      <Card>
        <CardFooter>
          <button>Footer Button</button>
        </CardFooter>
      </Card>
    );
    expect(screen.getByRole('button', { name: 'Footer Button' })).toBeInTheDocument();
  });

  it('applies custom className to CardHeader', () => {
    render(
      <Card>
        <CardHeader className="custom-header">Header Content</CardHeader>
      </Card>
    );
    const header = screen.getByText('Header Content');
    expect(header).toHaveClass('custom-header');
  });

  it('applies custom className to CardContent', () => {
    render(
      <Card>
        <CardContent className="custom-content">Content</CardContent>
      </Card>
    );
    const content = screen.getByText('Content');
    expect(content).toHaveClass('custom-content');
  });
});