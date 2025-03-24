import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { name, description } = await request.json()

    if (!name || !description) {
      return NextResponse.json(
        { error: 'Nome e descrição são obrigatórios' },
        { status: 400 }
      )
    }

    // Criar a liga
    const { data: league, error: leagueError } = await supabase
      .from("leagues")
      .insert([
        {
          name,
          description,
          owner_id: session.user.id,
        },
      ])
      .select()
      .single()

    if (leagueError) {
      console.error('Erro ao criar liga:', leagueError)
      return NextResponse.json(
        { error: 'Erro ao criar liga' },
        { status: 500 }
      )
    }

    return NextResponse.json(league)
  } catch (error) {
    console.error('Erro ao criar liga:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 