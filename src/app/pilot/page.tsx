"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreateLeagueModal } from "@/components/create-league-modal"
import { EditPilotModal } from "@/components/edit-pilot-modal"
import { Loader2, Trophy, Calendar, History, Plus, ChevronRight, TrendingUp } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import logger from "@/lib/logger"

interface League {
  id: string
  name: string
  description: string
  created_at: string
}

interface PilotProfile {
  id: string
  name: string
  email: string
  phone: string
  bio: string
  avatar_url: string | null
}

export default function PilotPage() {
  const router = useRouter()
  const [leagues, setLeagues] = useState<League[]>([])
  const [pilot, setPilot] = useState<PilotProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isCreateLeagueOpen, setIsCreateLeagueOpen] = useState(false)
  const createLeagueButtonRef = useRef<HTMLButtonElement>(null)
  const supabase = createClientComponentClient()

  const fetchData = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        logger.error('Auth', `Sessão inválida`, { mensagem: sessionError.message });
        router.push("/login")
        return
      }
      
      if (!session?.user) {
        router.push("/login")
        return
      }

      // Fetch pilot profile
      const { data: pilotData, error: pilotError } = await supabase
        .from("pilot_profiles")
        .select("*")
        .eq("id", session.user.id)
        .single()

      if (pilotError) {
        logger.error('Perfil', `Falha ao buscar perfil piloto`, {
          usuarioId: session.user.id,
          codigo: pilotError.code,
          mensagem: pilotError.message,
          detalhes: pilotError.details,
          dica: pilotError.hint
        });
        
        // If the error is not "no rows returned", throw it
        if (pilotError.code !== "PGRST116") {
          throw pilotError
        }
      }

      // If no profile exists, create one with default values
      if (!pilotData) {
        const { data: newPilot, error: createError } = await supabase
          .from("pilot_profiles")
          .insert({
            id: session.user.id,
            name: session.user.user_metadata?.name || "",
            email: session.user.email || "",
            phone: "",
            bio: "",
            avatar_url: session.user.user_metadata?.avatar_url || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (createError) {
          logger.error('Perfil', `Falha ao criar perfil piloto`, {
            usuarioId: session.user.id,
            codigo: createError.code,
            mensagem: createError.message,
            detalhes: createError.details,
            dica: createError.hint
          });
          throw createError
        }
        setPilot(newPilot)
      } else {
        setPilot(pilotData)
      }

      // Fetch leagues
      const { data: leaguesData, error: leaguesError } = await supabase
        .from("leagues")
        .select("*")
        .eq("owner_id", session.user.id)
        .order("created_at", { ascending: false })

      if (leaguesError) {
        logger.error('Ligas', `Falha ao buscar ligas do piloto`, {
          usuarioId: session.user.id,
          codigo: leaguesError.code,
          mensagem: leaguesError.message,
          detalhes: leaguesError.details,
          dica: leaguesError.hint
        });
        throw leaguesError
      }
      setLeagues(leaguesData || [])
    } catch (error) {
      logger.error('Piloto', `Erro ao buscar dados do piloto`, {
        mensagem: error instanceof Error ? error.message : "Erro desconhecido",
        stack: error instanceof Error ? error.stack : null,
      });
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!pilot) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section - Melhorado */}
      <header className="bg-white sticky top-0 z-10 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 ring-2 ring-primary/10 ring-offset-2">
                <AvatarImage src={pilot.avatar_url || undefined} alt={pilot.name} />
                <AvatarFallback className="text-sm bg-primary/5">
                  {pilot.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">{pilot.name}</span>
            </div>
            <EditPilotModal pilot={pilot} onSuccess={fetchData} />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-8 space-y-8">
        {/* Welcome Section */}
        <section className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">Olá, {pilot.name.split(' ')[0]}</h1>
            <p className="text-muted-foreground text-sm">Bem-vindo ao painel de controle das suas ligas de kart</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {leagues.length === 0 && (
              <Button 
                variant="default" 
                size="sm" 
                className="gap-1.5"
                onClick={() => setIsCreateLeagueOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                Criar primeira liga
              </Button>
            )}
            <CreateLeagueModal 
              onSuccess={fetchData} 
              isOpenExternal={isCreateLeagueOpen} 
              onOpenChange={setIsCreateLeagueOpen} 
            />
          </div>
        </section>

        {/* Stats Cards - Layout melhorado */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border border-border/40 shadow-none hover:shadow-sm transition-all">
              <CardHeader className="space-y-0 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm text-muted-foreground">Ligas</CardTitle>
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Trophy className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{leagues.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Ligas administradas</p>
              </CardContent>
            </Card>

            <Card className="border border-border/40 shadow-none hover:shadow-sm transition-all">
              <CardHeader className="space-y-0 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm text-muted-foreground">Próxima Prova</CardTitle>
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">-</p>
                <p className="text-xs text-muted-foreground mt-1">Sem provas agendadas</p>
              </CardContent>
            </Card>

            <Card className="border border-border/40 shadow-none hover:shadow-sm transition-all">
              <CardHeader className="space-y-0 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm text-muted-foreground">Corridas</CardTitle>
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <History className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">0</p>
                <p className="text-xs text-muted-foreground mt-1">Corridas realizadas</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Leagues Section */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Minhas Ligas</h2>
            {leagues.length > 0 && (
              <Button 
                size="sm" 
                variant="outline" 
                className="flex items-center gap-1.5"
                onClick={() => setIsCreateLeagueOpen(true)}
                ref={createLeagueButtonRef}
              >
                <Plus className="h-3.5 w-3.5" />
                Nova Liga
              </Button>
            )}
          </div>

          {leagues.length === 0 ? (
            <Card className="border border-dashed border-border/60 bg-muted/30 flex flex-col items-center justify-center py-10">
              <div className="text-center max-w-md px-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Trophy className="h-6 w-6 text-primary/70" />
                </div>
                <h3 className="text-base font-medium mb-2">Comece gerenciando suas competições</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Crie sua primeira liga para começar a organizar corridas e registrar resultados.
                </p>
                <Button 
                  size="sm" 
                  className="gap-1.5"
                  onClick={() => setIsCreateLeagueOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Criar Nova Liga
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-2">
              {leagues.map((league) => (
                <Card 
                  key={league.id} 
                  className="border border-border/40 shadow-none hover:shadow-sm hover:border-primary/20 transition-all cursor-pointer group"
                  onClick={() => router.push(`/league/${league.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-primary font-semibold">
                            {league.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-medium group-hover:text-primary transition-colors">{league.name}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-1">{league.description || "Sem descrição"}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
} 