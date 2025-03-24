import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Verify if the user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch league data
    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .select('*')
      .eq('id', params.id)
      .single()

    if (leagueError) {
      return NextResponse.json(
        { error: 'League not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ league })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 