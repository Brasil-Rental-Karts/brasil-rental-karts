import { NextResponse } from 'next/server';
import { POST } from '@/app/api/league/create/route';
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

describe('League Create API Route', () => {
  let mockRequest: Request;
  let mockSupabaseClient: any;
  let mockAuthGetSession: jest.Mock;
  let mockInsert: jest.Mock;
  let mockSelect: jest.Mock;
  let mockSingle: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the request
    mockRequest = {
      json: jest.fn().mockResolvedValue({
        name: 'Test League',
        description: 'Test Description',
      }),
    } as unknown as Request;
    
    // Setup the Supabase client mock chain
    mockSingle = jest.fn();
    mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    mockInsert = jest.fn().mockReturnValue({ select: mockSelect });
    
    mockAuthGetSession = jest.fn().mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'test-user-id',
          },
        },
      },
    });
    
    mockSupabaseClient = {
      auth: {
        getSession: mockAuthGetSession,
      },
      from: jest.fn().mockReturnValue({
        insert: mockInsert,
      }),
    };
    
    (createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabaseClient);
    
    // Reset the NextResponse mock
    (NextResponse.json as jest.Mock).mockImplementation((body, init) => ({
      body,
      init,
    }));
  });

  it('creates a league successfully', async () => {
    // Mock successful league creation
    mockSingle.mockResolvedValue({
      data: {
        id: 'test-league-id',
        name: 'Test League',
        description: 'Test Description',
        owner_id: 'test-user-id',
      },
      error: null,
    });
    
    const response = await POST(mockRequest);
    
    // Verify Supabase client was called correctly
    expect(createRouteHandlerClient).toHaveBeenCalled();
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('leagues');
    expect(mockInsert).toHaveBeenCalledWith([
      {
        name: 'Test League',
        description: 'Test Description',
        owner_id: 'test-user-id',
      },
    ]);
    
    // Verify response
    expect(NextResponse.json).toHaveBeenCalledWith({
      id: 'test-league-id',
      name: 'Test League',
      description: 'Test Description',
      owner_id: 'test-user-id',
    });
  });

  it('returns 401 when user is not authenticated', async () => {
    // Mock unauthenticated user
    mockAuthGetSession.mockResolvedValue({
      data: { session: null },
    });
    
    await POST(mockRequest);
    
    // Verify 401 response
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Não autorizado' },
      { status: 401 }
    );
  });

  it('returns 400 when required fields are missing', async () => {
    // Mock missing fields
    (mockRequest.json as jest.Mock).mockResolvedValue({
      name: '',
      description: '',
    });
    
    await POST(mockRequest);
    
    // Verify 400 response
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Nome e descrição são obrigatórios' },
      { status: 400 }
    );
  });

  it('returns 500 when league creation fails', async () => {
    // Mock database error
    mockSingle.mockResolvedValue({
      data: null,
      error: new Error('Database error'),
    });
    
    await POST(mockRequest);
    
    // Verify 500 response
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Erro ao criar liga' },
      { status: 500 }
    );
  });

  it('handles exceptions and returns 500', async () => {
    // Mock exception during request
    (mockRequest.json as jest.Mock).mockRejectedValue(new Error('Request error'));
    
    await POST(mockRequest);
    
    // Verify 500 response
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  });
}); 