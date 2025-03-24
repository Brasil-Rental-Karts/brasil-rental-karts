import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateLeagueModal } from '@/components/create-league-modal';
import { useRouter } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('CreateLeagueModal Component', () => {
  const mockRouter = {
    push: jest.fn(),
  };
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ league: { id: '123' } }),
    });
  });

  it('renders the button to open the modal', () => {
    render(<CreateLeagueModal onSuccess={mockOnSuccess} />);
    expect(screen.getByText('Nova Liga')).toBeInTheDocument();
  });

  it('opens the modal when the button is clicked', () => {
    render(<CreateLeagueModal onSuccess={mockOnSuccess} />);
    
    // Modal content is not visible initially
    expect(screen.queryByText('Criar Nova Liga')).not.toBeInTheDocument();
    
    // Click the button to open the modal
    fireEvent.click(screen.getByText('Nova Liga'));
    
    // Now the modal content should be visible
    expect(screen.getByText('Criar Nova Liga')).toBeInTheDocument();
  });

  it('handles form submission correctly', async () => {
    render(<CreateLeagueModal onSuccess={mockOnSuccess} />);
    
    // Open the modal
    fireEvent.click(screen.getByText('Nova Liga'));
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText('Nome da Liga'), {
      target: { value: 'Test League' },
    });
    
    fireEvent.change(screen.getByLabelText('Descrição'), {
      target: { value: 'Test Description' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByText('Criar Liga'));
    
    // Check if fetch was called with correct data
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/league/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test League',
          description: 'Test Description',
          email: '',
          password: ''
        }),
      });
    });
    
    // Check if success callback was called
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
    
    // Check if router.push was called with the correct route
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/league/123');
    });
  });

  it('displays an error message when the API call fails', async () => {
    // Mock a failed API response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Error creating league' }),
    });
    
    render(<CreateLeagueModal onSuccess={mockOnSuccess} />);
    
    // Open the modal
    fireEvent.click(screen.getByText('Nova Liga'));
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText('Nome da Liga'), {
      target: { value: 'Test League' },
    });
    
    fireEvent.change(screen.getByLabelText('Descrição'), {
      target: { value: 'Test Description' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByText('Criar Liga'));
    
    // Check if the error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Error creating league')).toBeInTheDocument();
    });
    
    // Success callback should not be called
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });
}); 