import { NextResponse } from 'next/server';
import { GET } from '@/app/api/leagues/route';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn(),
  },
}));

// Mock Supabase Auth Helper
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: jest.fn(),
}));

// Mock the cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

describe('Leagues API Route', () => {
  let mockRequest: Request;
  let mockSupabaseClient: any;
  let mockAuthGetSession: jest.Mock;
  let mockFrom: jest.Mock;
  let mockSelect: jest.Mock;
  let mockEq: jest.Mock;
  let mockOrder: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the request with a valid ownerId in the URL
    mockRequest = {
      url: 'https://example.com/api/leagues?ownerId=test-owner-id',
    } as unknown as Request;
    
    // Setup the Supabase client mock chain
    mockOrder = jest.fn();
    mockEq = jest.fn().mockReturnValue({ order: mockOrder });
    mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    mockFrom = jest.fn().mockReturnValue({ select: mockSelect });
    
    mockAuthGetSession = jest.fn().mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'test-user-id',
          },
        },
      },
      error: null,
    });
    
    mockSupabaseClient = {
      auth: {
        getSession: mockAuthGetSession,
      },
      from: mockFrom,
    };
    
    (createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabaseClient);
    
    // Reset the NextResponse mock
    (NextResponse.json as jest.Mock).mockImplementation((body, init) => ({
      body,
      init,
    }));
  });

  it('returns leagues successfully', async () => {
    // Mock successful leagues fetch
    const mockLeagues = [
      {
        id: 'league-1',
        name: 'League 1',
        description: 'Description 1',
        owner_id: 'test-owner-id',
      },
      {
        id: 'league-2',
        name: 'League 2',
        description: 'Description 2',
        owner_id: 'test-owner-id',
      },
    ];
    
    mockOrder.mockResolvedValue({
      data: mockLeagues,
      error: null,
    });
    
    await GET(mockRequest);
    
    // Verify Supabase client was called correctly
    expect(createRouteHandlerClient).toHaveBeenCalled();
    expect(mockFrom).toHaveBeenCalledWith('leagues');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockEq).toHaveBeenCalledWith('owner_id', 'test-owner-id');
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
    
    // Verify response
    expect(NextResponse.json).toHaveBeenCalledWith({ leagues: mockLeagues });
  });

  it('returns 400 when ownerId is missing', async () => {
    // Mock request without ownerId
    mockRequest = {
      url: 'https://example.com/api/leagues',
    } as unknown as Request;
    
    await GET(mockRequest);
    
    // Verify 400 response
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Owner ID is required' },
      { status: 400 }
    );
  });

  it('returns 401 when user is not authenticated', async () => {
    // Mock unauthenticated user
    mockAuthGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    
    await GET(mockRequest);
    
    // Verify 401 response
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  });

  it('returns 401 when session error occurs', async () => {
    // Mock session error
    mockAuthGetSession.mockResolvedValue({
      data: { session: null },
      error: new Error('Session error'),
    });
    
    await GET(mockRequest);
    
    // Verify 401 response
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  });

  it('returns 500 when leagues fetch fails', async () => {
    // Mock database error
    mockOrder.mockResolvedValue({
      data: null,
      error: new Error('Database error'),
    });
    
    await GET(mockRequest);
    
    // Verify 500 response
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Failed to fetch leagues' },
      { status: 500 }
    );
  });

  it('handles exceptions and returns 500', async () => {
    // Mock exception during request processing
    mockAuthGetSession.mockRejectedValue(new Error('Unexpected error'));
    
    await GET(mockRequest);
    
    // Verify 500 response
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Internal server error' },
      { status: 500 }
    );
  });
}); 