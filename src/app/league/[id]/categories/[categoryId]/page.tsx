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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Check, Loader2, Plus, Save, Tag, User, Users, X } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface Category {
  id: string
  name: string
  description: string
  league_id: string
  created_at: string
  updated_at: string
}

interface League {
  id: string
  name: string
  owner_id: string
}

interface Pilot {
  id: string
  name: string
  email: string
  avatar_url: string | null
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
    categoryId: string
  }>
}

export default function CategoryDetail({ params }: CategoryDetailProps) {
  const router = useRouter()
  const [league, setLeague] = useState<League | null>(null)
  const [category, setCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [leagueId, setLeagueId] = useState<string>("")
  const [categoryId, setCategoryId] = useState<string>("")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [categoryPilots, setCategoryPilots] = useState<CategoryPilot[]>([])
  const [availablePilots, setAvailablePilots] = useState<Pilot[]>([])
  const [addPilotModalOpen, setAddPilotModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const supabase = createClientComponentClient()

  useEffect(() => {
    const resolveParams = async () => {
      try {
        const resolvedParams = await params
        setLeagueId(resolvedParams.id)
        setCategoryId(resolvedParams.categoryId)
      } catch (error) {
        console.error("Erro ao resolver parâmetros:", error)
        router.push("/login")
      }
    }
    
    resolveParams()
  }, [params, router])

  useEffect(() => {
    if (!leagueId || !categoryId) return

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
          .select("id, name, owner_id")
          .eq("id", leagueId)
          .single()

        if (leagueError) throw leagueError

        setLeague(leagueData)
        setIsOwner(session.user.id === leagueData.owner_id)
        
        // Fetch category data
        const { data: categoryData, error: categoryError } = await supabase
          .from("categories")
          .select("*")
          .eq("id", categoryId)
          .single()

        if (categoryError) throw categoryError

        if (categoryData.league_id !== leagueId) {
          // Category does not belong to this league
          toast.error("Categoria não pertence a esta liga")
          router.push(`/league/${leagueId}/categories`)
          return
        }

        setCategory(categoryData)
        setName(categoryData.name)
        setDescription(categoryData.description || "")
        
        // Fetch category pilots
        await fetchCategoryPilots()
      } catch (error) {
        console.error("Erro ao buscar dados:", error)
        router.push(`/league/${leagueId}/categories`)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [leagueId, categoryId, router, supabase])

  const fetchCategoryPilots = async () => {
    try {
      // Fetch pilots in this category
      const { data: pilotsData, error: pilotsError } = await supabase
        .from("category_pilots")
        .select(`
          id,
          category_id,
          pilot_id,
          pilot_profiles (
            id,
            name,
            email,
            avatar_url
          )
        `)
        .eq("category_id", categoryId)
        .order("pilot_profiles(name)", { ascending: true })

      if (pilotsError) throw pilotsError
      
      // Transform the data to match our expected type
      const formattedData = pilotsData?.map(item => ({
        ...item,
        pilot_profiles: item.pilot_profiles as unknown as Pilot
      })) || []
      
      setCategoryPilots(formattedData)
    } catch (error) {
      console.error("Erro ao buscar pilotos da categoria:", error)
      toast.error("Erro ao buscar pilotos da categoria")
    }
  }

  const fetchAvailablePilots = async () => {
    try {
      // Get current pilots in the category
      const existingPilotIds = categoryPilots.map(cp => cp.pilot_id)
      
      // Find pilots not already in the category
      let query = supabase
        .from("pilot_profiles")
        .select("id, name, email, avatar_url")
        .order("name", { ascending: true })
      
      // Filter out pilots already in the category
      if (existingPilotIds.length > 0) {
        query = query.not("id", "in", `(${existingPilotIds.join(",")})`)
      }
      
      // Apply search filter if specified
      if (searchQuery.trim()) {
        query = query.ilike("name", `%${searchQuery.trim()}%`)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      setAvailablePilots(data || [])
    } catch (error) {
      console.error("Erro ao buscar pilotos disponíveis:", error)
      toast.error("Erro ao buscar pilotos disponíveis")
    }
  }

  const handleSaveCategory = async () => {
    if (!name.trim()) {
      toast.error("Nome da categoria é obrigatório")
      return
    }
    
    try {
      setSaving(true)
      
      const { error } = await supabase
        .from("categories")
        .update({
          name: name.trim(),
          description: description.trim(),
          updated_at: new Date().toISOString()
        })
        .eq("id", categoryId)
      
      if (error) throw error
      
      toast.success("Categoria atualizada com sucesso")
      
      // Update local state
      if (category) {
        setCategory({
          ...category,
          name: name.trim(),
          description: description.trim(),
          updated_at: new Date().toISOString()
        })
      }
    } catch (error) {
      console.error("Erro ao atualizar categoria:", error)
      toast.error("Erro ao atualizar categoria")
    } finally {
      setSaving(false)
    }
  }

  const handleAddPilot = async (pilotId: string) => {
    try {
      const { error } = await supabase
        .from("category_pilots")
        .insert({
          category_id: categoryId,
          pilot_id: pilotId
        })
      
      if (error) throw error
      
      toast.success("Piloto adicionado com sucesso")
      fetchCategoryPilots()
      setAddPilotModalOpen(false)
    } catch (error) {
      console.error("Erro ao adicionar piloto:", error)
      toast.error("Erro ao adicionar piloto")
    }
  }

  const handleRemovePilot = async (categoryPilotId: string) => {
    try {
      const { error } = await supabase
        .from("category_pilots")
        .delete()
        .eq("id", categoryPilotId)
      
      if (error) throw error
      
      toast.success("Piloto removido com sucesso")
      fetchCategoryPilots()
    } catch (error) {
      console.error("Erro ao remover piloto:", error)
      toast.error("Erro ao remover piloto")
    }
  }

  useEffect(() => {
    if (addPilotModalOpen) {
      fetchAvailablePilots()
    }
  }, [addPilotModalOpen, searchQuery])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!league || !category) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Categoria não encontrada</h1>
        <Button onClick={() => router.push(`/league/${leagueId}/categories`)}>
          Voltar para Categorias
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
              <Button variant="outline" onClick={() => router.push(`/league/${leagueId}/categories`)} size="icon" className="h-9 w-9">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Avatar className="h-10 w-10 ring-2 ring-primary/10 ring-offset-2">
                <AvatarFallback className="text-sm bg-primary/5">
                  <Tag className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-medium">{category.name}</span>
                <span className="text-sm text-muted-foreground">Detalhes da categoria</span>
              </div>
            </div>
            <Button 
              variant="default" 
              size="sm"
              onClick={handleSaveCategory} 
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : (
                <Save className="h-3.5 w-3.5 mr-1.5" />
              )}
              Salvar
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-8 space-y-8">
        {/* Category Details */}
        <section>
          <Card className="border border-border/40 shadow-none">
            <CardHeader>
              <CardTitle className="text-xl">Informações da Categoria</CardTitle>
              <CardDescription>
                Edite os dados desta categoria de kart
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Categoria</Label>
                <Input 
                  id="name" 
                  placeholder="Nome da categoria" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  disabled={!isOwner}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea 
                  id="description" 
                  placeholder="Descrição da categoria" 
                  rows={3}
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={!isOwner}
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Pilots Section */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h2 className="text-lg font-semibold">Pilotos na Categoria</h2>
              <p className="text-sm text-muted-foreground">Gerencie os pilotos desta categoria</p>
            </div>
            {isOwner && (
              <Dialog open={addPilotModalOpen} onOpenChange={setAddPilotModalOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    Adicionar Piloto
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Adicionar Piloto</DialogTitle>
                  </DialogHeader>
                  <div className="py-2">
                    <Input
                      placeholder="Buscar por nome..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="mb-4"
                    />
                    <div className="max-h-[300px] overflow-y-auto space-y-2">
                      {availablePilots.length === 0 ? (
                        <div className="text-center py-4">
                          <p className="text-muted-foreground">Nenhum piloto disponível</p>
                        </div>
                      ) : (
                        availablePilots.map(pilot => (
                          <div 
                            key={pilot.id} 
                            className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md"
                          >
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={pilot.avatar_url || undefined} alt={pilot.name} />
                                <AvatarFallback className="text-xs">
                                  {pilot.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{pilot.name}</p>
                                <p className="text-xs text-muted-foreground">{pilot.email}</p>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleAddPilot(pilot.id)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
          
          {categoryPilots.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/20 rounded-lg border border-dashed">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-bold mb-2">Nenhum piloto</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Ainda não há pilotos nesta categoria.
                {isOwner && " Adicione pilotos usando o botão acima."}
              </p>
              {isOwner && (
                <Dialog open={addPilotModalOpen} onOpenChange={setAddPilotModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-1.5">
                      <Plus className="h-3.5 w-3.5" />
                      Adicionar Piloto
                    </Button>
                  </DialogTrigger>
                </Dialog>
              )}
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Piloto</TableHead>
                    <TableHead>Email</TableHead>
                    {isOwner && <TableHead className="w-[100px]">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryPilots.map(cp => (
                    <TableRow key={cp.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage 
                              src={cp.pilot_profiles.avatar_url || undefined} 
                              alt={cp.pilot_profiles.name} 
                            />
                            <AvatarFallback className="text-xs">
                              {cp.pilot_profiles.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm">{cp.pilot_profiles.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{cp.pilot_profiles.email}</span>
                      </TableCell>
                      {isOwner && (
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRemovePilot(cp.id)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
} 