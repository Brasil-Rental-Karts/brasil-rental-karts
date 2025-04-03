"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Plus, Trophy, Trash2, Edit, Users, Calendar } from "lucide-react"
import { Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CreateChampionshipModal } from "@/components/create-championship-modal"
import { EditChampionshipModal } from "@/components/edit-championship-modal"
import { toast } from "sonner"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Championship {
  id: string
  name: string
  description: string
  league_id: string
  start_date: string | null
  end_date: string | null
  status: 'upcoming' | 'active' | 'completed'
  logo_url: string | null
  scoring_system_id: string
  created_at: string
  updated_at: string
}

interface League {
  id: string
  name: string
  owner_id: string
}

interface ChampionshipsPageProps {
  params: Promise<{
    id: string
  }>
}

export default function ChampionshipsPage({ params }: ChampionshipsPageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [id, setId] = useState<string>("")
  const [league, setLeague] = useState<League | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [championships, setChampionships] = useState<Championship[]>([])
  const supabase = createClientComponentClient()

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
        setIsOwner(session.user.id === leagueData.owner_id)
        
        await fetchChampionships()
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

  const handleChampionshipCreated = () => {
    fetchChampionships()
  }

  const handleChampionshipUpdated = () => {
    fetchChampionships()
  }

  const handleDeleteChampionship = async (championshipId: string) => {
    if (!confirm("Tem certeza que deseja excluir este campeonato? Esta ação não pode ser desfeita.")) {
      return
    }

    try {
      const { error } = await supabase
        .from("championships")
        .delete()
        .eq("id", championshipId)

      if (error) throw error

      toast.success("Campeonato excluído com sucesso")
      fetchChampionships()
    } catch (error) {
      console.error("Erro ao excluir campeonato:", error)
      toast.error("Erro ao excluir campeonato")
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
              <Button variant="outline" onClick={() => router.push(`/league/${id}`)} size="icon" className="h-9 w-9">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium">Campeonatos</span>
            </div>
            {isOwner && (
              <CreateChampionshipModal leagueId={id} onSuccess={handleChampionshipCreated} />
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-8 space-y-8">
        {/* Championships List */}
        <section>
          {championships.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="bg-muted/50 p-4 rounded-full mb-4">
                <Trophy className="h-8 w-8 text-muted-foreground/70" />
              </div>
              <h3 className="text-lg font-medium mb-2">Nenhum campeonato encontrado</h3>
              <p className="text-muted-foreground text-sm max-w-md mb-6">
                Crie um campeonato para organizar suas corridas e pilotos em diferentes categorias.
              </p>
              {isOwner && (
                <CreateChampionshipModal leagueId={id} onSuccess={handleChampionshipCreated} />
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {championships.map((championship) => (
                <Card key={championship.id} className="border border-border/40 shadow-none hover:shadow-sm transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 ring-2 ring-primary/10 ring-offset-2">
                          <AvatarImage src={championship.logo_url || undefined} alt={championship.name} />
                          <AvatarFallback className="text-sm bg-primary/5">
                            {championship.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">{championship.name}</CardTitle>
                          <CardDescription className="text-xs">
                            {championship.status === 'upcoming' && 'Em breve'}
                            {championship.status === 'active' && 'Em andamento'}
                            {championship.status === 'completed' && 'Finalizado'}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {championship.description || "Sem descrição"}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {championship.start_date 
                          ? format(parseISO(championship.start_date), "MMMM 'de' yyyy", { locale: ptBR })
                          : 'Data não definida'}
                        {championship.end_date 
                          ? ` até ${format(parseISO(championship.end_date), "MMMM 'de' yyyy", { locale: ptBR })}`
                          : ''}
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2 flex justify-between">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1.5"
                      onClick={() => router.push(`/league/${id}/championships/${championship.id}`)}
                    >
                      <Trophy className="h-3.5 w-3.5" />
                      Detalhes
                    </Button>
                    {isOwner && (
                      <div className="flex gap-2">
                        <EditChampionshipModal
                          championship={championship}
                          onSuccess={handleChampionshipUpdated}
                        />
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8 text-destructive" 
                          onClick={() => handleDeleteChampionship(championship.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
} 