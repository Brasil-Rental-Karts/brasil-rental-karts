"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Users, Weight, Tag, Edit, Trash2, Plus } from "lucide-react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { EditCategoryModal } from "@/components/edit-category-modal"
import { AddPilotToCategoryModal } from "@/components/add-pilot-to-category-modal"
import { Breadcrumb, BreadcrumbHome, BreadcrumbItem, BreadcrumbSeparator } from "@/components/ui/breadcrumb"

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

interface Pilot {
  id: string
  name: string
  email: string
  avatar_url: string | null
}

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

interface CategoryPilot {
  id: string
  category_id: string
  pilot_id: string
  pilot_profiles: Pilot
}

interface CategoryDetailProps {
  params: Promise<{
    id: string
    championshipId: string
    categoryId: string
  }>
}

export default function CategoryDetail({ params }: CategoryDetailProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [leagueId, setLeagueId] = useState<string>("")
  const [championshipId, setChampionshipId] = useState<string>("")
  const [categoryId, setCategoryId] = useState<string>("")
  const [category, setCategory] = useState<Category | null>(null)
  const [championship, setChampionship] = useState<Championship | null>(null)
  const [pilots, setPilots] = useState<CategoryPilot[]>([])
  const [isOwner, setIsOwner] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const resolveParams = async () => {
      try {
        const resolvedParams = await params
        setLeagueId(resolvedParams.id)
        setChampionshipId(resolvedParams.championshipId)
        setCategoryId(resolvedParams.categoryId)
      } catch (error) {
        console.error("Erro ao resolver parâmetros:", error)
        router.push("/login")
      }
    }
    
    resolveParams()
  }, [params, router])

  useEffect(() => {
    if (!leagueId || !championshipId || !categoryId) return

    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          router.push("/login")
          return
        }

        // Fetch championship data
        const { data: championshipData, error: championshipError } = await supabase
          .from("championships")
          .select("*")
          .eq("id", championshipId)
          .single()

        if (championshipError) throw championshipError
        setChampionship(championshipData)

        // Verificar se o usuário é dono da liga
        const { data: leagueData, error: leagueError } = await supabase
          .from("leagues")
          .select("owner_id")
          .eq("id", leagueId)
          .single()

        if (leagueError) throw leagueError
        setIsOwner(session.user.id === leagueData.owner_id)

        // Fetch category data
        const { data: categoryData, error: categoryError } = await supabase
          .from("categories")
          .select("*")
          .eq("id", categoryId)
          .single()

        if (categoryError) throw categoryError
        setCategory(categoryData)

        // Fetch category pilots
        await fetchCategoryPilots()
      } catch (error) {
        console.error("Erro ao buscar dados:", error)
        toast.error("Erro ao carregar dados da categoria")
        router.push(`/league/${leagueId}/championships/${championshipId}`)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [leagueId, championshipId, categoryId, router, supabase])

  const fetchCategoryPilots = async () => {
    if (!categoryId) return

    try {
      const { data, error } = await supabase
        .from("category_pilots")
        .select(`
          *,
          pilot_profiles (
            id,
            name,
            email,
            avatar_url
          )
        `)
        .eq("category_id", categoryId)
        .order("created_at", { ascending: false })

      if (error) throw error
      
      setPilots(data || [])
    } catch (error) {
      console.error("Erro ao buscar pilotos da categoria:", error)
    }
  }

  const handleDeleteCategory = async () => {
    if (!confirm("Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.")) {
      return
    }

    try {
      setLoading(true)
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", categoryId)

      if (error) throw error

      toast.success("Categoria excluída com sucesso")
      router.push(`/league/${leagueId}/championships/${championshipId}`)
    } catch (error) {
      console.error("Erro ao excluir categoria:", error)
      toast.error("Erro ao excluir categoria")
      setLoading(false)
    }
  }

  const handleCategoryUpdated = async () => {
    try {
      // Fetch category data
      const { data: categoryData, error: categoryError } = await supabase
        .from("categories")
        .select("*")
        .eq("id", categoryId)
        .single()

      if (categoryError) throw categoryError
      setCategory(categoryData)
    } catch (error) {
      console.error("Erro ao atualizar dados da categoria:", error)
      toast.error("Erro ao atualizar dados")
    }
  }

  const handlePilotAdded = async () => {
    await fetchCategoryPilots()
    toast.success("Lista de pilotos atualizada")
  }

  const handleRemovePilot = async (pilotId: string) => {
    if (!confirm("Tem certeza que deseja remover este piloto da categoria?")) {
      return
    }

    try {
      setLoading(true)
      
      // Primeiro remover todos os resultados de corrida deste piloto nesta categoria
      // Isso garante que não haverá resultados órfãos após a remoção do piloto
      console.log(`Removendo resultados do piloto ${pilotId} da categoria ${categoryId}`);
      const { error: resultError } = await supabase
        .from("race_results")
        .delete()
        .match({
          category_id: categoryId,
          pilot_id: pilotId
        })

      if (resultError) {
        console.error("Erro ao remover resultados do piloto:", resultError)
        toast.error("Erro ao remover resultados do piloto")
        return
      }

      // Após remover os resultados, agora removemos o piloto da categoria
      const { error } = await supabase
        .from("category_pilots")
        .delete()
        .match({
          category_id: categoryId,
          pilot_id: pilotId
        })

      if (error) throw error

      await fetchCategoryPilots()
      toast.success("Piloto removido com sucesso")
    } catch (error) {
      console.error("Erro ao remover piloto:", error)
      toast.error("Erro ao remover piloto da categoria")
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

  if (!category || !championship) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Categoria não encontrada</h1>
        <Button onClick={() => router.push(`/league/${leagueId}/championships/${championshipId}`)}>
          Voltar para o campeonato
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
                onClick={() => router.push(`/league/${leagueId}/championships/${championshipId}`)} 
                size="icon" 
                className="h-9 w-9"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium">Categoria: {category?.name}</span>
            </div>
            <div className="flex items-center gap-2">
              {isOwner && (
                <>
                  <EditCategoryModal category={category!} onSuccess={handleCategoryUpdated} />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleDeleteCategory}
                    className="gap-1"
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-2 border-b border-border/40">
        <Breadcrumb className="text-xs">
          <BreadcrumbHome href="/pilot" />
          <BreadcrumbSeparator />
          <BreadcrumbItem href={`/league/${leagueId}`}>{championship?.league_id ? 'Liga' : ''}</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem href={`/league/${leagueId}/championships`}>Campeonatos</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem href={`/league/${leagueId}/championships/${championshipId}`}>{championship?.name}</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem active>{category?.name}</BreadcrumbItem>
        </Breadcrumb>
      </div>

      <main className="container mx-auto px-4 py-6 md:py-8 space-y-8">
        {/* Category Details */}
        <section className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detalhes da Categoria</CardTitle>
              <CardDescription>Informações sobre a categoria {category.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs">Nome</Label>
                <p className="text-sm font-medium">{category.name}</p>
              </div>
              {category.description && (
                <div>
                  <Label className="text-xs">Descrição</Label>
                  <p className="text-sm">{category.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    <span>Máximo de Pilotos</span>
                  </Label>
                  <p className="text-sm">
                    {category.max_pilots !== null ? category.max_pilots : "Não definido"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs flex items-center gap-1">
                    <Weight className="h-3.5 w-3.5" />
                    <span>Lastro (Kg)</span>
                  </Label>
                  <p className="text-sm">
                    {category.ballast_kg !== null ? `${category.ballast_kg} Kg` : "Não definido"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pilots Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Pilotos</CardTitle>
                <CardDescription>Pilotos inscritos nesta categoria</CardDescription>
              </div>
              {isOwner && (
                <AddPilotToCategoryModal
                  categoryId={categoryId}
                  maxPilots={category.max_pilots}
                  currentPilotCount={pilots.length}
                  onSuccess={handlePilotAdded}
                />
              )}
            </CardHeader>
            <CardContent>
              {pilots.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="bg-muted/50 p-4 rounded-full mb-4">
                    <Users className="h-8 w-8 text-muted-foreground/70" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Nenhum piloto registrado</h3>
                  <p className="text-muted-foreground text-sm max-w-md mb-6">
                    Adicione pilotos a esta categoria para que possam participar das corridas.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {pilots.map((pilot) => (
                    <div key={pilot.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-8 w-8">
                          <AvatarImage 
                            src={Array.isArray(pilot.pilot_profiles) 
                              ? pilot.pilot_profiles[0].avatar_url || "" 
                              : pilot.pilot_profiles.avatar_url || ""} 
                            alt={Array.isArray(pilot.pilot_profiles) 
                              ? pilot.pilot_profiles[0].name 
                              : pilot.pilot_profiles.name} 
                          />
                          <AvatarFallback>
                            {Array.isArray(pilot.pilot_profiles) 
                              ? pilot.pilot_profiles[0].name?.charAt(0) 
                              : pilot.pilot_profiles.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {Array.isArray(pilot.pilot_profiles) 
                              ? pilot.pilot_profiles[0].name 
                              : pilot.pilot_profiles.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {Array.isArray(pilot.pilot_profiles) 
                              ? pilot.pilot_profiles[0].email 
                              : pilot.pilot_profiles.email}
                          </p>
                        </div>
                      </div>
                      {isOwner && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => {
                            const pilotProfile = Array.isArray(pilot.pilot_profiles) 
                              ? pilot.pilot_profiles[0] 
                              : pilot.pilot_profiles;
                            handleRemovePilot(pilotProfile.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
} 