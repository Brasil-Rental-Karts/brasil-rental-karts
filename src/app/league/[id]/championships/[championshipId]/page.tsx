"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Trophy, Calendar, Tag, Edit, Users, Plus, Weight } from "lucide-react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CreateCategoryModal } from "@/components/create-category-modal"
import { EditChampionshipModal } from "@/components/edit-championship-modal"
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
  created_at: string
  updated_at: string
}

interface League {
  id: string
  name: string
  owner_id: string
}

interface Category {
  id: string
  name: string
  description: string
  championship_id: string
  max_pilots: number | null
  ballast_kg: number | null
  created_at: string
  updated_at: string
}

interface CategoryWithPilotCount extends Category {
  pilot_count: number
}

interface ChampionshipDetailProps {
  params: Promise<{
    id: string
    championshipId: string
  }>
}

export default function ChampionshipDetail({ params }: ChampionshipDetailProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [leagueId, setLeagueId] = useState<string>("")
  const [championshipId, setChampionshipId] = useState<string>("")
  const [championship, setChampionship] = useState<Championship | null>(null)
  const [league, setLeague] = useState<League | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [categories, setCategories] = useState<CategoryWithPilotCount[]>([])
  const [activeTab, setActiveTab] = useState("overview")
  const supabase = createClientComponentClient()

  useEffect(() => {
    const resolveParams = async () => {
      try {
        const resolvedParams = await params
        setLeagueId(resolvedParams.id)
        setChampionshipId(resolvedParams.championshipId)
      } catch (error) {
        console.error("Erro ao resolver parâmetros:", error)
        router.push("/login")
      }
    }
    
    resolveParams()
  }, [params, router])

  useEffect(() => {
    if (!leagueId || !championshipId) return

    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          router.push("/login")
          return
        }

        // Fetch league data
        const { data: leagueData, error: leagueError } = await supabase
          .from("leagues")
          .select("*")
          .eq("id", leagueId)
          .single()

        if (leagueError) throw leagueError
        setLeague(leagueData)
        setIsOwner(session.user.id === leagueData.owner_id)

        // Fetch championship data
        const { data: championshipData, error: championshipError } = await supabase
          .from("championships")
          .select("*")
          .eq("id", championshipId)
          .single()

        if (championshipError) throw championshipError
        setChampionship(championshipData)

        // Fetch categories
        await fetchCategories()
      } catch (error) {
        console.error("Erro ao buscar dados:", error)
        toast.error("Erro ao carregar dados do campeonato")
        router.push(`/league/${leagueId}/championships`)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [leagueId, championshipId, router, supabase])

  const fetchCategories = async () => {
    if (!championshipId) return

    try {
      // Primeiro obter as categorias
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .eq("championship_id", championshipId)
        .order("created_at", { ascending: false })

      if (categoriesError) throw categoriesError
      
      // Para cada categoria, buscar a contagem de pilotos
      let categoriesWithCounts: CategoryWithPilotCount[] = []
      
      if (categoriesData && categoriesData.length > 0) {
        const categoriesWithCountsPromises = categoriesData.map(async (category) => {
          const { count, error: countError } = await supabase
            .from("category_pilots")
            .select("*", { count: 'exact', head: true })
            .eq("category_id", category.id)
          
          if (countError) {
            console.error("Erro ao contar pilotos da categoria:", countError)
            return { ...category, pilot_count: 0 }
          }
          
          return { ...category, pilot_count: count || 0 }
        })
        
        categoriesWithCounts = await Promise.all(categoriesWithCountsPromises)
      }
      
      setCategories(categoriesWithCounts)
    } catch (error) {
      console.error("Erro ao buscar categorias:", error)
    }
  }

  const handleCategoryCreated = () => {
    fetchCategories()
    setActiveTab("categories")
  }

  const handleChampionshipUpdated = () => {
    // Recarregar os dados do campeonato após atualização
    if (!championshipId) return
    
    try {
      setLoading(true)
      
      const fetchUpdatedData = async () => {
        // Fetch championship data
        const { data: championshipData, error: championshipError } = await supabase
          .from("championships")
          .select("*")
          .eq("id", championshipId)
          .single()

        if (championshipError) throw championshipError
        setChampionship(championshipData)
        
        // Também podemos atualizar as categorias, se necessário
        await fetchCategories()
      }
      
      fetchUpdatedData()
    } catch (error) {
      console.error("Erro ao atualizar dados do campeonato:", error)
      toast.error("Erro ao atualizar dados")
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

  if (!championship || !league) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Campeonato não encontrado</h1>
        <Button onClick={() => router.push(`/league/${leagueId}/championships`)}>
          Voltar para Campeonatos
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
              <Button 
                variant="outline" 
                onClick={() => router.push(`/league/${leagueId}/championships`)} 
                size="icon" 
                className="h-9 w-9"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Avatar className="h-10 w-10 ring-2 ring-primary/10 ring-offset-2">
                <AvatarImage src={championship.logo_url || undefined} alt={championship.name} />
                <AvatarFallback className="text-sm bg-primary/5">
                  {championship.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">{championship.name}</span>
            </div>
            {isOwner && (
              <EditChampionshipModal
                championship={championship}
                onSuccess={handleChampionshipUpdated}
              />
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-8 space-y-8">
        {/* Tabs Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="categories">Categorias</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Detalhes do Campeonato</CardTitle>
                <CardDescription>Informações básicas sobre o campeonato</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs">Nome</Label>
                  <p className="text-sm font-medium">{championship.name}</p>
                </div>
                <div>
                  <Label className="text-xs">Descrição</Label>
                  <p className="text-sm">{championship.description || "Sem descrição"}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Data de Início</Label>
                    <p className="text-sm">
                      {championship.start_date 
                        ? format(parseISO(championship.start_date), "MMMM 'de' yyyy", { locale: ptBR })
                        : "Não definida"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs">Data de Término</Label>
                    <p className="text-sm">
                      {championship.end_date 
                        ? format(parseISO(championship.end_date), "MMMM 'de' yyyy", { locale: ptBR })
                        : "Não definida"}
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Status</Label>
                  <p className="text-sm">
                    {championship.status === 'upcoming' && 'Em breve'}
                    {championship.status === 'active' && 'Em andamento'}
                    {championship.status === 'completed' && 'Finalizado'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estatísticas</CardTitle>
                <CardDescription>Números do campeonato</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Categorias</p>
                    <p className="text-2xl font-semibold">{categories.length}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Pilotos</p>
                    <p className="text-2xl font-semibold">0</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Corridas</p>
                    <p className="text-2xl font-semibold">0</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Categorias</h2>
              {isOwner && (
                <CreateCategoryModal 
                  championshipId={championshipId} 
                  onSuccess={handleCategoryCreated} 
                />
              )}
            </div>
            
            {categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="bg-muted/50 p-4 rounded-full mb-4">
                  <Tag className="h-8 w-8 text-muted-foreground/70" />
                </div>
                <h3 className="text-lg font-medium mb-2">Nenhuma categoria encontrada</h3>
                <p className="text-muted-foreground text-sm max-w-md mb-6">
                  Crie categorias para organizar os pilotos do campeonato.
                </p>
                {isOwner && (
                  <CreateCategoryModal 
                    championshipId={championshipId} 
                    onSuccess={handleCategoryCreated} 
                  />
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {categories.map((category) => (
                  <Card key={category.id} className="border border-border/40 shadow-none hover:shadow-sm transition-all">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between">
                        <CardTitle className="text-base">{category.name}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {category.description || "Sem descrição"}
                      </p>
                      <div className="mt-3 flex flex-col gap-1.5">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="h-3.5 w-3.5" />
                          <span>
                            {`${category.pilot_count}${category.max_pilots ? `/${category.max_pilots}` : ""} pilotos`}
                          </span>
                        </div>
                        {category.ballast_kg !== null && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Weight className="h-3.5 w-3.5" />
                            <span>
                              {`${category.ballast_kg} Kg de lastro`}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-1.5 w-full"
                        onClick={() => router.push(`/league/${leagueId}/championships/${championshipId}/categories/${category.id}`)}
                      >
                        <Tag className="h-3.5 w-3.5" />
                        Detalhes
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}