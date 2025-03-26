import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const resolvedParams = await params
    const id = resolvedParams.id

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
      .eq('id', id)
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const resolvedParams = await params
    const id = resolvedParams.id
    const { name, description, logo_url } = await request.json()

    // Verificar se o usuário está autenticado
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se a liga existe e se o usuário é o dono
    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .select('*')
      .eq('id', id)
      .single()

    if (leagueError) {
      return NextResponse.json(
        { error: 'Liga não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se o usuário é o dono da liga
    if (league.owner_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Você não tem permissão para editar esta liga' },
        { status: 403 }
      )
    }

    // Atualizar a liga
    const { data: updatedLeague, error: updateError } = await supabase
      .from('leagues')
      .update({
        name,
        description,
        logo_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: 'Erro ao atualizar liga' },
        { status: 500 }
      )
    }

    return NextResponse.json({ league: updatedLeague })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 