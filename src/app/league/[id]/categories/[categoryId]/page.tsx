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
          pilot_id: pilotId,
          created_at: new Date().toISOString()
        })
      
      if (error) throw error
      
      toast.success("Piloto adicionado com sucesso")
      setAddPilotModalOpen(false)
      await fetchCategoryPilots()
    } catch (error) {
      console.error("Erro ao adicionar piloto:", error)
      toast.error("Erro ao adicionar piloto à categoria")
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
      await fetchCategoryPilots()
    } catch (error) {
      console.error("Erro ao remover piloto:", error)
      toast.error("Erro ao remover piloto da categoria")
    }
  }

  // When the add pilot modal opens, fetch available pilots
  useEffect(() => {
    if (addPilotModalOpen) {
      fetchAvailablePilots()
    }
  }, [addPilotModalOpen, searchQuery, categoryPilots])

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
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="bg-primary/10 py-8">
        <div className="container mx-auto px-4">
          <Button 
            variant="outline" 
            onClick={() => router.push(`/league/${leagueId}/categories`)}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Categorias
          </Button>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div className="flex items-center gap-2">
              <Tag className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">{category.name}</h1>
                <p className="text-muted-foreground mt-1">
                  Liga: {league.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <Tabs defaultValue="details">
          <TabsList className="mb-8">
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="pilots">Pilotos</TabsTrigger>
          </TabsList>
          
          {/* Details Tab */}
          <TabsContent value="details">
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-primary" />
                  Detalhes da Categoria
                </CardTitle>
                <CardDescription>
                  Edite as informações da categoria
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome da Categoria</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nome da categoria"
                    disabled={!isOwner || saving}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descrição da categoria"
                    disabled={!isOwner || saving}
                  />
                </div>
              </CardContent>
              {isOwner && (
                <CardFooter>
                  <Button 
                    className="w-full gap-2" 
                    disabled={saving} 
                    onClick={handleSaveCategory}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Salvar Alterações
                      </>
                    )}
                  </Button>
                </CardFooter>
              )}
            </Card>
          </TabsContent>
          
          {/* Pilots Tab */}
          <TabsContent value="pilots">
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Pilotos na Categoria</h2>
                {isOwner && (
                  <Dialog open={addPilotModalOpen} onOpenChange={setAddPilotModalOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Adicionar Piloto
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Adicionar Piloto à Categoria</DialogTitle>
                      </DialogHeader>
                      <div className="py-4">
                        <Input
                          placeholder="Buscar por nome..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="mb-4"
                        />
                        
                        {availablePilots.length === 0 ? (
                          <div className="text-center py-8">
                            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">
                              Nenhum piloto disponível
                            </h3>
                            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                              Não foram encontrados pilotos que ainda não estejam na categoria.
                            </p>
                          </div>
                        ) : (
                          <div className="max-h-[300px] overflow-y-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Piloto</TableHead>
                                  <TableHead className="w-[100px]">Ação</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {availablePilots.map(pilot => (
                                  <TableRow key={pilot.id}>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <Avatar className="h-8 w-8">
                                          <AvatarImage src={pilot.avatar_url || undefined} alt={pilot.name} />
                                          <AvatarFallback>{pilot.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <p className="font-medium">{pilot.name}</p>
                                          <p className="text-xs text-muted-foreground">{pilot.email}</p>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={() => handleAddPilot(pilot.id)}
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              
              {/* Pilots List */}
              {categoryPilots.length === 0 ? (
                <div className="text-center py-12 border rounded-lg bg-muted/20">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Nenhum piloto nesta categoria
                  </h3>
                  <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                    Esta categoria ainda não possui pilotos cadastrados.
                    {isOwner && " Clique no botão acima para adicionar pilotos."}
                  </p>
                  {isOwner && (
                    <Button 
                      className="gap-2"
                      onClick={() => setAddPilotModalOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar Piloto
                    </Button>
                  )}
                </div>
              ) : (
                <Card>
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
                                <AvatarFallback>{cp.pilot_profiles.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{cp.pilot_profiles.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {cp.pilot_profiles.email}
                          </TableCell>
                          {isOwner && (
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-100"
                                onClick={() => handleRemovePilot(cp.id)}
                                title="Remover piloto"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 