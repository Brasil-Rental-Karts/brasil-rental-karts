import { render, screen, waitFor } from '@testing-library/react';
import AuthCallbackPage from '@/app/auth/callback/page';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock @supabase/auth-helpers-nextjs
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: jest.fn(),
}));

describe('AuthCallbackPage', () => {
  const mockRouter = {
    push: jest.fn(),
  };
  const mockSupabaseClient = {
    auth: {
      exchangeCodeForSession: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (createClientComponentClient as jest.Mock).mockReturnValue(mockSupabaseClient);
    
    // Mock window.location
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      writable: true,
      value: new URL('https://example.com/auth/callback?code=test-code')
    });
  });

  it('renders a loading spinner', () => {
    render(<AuthCallbackPage />);
    
    // Check if the loading spinner is rendered
    const loadingContainer = screen.getByTestId('loading-spinner');
    expect(loadingContainer).toBeInTheDocument();
    expect(loadingContainer.firstChild).toHaveClass('animate-spin');
  });

  it('exchanges code for session and redirects to /pilot on success', async () => {
    // Mock successful auth exchange
    mockSupabaseClient.auth.exchangeCodeForSession.mockResolvedValue({ data: {}, error: null });
    
    render(<AuthCallbackPage />);
    
    await waitFor(() => {
      // Check if exchangeCodeForSession was called with the code from URL
      expect(mockSupabaseClient.auth.exchangeCodeForSession).toHaveBeenCalledWith('test-code');
      
      // Check if router.push was called with the correct route
      expect(mockRouter.push).toHaveBeenCalledWith('/pilot');
    });
  });

  it('redirects to login with error param when exchange fails', async () => {
    // Mock failed auth exchange
    mockSupabaseClient.auth.exchangeCodeForSession.mockRejectedValue(new Error('Auth error'));
    
    render(<AuthCallbackPage />);
    
    await waitFor(() => {
      // Check if router.push was called with the error route
      expect(mockRouter.push).toHaveBeenCalledWith('/login?error=auth_callback_failed');
    });
  });

  it('does nothing when no code is present in URL', async () => {
    // Mock URL without code
    Object.defineProperty(window, 'location', {
      writable: true,
      value: new URL('https://example.com/auth/callback')
    });
    
    render(<AuthCallbackPage />);
    
    // Wait to ensure no calls are made
    await new Promise((resolve) => setTimeout(resolve, 100));
    
    // Verify no calls were made
    expect(mockSupabaseClient.auth.exchangeCodeForSession).not.toHaveBeenCalled();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
}); 