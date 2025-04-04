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
import { UnifiedCalendar } from "@/components/unified-calendar"
import { Breadcrumb, BreadcrumbHome, BreadcrumbItem, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Skeleton } from "@/components/ui/skeleton"

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
  const [uniquePilotsCount, setUniquePilotsCount] = useState<number>(0)

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
        
        // Fetch unique pilots count
        fetchUniquePilotsCount()
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

  const fetchUniquePilotsCount = async () => {
    if (!id) return

    try {
      // Primeiro, obter todas as categorias de todos os campeonatos da liga
      const { data: championshipsData, error: championshipsError } = await supabase
        .from("championships")
        .select("id")
        .eq("league_id", id)
      
      if (championshipsError) throw championshipsError
      
      if (!championshipsData || championshipsData.length === 0) {
        setUniquePilotsCount(0)
        return
      }
      
      const championshipIds = championshipsData.map(c => c.id)
      
      // Agora, obter todas as categorias desses campeonatos
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("id")
        .in("championship_id", championshipIds)
      
      if (categoriesError) throw categoriesError
      
      if (!categoriesData || categoriesData.length === 0) {
        setUniquePilotsCount(0)
        return
      }
      
      const categoryIds = categoriesData.map(c => c.id)
      
      // Finalmente, obter todos os pilotos únicos dessas categorias
      const { data: pilotsData, error: pilotsError } = await supabase
        .from("category_pilots")
        .select("pilot_id")
        .in("category_id", categoryIds)
      
      if (pilotsError) throw pilotsError
      
      if (!pilotsData) {
        setUniquePilotsCount(0)
        return
      }
      
      // Contar pilotos únicos usando Set para eliminar duplicatas
      const uniquePilotsSet = new Set(pilotsData.map(p => p.pilot_id))
      setUniquePilotsCount(uniquePilotsSet.size)
    } catch (error) {
      console.error("Erro ao buscar contagem de pilotos:", error)
      setUniquePilotsCount(0)
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
      
      // Recarregar contagens
      await fetchChampionships()
      await fetchUniquePilotsCount()
    } catch (error) {
      console.error("Erro ao atualizar dados da liga:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header Section Skeleton */}
        <header className="bg-white sticky top-0 z-10 border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9" />
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-5 w-32" />
              </div>
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        </header>

        {/* Breadcrumb Skeleton */}
        <div className="container mx-auto px-4 py-2 border-b border-border/40">
          <div className="flex items-center gap-1">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>

        <main className="container mx-auto px-4 py-6 md:py-8 space-y-8">
          {/* Stats Cards Skeleton */}
          <section>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border border-border/40 shadow-none">
                <CardHeader className="space-y-0 pb-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-28" />
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Trophy className="h-4 w-4 text-primary/30" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-12 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>

              <Card className="border border-border/40 shadow-none">
                <CardHeader className="space-y-0 pb-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-20" />
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-4 w-4 text-primary/30" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-12 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Calendar Section Skeleton - The LeagueCalendar component handles its own loading state */}
          <section>
            <Card className="border border-border/40 shadow-none">
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-lg border border-border/40">
                      <Skeleton className="h-6 w-20 rounded-full" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-4 w-20 rounded-full" />
                        </div>
                        <Skeleton className="h-4 w-48" />
                      </div>
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Quick Actions Section Skeleton */}
          <section>
            <Skeleton className="h-7 w-48 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border border-border/40 shadow-none">
                  <CardContent className="p-6 flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div>
                      <Skeleton className="h-5 w-40 mb-1" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </main>
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

      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-2 border-b border-border/40">
        <Breadcrumb className="text-xs">
          <BreadcrumbHome href="/pilot" />
          <BreadcrumbSeparator />
          <BreadcrumbItem active>{league.name}</BreadcrumbItem>
        </Breadcrumb>
      </div>

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
                <p className="text-2xl font-semibold">{uniquePilotsCount}</p>
                <p className="text-xs text-muted-foreground mt-1">Pilotos registrados</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Calendar Section */}
        <section>
          <UnifiedCalendar leagueId={id} showAllStatuses={true} title="Calendário de Provas" />
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