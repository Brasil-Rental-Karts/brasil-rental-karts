"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Medal, Calendar, History, Users, BarChart, Plus, ArrowLeft, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { EditLeagueModal } from "@/components/edit-league-modal"
import { LeagueCalendar } from "@/components/league-calendar"

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
  const [championships, setChampionships] = useState<any[]>([])

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
        
        // Fetch championships
        fetchChampionships()
      } catch (error) {
        console.error("Erro ao buscar liga:", error)
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [id, router, supabase])

  const fetchChampionships = async () => {
    if (!id) return

    try {
      const { data, error } = await supabase
        .from("championships")
        .select("*")
        .eq("league_id", id)
        .order("created_at", { ascending: false })

      if (error) throw error
      
      setChampionships(data || [])
    } catch (error) {
      console.error("Erro ao buscar campeonatos:", error)
    }
  }

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
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <header className="bg-white sticky top-0 z-10 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => router.push("/pilot")} size="icon" className="h-9 w-9">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Avatar className="h-10 w-10 ring-2 ring-primary/10 ring-offset-2">
                <AvatarImage src={league.logo_url || undefined} alt={league.name} />
                <AvatarFallback className="text-sm bg-primary/5">
                  {league.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">{league.name}</span>
            </div>
            {isOwner && (
              <EditLeagueModal league={league} onSuccess={handleLeagueUpdated} isOwner={isOwner} />
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-8 space-y-8">
        {/* Stats Cards */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border border-border/40 shadow-none hover:shadow-sm transition-all">
              <CardHeader className="space-y-0 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm text-muted-foreground">Campeonatos</CardTitle>
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Trophy className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{championships.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Campeonatos ativos</p>
              </CardContent>
            </Card>

            <Card className="border border-border/40 shadow-none hover:shadow-sm transition-all">
              <CardHeader className="space-y-0 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm text-muted-foreground">Pilotos</CardTitle>
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">0</p>
                <p className="text-xs text-muted-foreground mt-1">Pilotos registrados</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Calendar Section */}
        <section>
          <LeagueCalendar leagueId={id} />
        </section>

        {/* Quick Actions Section */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card 
              className="border border-border/40 shadow-none hover:shadow-sm transition-all cursor-pointer"
              onClick={() => router.push(`/league/${id}/championships`)}
            >
              <CardContent className="p-6 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Gerenciar Campeonatos</h3>
                  <p className="text-sm text-muted-foreground">Visualizar ou criar campeonatos</p>
                </div>
              </CardContent>
            </Card>
            
            {isOwner && (
              <Card 
                className="border border-border/40 shadow-none hover:shadow-sm transition-all cursor-pointer"
                onClick={() => router.push(`/league/${id}/championships`)}
              >
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Plus className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Criar Campeonato</h3>
                    <p className="text-sm text-muted-foreground">Iniciar um novo campeonato</p>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <Card className="border border-border/40 shadow-none hover:shadow-sm transition-all cursor-pointer">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Agendar Corrida</h3>
                  <p className="text-sm text-muted-foreground">Criar novo evento de corrida</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  )
} 