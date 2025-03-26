"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Medal, Calendar, History, Users, BarChart, Plus, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { EditLeagueModal } from "@/components/edit-league-modal"

interface League {
  id: string
  name: string
  description: string
  logo_url: string | null
  owner_id: string
  created_at: string
}

interface LeagueDashboardProps {
  params: Promise<{
    id: string
  }>
}

export default function LeagueDashboard({ params }: LeagueDashboardProps) {
  const router = useRouter()
  const [league, setLeague] = useState<League | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)
  const supabase = createClientComponentClient()
  const [id, setId] = useState<string>("")

  useEffect(() => {
    const resolveParams = async () => {
      try {
        const resolvedParams = await params
        setId(resolvedParams.id)
      } catch (error) {
        console.error("Erro ao resolver parâmetros:", error)
        router.push("/login")
      }
    }
    
    resolveParams()
  }, [params, router])

  useEffect(() => {
    if (!id) return

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          router.push("/login")
          return
        }

        const { data: leagueData, error } = await supabase
          .from("leagues")
          .select("*")
          .eq("id", id)
          .single()

        if (error) throw error

        setLeague(leagueData)
        // Verificar se o usuário logado é o dono da liga
        setIsOwner(session.user.id === leagueData.owner_id)
      } catch (error) {
        console.error("Erro ao buscar liga:", error)
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [id, router, supabase])

  const handleLeagueUpdated = async () => {
    // Recarregar os dados da liga após atualização
    if (!id) return
    
    try {
      setLoading(true)
      const { data: leagueData, error } = await supabase
        .from("leagues")
        .select("*")
        .eq("id", id)
        .single()

      if (error) throw error
      setLeague(leagueData)
    } catch (error) {
      console.error("Erro ao atualizar dados da liga:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!league) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Liga não encontrada</h1>
        <Button onClick={() => router.push("/pilot")}>
          Voltar para Minhas Ligas
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Botão Voltar no topo */}
      <div className="container mx-auto px-4 py-4">
        <Button variant="outline" onClick={() => router.push("/pilot")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      </div>
      
      {/* Hero Section - Simplificado */}
      <div className="w-full relative">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center" 
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1560990816-bb30289c6611')"
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-secondary/90 z-10" />
        
        <div className="container mx-auto px-4 pt-6 pb-10 flex flex-col items-center relative z-20">
          <Avatar className="h-28 w-28 border-4 border-white shadow-lg mb-4">
            <AvatarImage src={league.logo_url || undefined} alt={league.name} />
            <AvatarFallback className="text-4xl">
              {league.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <h1 className="text-3xl font-bold text-white mb-5">
            {league.name}
          </h1>
          
          {isOwner && (
            <EditLeagueModal 
              league={league} 
              onSuccess={handleLeagueUpdated} 
              isOwner={isOwner} 
            />
          )}
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-12 bg-muted/40">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">Campeonatos Ativos</CardTitle>
                <Trophy className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">0</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Campeonatos em andamento
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">Total de Pilotos</CardTitle>
                <Users className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">0</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Pilotos registrados
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">Próxima Corrida</CardTitle>
                <Calendar className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">-</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Data do próximo evento
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Actions Section */}
      <div className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold">Ações Rápidas</h2>
              <p className="text-muted-foreground mt-2">
                Gerencie sua liga e acompanhe as competições
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl">Campeonatos</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Crie e gerencie campeonatos para sua liga
                </p>
                <Button
                  className="w-full h-11 text-base"
                  onClick={() => router.push(`/league/${id}/championships`)}
                >
                  Gerenciar Campeonatos
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl">Estatísticas</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Acompanhe as estatísticas e desempenho da liga
                </p>
                <Button
                  variant="outline"
                  className="w-full h-11 text-base"
                  onClick={() => router.push(`/league/${id}/stats`)}
                >
                  Ver Estatísticas
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Medal className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl">Rankings</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Visualize as classificações e rankings dos pilotos
                </p>
                <Button
                  variant="outline"
                  className="w-full h-11 text-base"
                  onClick={() => router.push(`/league/${id}/rankings`)}
                >
                  Ver Rankings
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 