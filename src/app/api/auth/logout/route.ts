import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function POST() {
  try {
    // Usar o cookies de forma assíncrona com o await
    const cookieStore = cookies()
    
    // Criando o cliente Supabase com a forma correta de passar cookies
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    })
    
    // Realizar logout sem tentar verificar a sessão primeiro (que está causando o erro)
    // Use o parâmetro scope: 'global' para garantir logout em todos os dispositivos
    // https://supabase.com/docs/reference/javascript/auth-signout
    await supabase.auth.signOut({ scope: 'global' })
    
    // Criar a resposta com os cabeçalhos apropriados
    const response = NextResponse.json(
      { success: true, message: 'Logout successful' },
      { status: 200 }
    );
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    
    // Garantir que sempre retornamos um objeto, mesmo em caso de erro
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
} 