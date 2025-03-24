import { render, screen, fireEvent } from '@testing-library/react';
import { Textarea } from '@/components/ui/textarea';

describe('Textarea Component', () => {
  it('renders correctly with default props', () => {
    render(<Textarea placeholder="Enter description" />);
    const textarea = screen.getByPlaceholderText('Enter description');
    expect(textarea).toBeInTheDocument();
    expect(textarea.tagName.toLowerCase()).toBe('textarea');
  });

  it('applies custom className', () => {
    render(<Textarea className="custom-textarea" placeholder="Custom textarea" />);
    const textarea = screen.getByPlaceholderText('Custom textarea');
    expect(textarea).toHaveClass('custom-textarea');
  });

  it('can be disabled', () => {
    render(<Textarea disabled placeholder="Disabled textarea" />);
    const textarea = screen.getByPlaceholderText('Disabled textarea');
    expect(textarea).toBeDisabled();
  });

  it('accepts user input', () => {
    render(<Textarea placeholder="Type here" />);
    const textarea = screen.getByPlaceholderText('Type here');
    
    fireEvent.change(textarea, { target: { value: 'Hello\nWorld' } });
    expect(textarea).toHaveValue('Hello\nWorld');
  });

  it('calls onChange when textarea value changes', () => {
    const handleChange = jest.fn();
    render(<Textarea placeholder="Test textarea" onChange={handleChange} />);
    const textarea = screen.getByPlaceholderText('Test textarea');
    
    fireEvent.change(textarea, { target: { value: 'test value' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('can have rows attribute', () => {
    render(<Textarea rows={10} placeholder="Tall textarea" />);
    const textarea = screen.getByPlaceholderText('Tall textarea');
    expect(textarea).toHaveAttribute('rows', '10');
  });

  it('forwards additional props to the textarea element', () => {
    render(
      <Textarea 
        placeholder="Enter comments" 
        maxLength={200}
        aria-label="Comments input"
        data-testid="comments-input"
      />
    );
    const textarea = screen.getByPlaceholderText('Enter comments');
    expect(textarea).toHaveAttribute('maxLength', '200');
    expect(textarea).toHaveAttribute('aria-label', 'Comments input');
    expect(textarea).toHaveAttribute('data-testid', 'comments-input');
  });

  it('can have default value', () => {
    render(<Textarea defaultValue="Default text" />);
    const textarea = screen.getByDisplayValue('Default text');
    expect(textarea).toBeInTheDocument();
  });

  it('can be read-only', () => {
    render(<Textarea readOnly value="Read only content" />);
    const textarea = screen.getByDisplayValue('Read only content');
    expect(textarea).toHaveAttribute('readonly');
    
    // Try to change the value
    fireEvent.change(textarea, { target: { value: 'new value' } });
    
    // In a real browser, the value wouldn't change because it's read-only
    // but in tests, the attribute doesn't actually prevent modification
    // so we don't assert on the value here
  });
}); 