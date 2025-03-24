import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const ownerId = searchParams.get('ownerId')

    if (!ownerId) {
      return NextResponse.json(
        { error: 'Owner ID is required' },
        { status: 400 }
      )
    }

    const supabase = createRouteHandlerClient({ cookies })

    // Verify if the user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch leagues owned by the pilot
    const { data: leagues, error: leaguesError } = await supabase
      .from('leagues')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false })

    if (leaguesError) {
      return NextResponse.json(
        { error: 'Failed to fetch leagues' },
        { status: 500 }
      )
    }

    return NextResponse.json({ leagues })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 