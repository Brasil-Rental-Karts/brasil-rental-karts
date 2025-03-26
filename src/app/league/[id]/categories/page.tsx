"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Plus, Tag, Trash2, Edit, Users } from "lucide-react"
import { Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CreateCategoryModal } from "@/components/create-category-modal"
import { toast } from "sonner"

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

interface CategoriesPageProps {
  params: Promise<{
    id: string
  }>
}

export default function CategoriesPage({ params }: CategoriesPageProps) {
  const router = useRouter()
  const [league, setLeague] = useState<League | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)
  const [leagueId, setLeagueId] = useState<string>("")
  const supabase = createClientComponentClient()

  useEffect(() => {
    const resolveParams = async () => {
      try {
        const resolvedParams = await params
        setLeagueId(resolvedParams.id)
      } catch (error) {
        console.error("Erro ao resolver parâmetros:", error)
        router.push("/login")
      }
    }
    
    resolveParams()
  }, [params, router])

  useEffect(() => {
    if (!leagueId) return

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
        
        // Fetch categories
        await fetchCategories()
      } catch (error) {
        console.error("Erro ao buscar dados:", error)
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [leagueId, router, supabase])

  const fetchCategories = async () => {
    if (!leagueId) return

    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("league_id", leagueId)
        .order("name", { ascending: true })

      if (error) throw error
      
      setCategories(data || [])
    } catch (error) {
      console.error("Erro ao buscar categorias:", error)
      toast.error("Erro ao buscar categorias")
    }
  }

  const handleCategoryCreated = () => {
    fetchCategories()
  }

  const handleEditCategory = (categoryId: string) => {
    router.push(`/league/${leagueId}/categories/${categoryId}`)
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.")) {
      return
    }

    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", categoryId)

      if (error) throw error
      
      toast.success("Categoria excluída com sucesso")
      fetchCategories()
    } catch (error) {
      console.error("Erro ao excluir categoria:", error)
      toast.error("Erro ao excluir categoria")
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
      {/* Header */}
      <div className="bg-primary/10 py-8">
        <div className="container mx-auto px-4">
          <Button 
            variant="outline" 
            onClick={() => router.push(`/league/${leagueId}`)}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Dashboard
          </Button>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-3xl font-bold">Categorias</h1>
              <p className="text-muted-foreground mt-2">
                Gerencie as categorias da liga {league.name}
              </p>
            </div>
            
            {isOwner && (
              <CreateCategoryModal leagueId={leagueId} onSuccess={handleCategoryCreated} />
            )}
          </div>
        </div>
      </div>
      
      {/* Categories */}
      <div className="container mx-auto px-4 py-12">
        <Tabs defaultValue="all">
          <TabsList className="mb-8">
            <TabsTrigger value="all">Todas as Categorias</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            {categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Tag className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-2xl font-bold mb-2">Nenhuma categoria encontrada</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Você ainda não possui categorias nesta liga.
                  {isOwner && " Clique no botão acima para criar uma nova categoria."}
                </p>
                {isOwner && (
                  <CreateCategoryModal leagueId={leagueId} onSuccess={handleCategoryCreated} />
                )}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {categories.map(category => (
                  <Card key={category.id} className="border-2 shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Tag className="h-5 w-5 text-primary" />
                        {category.name}
                      </CardTitle>
                      <CardDescription>
                        {category.description || "Sem descrição"}
                      </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex justify-between gap-2">
                      <Button 
                        variant="default" 
                        className="flex-1"
                        onClick={() => handleEditCategory(category.id)}
                      >
                        {isOwner ? (
                          <>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </>
                        ) : (
                          <>
                            <Users className="h-4 w-4 mr-2" />
                            Ver Pilotos
                          </>
                        )}
                      </Button>
                      
                      {isOwner && (
                        <Button 
                          variant="destructive" 
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 