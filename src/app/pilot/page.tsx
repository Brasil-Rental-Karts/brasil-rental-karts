"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreateLeagueModal } from "@/components/create-league-modal"
import { EditPilotModal } from "@/components/edit-pilot-modal"
import { Loader2, Trophy, Calendar, History, Plus, ChevronRight, TrendingUp, Users, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import logger from "@/lib/logger"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PilotCalendar } from "@/components/pilot-calendar"

interface League {
  id: string
  name: string
  description: string
  created_at: string
  logo_url: string | null
}

interface PilotLeague {
  id: string
  name: string
  description: string
  logo_url: string | null
  championship_name: string
  category_name: string
  category_id: string
  championship_id: string
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
  const [pilotLeagues, setPilotLeagues] = useState<PilotLeague[]>([])
  const [pilot, setPilot] = useState<PilotProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isCreateLeagueOpen, setIsCreateLeagueOpen] = useState(false)
  const createLeagueButtonRef = useRef<HTMLButtonElement>(null)
  const [activeTab, setActiveTab] = useState("my-leagues")
  const supabase = createClientComponentClient()

  const fetchData = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        logger.error('Auth', `Sessão inválida`, { 
          mensagem: sessionError.message,
          codigo: sessionError.code
        });
        router.push("/login")
        return
      }
      
      if (!session?.user) {
        logger.error('Auth', `Usuário não autenticado`);
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
          dica: pilotError.hint,
          metadata: session.user.user_metadata,
          email: session.user.email
        });
        
        // If the error is not "no rows returned", throw it
        if (pilotError.code !== "PGRST116") {
          throw pilotError
        }
      }

      // If no profile exists, create one with default values
      if (!pilotData) {
        const defaultName = session.user.user_metadata?.name || 
                          (session.user.email ? session.user.email.split('@')[0] : "Piloto");

        const { data: newPilot, error: createError } = await supabase
          .from("pilot_profiles")
          .insert({
            id: session.user.id,
            name: defaultName,
            email: session.user.email || "",
            phone: "",
            bio: "",
            avatar_url: session.user.user_metadata?.avatar_url || null,
          })
          .select()
          .single()

        if (createError) {
          logger.error('Perfil', `Falha ao criar perfil piloto`, {
            usuarioId: session.user.id,
            codigo: createError.code,
            mensagem: createError.message,
            detalhes: createError.details,
            dica: createError.hint,
            dadosTentativa: {
              id: session.user.id,
              name: defaultName,
              email: session.user.email,
              metadata: session.user.user_metadata
            }
          });
          throw createError
        }
        setPilot(newPilot)
      } else {
        setPilot(pilotData)
      }

      // Fetch owned leagues
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

      // Fetch leagues where user is only a pilot (not owner or admin)
      const { data: pilotLeaguesData, error: pilotLeaguesError } = await supabase
        .from("category_pilots")
        .select(`
          category_id,
          categories (
            id,
            name,
            championship_id,
            championships (
              id,
              name,
              league_id,
              leagues (
                id,
                name,
                description,
                logo_url
              )
            )
          )
        `)
        .eq("pilot_id", session.user.id)

      if (pilotLeaguesError) {
        logger.error('Ligas como Piloto', `Falha ao buscar ligas onde o usuário é piloto`, {
          usuarioId: session.user.id,
          codigo: pilotLeaguesError.code,
          mensagem: pilotLeaguesError.message
        });
        throw pilotLeaguesError
      }

      // Transform the data to get the list of leagues where user is a pilot
      const pilotLeaguesList: PilotLeague[] = [];
      const leagueIds = new Set(); // To avoid duplicates

      if (pilotLeaguesData) {
        pilotLeaguesData.forEach(entry => {
          if (!entry.categories) return;
          
          const category = entry.categories as any;
          if (!category.championships) return;
          
          const championship = category.championships as any;
          if (!championship.leagues) return;
          
          const league = championship.leagues as any;
          
          // Skip if this league is owned by the user
          if (leaguesData && leaguesData.some(l => l.id === league.id)) {
            return;
          }
          
          // Skip duplicates
          if (leagueIds.has(league.id)) {
            return;
          }
          
          leagueIds.add(league.id);
          
          pilotLeaguesList.push({
            id: league.id,
            name: league.name,
            description: league.description,
            logo_url: league.logo_url,
            championship_id: championship.id,
            championship_name: championship.name,
            category_id: category.id,
            category_name: category.name
          });
        });
      }

      setPilotLeagues(pilotLeaguesList);
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
        <section className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">Olá, {pilot.name.split(' ')[0]}</h1>
            <p className="text-muted-foreground text-sm">Bem-vindo ao painel de controle das suas ligas de kart</p>
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
                  <CardTitle className="text-sm text-muted-foreground">Participações</CardTitle>
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{pilotLeagues.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Ligas como piloto</p>
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

        {/* Calendar Section */}
        <section>
          {pilot && pilot.id && (
            <PilotCalendar pilotId={pilot.id} />
          )}
        </section>

        {/* Leagues Section with Tabs */}
        <section>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <TabsList>
                <TabsTrigger value="my-leagues" className="gap-1.5">
                  <Trophy className="h-3.5 w-3.5" />
                  Minhas Ligas
                </TabsTrigger>
                <TabsTrigger value="participating" className="gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  Participo
                </TabsTrigger>
              </TabsList>
              
              {activeTab === "my-leagues" && leagues.length > 0 && (
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

            {/* My Leagues Tab */}
            <TabsContent value="my-leagues" className="pt-2">
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
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={league.logo_url || undefined} alt={league.name} />
                              <AvatarFallback className="bg-primary/10">
                                <span className="text-primary font-semibold">
                                  {league.name.charAt(0)}
                                </span>
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium group-hover:text-primary transition-colors">{league.name}</h3>
                                <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">Admin</span>
                              </div>
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
            </TabsContent>

            {/* Participating Leagues Tab */}
            <TabsContent value="participating" className="pt-2">
              {pilotLeagues.length === 0 ? (
                <Card className="border border-dashed border-border/60 bg-muted/30 flex flex-col items-center justify-center py-10">
                  <div className="text-center max-w-md px-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Users className="h-6 w-6 text-primary/70" />
                    </div>
                    <h3 className="text-base font-medium mb-2">Você ainda não participa de ligas</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Quando for convidado para alguma liga como piloto, ela aparecerá aqui.
                    </p>
                  </div>
                </Card>
              ) : (
                <div className="space-y-2">
                  {pilotLeagues.map((pilotLeague) => (
                    <Card 
                      key={pilotLeague.id + pilotLeague.category_id} 
                      className="border border-border/40 shadow-none hover:shadow-sm hover:border-primary/20 transition-all cursor-pointer group"
                      onClick={() => router.push(`/league/${pilotLeague.id}/championships/${pilotLeague.championship_id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={pilotLeague.logo_url || undefined} alt={pilotLeague.name} />
                              <AvatarFallback className="bg-primary/10">
                                <span className="text-primary font-semibold">
                                  {pilotLeague.name.charAt(0)}
                                </span>
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium group-hover:text-primary transition-colors">{pilotLeague.name}</h3>
                                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Piloto</span>
                              </div>
                              <div className="flex gap-2 items-center text-xs text-muted-foreground mt-1">
                                <span className="bg-muted px-2 py-0.5 rounded-full">{pilotLeague.championship_name}</span>
                                <span className="bg-muted px-2 py-0.5 rounded-full">{pilotLeague.category_name}</span>
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </section>
      </main>

      <CreateLeagueModal 
        isOpenExternal={isCreateLeagueOpen}
        onOpenChange={(open) => setIsCreateLeagueOpen(open)}
        onSuccess={fetchData}
      />
    </div>
  )
} 