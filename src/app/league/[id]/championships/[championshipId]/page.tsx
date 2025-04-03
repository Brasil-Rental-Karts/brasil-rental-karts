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
import { ArrowLeft, Trophy, Calendar, Tag, Edit, Users, Plus, Weight, Trash2, Flag, Medal, ArrowUp, ArrowDown, Minus } from "lucide-react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreateCategoryModal } from "@/components/create-category-modal"
import { EditChampionshipModal } from "@/components/edit-championship-modal"
import { ScoringSystemModal } from "@/components/scoring-system-modal"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CreateRaceModal } from "@/components/create-race-modal"
import { EditRaceModal } from "@/components/edit-race-modal"
import { 
  CheckCircle, 
  X as XIcon, 
  MapPin,
  Route
} from "lucide-react"

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

interface Race {
  id: string
  championship_id: string
  name: string
  description: string | null
  date: string | null
  location: string | null
  track_layout: string | null
  status: "scheduled" | "completed" | "cancelled"
  created_at: string
  updated_at: string
}

interface ScoringSystem {
  id: string
  name: string
  description: string
  is_default: boolean
  points: Record<string, number>
}

interface RaceResult {
  id: string
  race_id: string
  pilot_id: string
  category_id: string
  position: number | null
  qualification_position: number | null
  fastest_lap: boolean
  dnf: boolean
  dq: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

interface Pilot {
  id: string
  name: string
  avatar_url: string | null
  email: string
}

interface PilotStanding {
  pilot_id: string
  pilot_name: string
  pilot_avatar: string | null
  total_points: number
  positions: Record<string, number | null> // race_id -> position
  fastest_laps: number
  dnfs: number
  dqs: number
  // Campos para exibição
  position?: number
  previous_position?: number
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
  const [isPilot, setIsPilot] = useState(false)
  const [userCategories, setUserCategories] = useState<string[]>([])
  const [categories, setCategories] = useState<CategoryWithPilotCount[]>([])
  const [activeTab, setActiveTab] = useState("overview")
  const [races, setRaces] = useState<Race[]>([])
  const [scoringSystem, setScoringSystem] = useState<ScoringSystem | null>(null)
  const [pilotStandings, setPilotStandings] = useState<Record<string, PilotStanding[]>>({})
  const [loadingStandings, setLoadingStandings] = useState(false)
  const [standingsCategory, setStandingsCategory] = useState<string | null>(null)
  const [selectedPilot, setSelectedPilot] = useState<PilotStanding | null>(null)
  const [selectedPilotResults, setSelectedPilotResults] = useState<Record<string, any>>({})
  const [loadingPilotResults, setLoadingPilotResults] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
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
        
        const isUserOwner = session.user.id === leagueData.owner_id;
        setIsOwner(isUserOwner)

        // Fetch championship data
        const { data: championshipData, error: championshipError } = await supabase
          .from("championships")
          .select("*")
          .eq("id", championshipId)
          .single()

        if (championshipError) throw championshipError
        setChampionship(championshipData)

        // Verificar se o usuário é piloto em alguma categoria do campeonato
        const { data: pilotCategories, error: pilotCategoriesError } = await supabase
          .from("category_pilots")
          .select("category_id, categories!inner(championship_id)")
          .eq("pilot_id", session.user.id)
          .eq("categories.championship_id", championshipId)

        if (!pilotCategoriesError && pilotCategories && pilotCategories.length > 0) {
          setIsPilot(true)
          // Armazenar as categorias onde o usuário é piloto
          const categoryIds = pilotCategories.map(pc => pc.category_id)
          setUserCategories(categoryIds)
          
          // Se o usuário só for piloto, definir a categoria selecionada para a primeira categoria do usuário
          if (!isUserOwner && categoryIds.length > 0) {
            setStandingsCategory(categoryIds[0])
            // Se o usuário é apenas piloto, definir a aba ativa para standings
            setActiveTab("standings")
          }
        }

        // Fetch scoring system if exists
        if (championshipData.scoring_system_id) {
          const { data: scoringData, error: scoringError } = await supabase
            .from("scoring_systems")
            .select("*")
            .eq("id", championshipData.scoring_system_id)
            .single()
          
          if (!scoringError && scoringData) {
            setScoringSystem(scoringData)
          }
        }

        // Fetch categories
        await fetchCategories()
        
        // Fetch races
        await fetchRaces()
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

  const fetchRaces = async () => {
    if (!championshipId) return

    try {
      const { data, error } = await supabase
        .from("races")
        .select("*")
        .eq("championship_id", championshipId)
        .order("date", { ascending: true })

      if (error) throw error
      
      setRaces(data || [])
    } catch (error) {
      console.error("Erro ao buscar etapas:", error)
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
        
        // Fetch scoring system if exists
        if (championshipData.scoring_system_id) {
          const { data: scoringData, error: scoringError } = await supabase
            .from("scoring_systems")
            .select("*")
            .eq("id", championshipData.scoring_system_id)
            .single()
          
          if (!scoringError && scoringData) {
            setScoringSystem(scoringData)
          }
        }
        
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

  const handleRaceCreated = () => {
    fetchRaces()
    setActiveTab("races")
  }

  const handleRaceUpdated = () => {
    fetchRaces()
  }

  const handleDeleteRace = async (raceId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta etapa? Esta ação não pode ser desfeita.")) {
      return
    }

    try {
      const { error } = await supabase
        .from("races")
        .delete()
        .eq("id", raceId)

      if (error) throw error

      toast.success("Etapa excluída com sucesso")
      fetchRaces()
    } catch (error) {
      console.error("Erro ao excluir etapa:", error)
      toast.error("Erro ao excluir etapa")
    }
  }

  const fetchPilotStandings = async () => {
    if (!championshipId || !championship?.scoring_system_id) return
    
    setLoadingStandings(true)
    
    try {
      // 1. Obter as categorias
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("id, name")
        .eq("championship_id", championshipId)
      
      if (categoriesError) throw categoriesError
      if (!categoriesData || categoriesData.length === 0) return
      
      // Se nenhuma categoria for selecionada, selecionar a primeira
      if (!standingsCategory && categoriesData.length > 0) {
        setStandingsCategory(categoriesData[0].id)
      }
      
      // 2. Obter os pilotos por categoria
      const standingsByCategory: Record<string, PilotStanding[]> = {}
      
      for (const category of categoriesData) {
        // Obter os pilotos da categoria
        const { data: pilotsData, error: pilotsError } = await supabase
          .from("category_pilots")
          .select(`
            pilot_id,
            pilot_profiles (
              id,
              name,
              avatar_url,
              email
            )
          `)
          .eq("category_id", category.id)
        
        if (pilotsError) {
          console.error("Erro ao buscar pilotos da categoria:", pilotsError)
          continue
        }
        
        if (!pilotsData || pilotsData.length === 0) continue
        
        // Criar estrutura inicial de classificação para esta categoria
        standingsByCategory[category.id] = pilotsData.map(entry => ({
          pilot_id: entry.pilot_id,
          pilot_name: (entry.pilot_profiles as any).name,
          pilot_avatar: (entry.pilot_profiles as any).avatar_url,
          total_points: 0,
          positions: {},
          fastest_laps: 0,
          dnfs: 0,
          dqs: 0
        }))
        
        // 3. Obter todas as corridas do campeonato
        const { data: racesData, error: racesError } = await supabase
          .from("races")
          .select("id")
          .eq("championship_id", championshipId)
        
        if (racesError) {
          console.error("Erro ao buscar corridas:", racesError)
          continue
        }
        
        if (!racesData || racesData.length === 0) continue
        
        // 4. Obter o sistema de pontuação
        const { data: scoringSystemData, error: scoringError } = await supabase
          .from("scoring_systems")
          .select("points")
          .eq("id", championship.scoring_system_id)
          .single()
        
        if (scoringError) {
          console.error("Erro ao buscar sistema de pontuação:", scoringError)
          continue
        }
        
        const scoringSystem = scoringSystemData.points as Record<string, number>
        
        // 5. Para cada corrida, obter os resultados dos pilotos da categoria
        for (const race of racesData) {
          // Buscar todos os resultados para esta corrida e categoria (incluindo todas as baterias)
          const { data: resultsData, error: resultsError } = await supabase
            .from("race_results")
            .select("*")
            .eq("race_id", race.id)
            .eq("category_id", category.id)
          
          if (resultsError) {
            console.error("Erro ao buscar resultados da corrida:", resultsError)
            continue
          }
          
          if (!resultsData || resultsData.length === 0) continue
          
          // Agrupar resultados por bateria
          const heatResults: Record<number, typeof resultsData> = {};
          resultsData.forEach(result => {
            const heatNumber = result.heat_number || 1;
            if (!heatResults[heatNumber]) {
              heatResults[heatNumber] = [];
            }
            heatResults[heatNumber].push(result);
          });
          
          // 6. Para cada bateria, atualizar os pontos e estatísticas de cada piloto
          for (const [heatNumber, heatResultsData] of Object.entries(heatResults)) {
            for (const result of heatResultsData) {
              const pilotIndex = standingsByCategory[category.id].findIndex(
                p => p.pilot_id === result.pilot_id
              )
              
              if (pilotIndex === -1) continue
              
              // Definir chave única para posição (combina ID da corrida e número da bateria)
              const positionKey = `${race.id}_${heatNumber}`;
              
              // Atualizar a posição do piloto nesta corrida/bateria
              standingsByCategory[category.id][pilotIndex].positions[positionKey] = result.position
              
              // Atualizar estatísticas
              if (result.fastest_lap) {
                standingsByCategory[category.id][pilotIndex].fastest_laps += 1
              }
              
              if (result.dnf) {
                standingsByCategory[category.id][pilotIndex].dnfs += 1
              }
              
              if (result.dq) {
                standingsByCategory[category.id][pilotIndex].dqs += 1
              }
              
              // Calcular pontos se tiver posição e não estiver desqualificado
              if (result.position !== null && !result.dq) {
                const positionStr = result.position.toString()
                const points = scoringSystem[positionStr] || 0
                standingsByCategory[category.id][pilotIndex].total_points += points
              }
            }
          }
        }
        
        // 7. Ordenar os pilotos por pontuação
        standingsByCategory[category.id].sort((a, b) => b.total_points - a.total_points)
        
        // 8. Atribuir a posição atual
        standingsByCategory[category.id].forEach((pilot, index) => {
          pilot.position = index + 1
          pilot.previous_position = index + 1 // Por enquanto sem histórico anterior
        })
      }
      
      setPilotStandings(standingsByCategory)
    } catch (error) {
      console.error("Erro ao calcular classificação:", error)
      toast.error("Erro ao carregar classificação do campeonato")
    } finally {
      setLoadingStandings(false)
    }
  }

  const fetchPilotResultDetails = async (pilotId: string, categoryId: string) => {
    if (!championshipId || !pilotId) return
    
    setLoadingPilotResults(true)
    
    try {
      // Obter todas as corridas do campeonato
      const { data: racesData, error: racesError } = await supabase
        .from("races")
        .select("id, name, date")
        .eq("championship_id", championshipId)
        .order("date", { ascending: true })
      
      if (racesError) throw racesError
      if (!racesData || racesData.length === 0) return
      
      // Para cada corrida, obter todos os resultados do piloto naquela corrida (todas as baterias)
      const allResults = [];
      
      for (const race of racesData) {
        // Buscar todos os resultados deste piloto para esta corrida
        const { data, error } = await supabase
          .from("race_results")
          .select("*")
          .eq("race_id", race.id)
          .eq("pilot_id", pilotId)
          .eq("category_id", categoryId)
        
        if (error) {
          console.error("Erro ao buscar resultados do piloto:", error);
          continue;
        }
        
        // Se não houver resultados, criar um registro vazio para a corrida
        if (!data || data.length === 0) {
          allResults.push({
            race_id: race.id,
            race_name: race.name,
            race_date: race.date,
            heat_number: 1,
            heat_name: "Bateria única",
            position: null,
            qualification_position: null,
            fastest_lap: false,
            dnf: false,
            dq: false,
            points: 0
          });
          continue;
        }
        
        // Para cada resultado/bateria, criar um registro
        for (const result of data) {
          // Calcular pontos se tiver posição e não estiver desqualificado
          let points = 0;
          if (scoringSystem && result.position !== null && !result.dq) {
            const positionStr = result.position.toString();
            points = scoringSystem.points[positionStr] || 0;
          }
          
          // Adicionar resultado formatado ao array
          allResults.push({
            race_id: race.id,
            race_name: race.name,
            race_date: race.date,
            heat_number: result.heat_number || 1,
            heat_name: result.heat_number ? `Bateria ${result.heat_number}` : "Bateria única",
            position: result.position,
            qualification_position: result.qualification_position,
            fastest_lap: result.fastest_lap,
            dnf: result.dnf,
            dq: result.dq,
            points
          });
        }
      }
      
      // Organizar resultados por corrida para exibição
      const resultsByRaceHeat: Record<string, any> = {};
      allResults.forEach(result => {
        // Chave composta por ID da corrida e número da bateria
        const key = `${result.race_id}_${result.heat_number}`;
        resultsByRaceHeat[key] = result;
      });
      
      setSelectedPilotResults(resultsByRaceHeat);
    } catch (error) {
      console.error("Erro ao buscar detalhes do piloto:", error)
      toast.error("Erro ao carregar detalhes do piloto")
    } finally {
      setLoadingPilotResults(false)
    }
  }

  const handleShowPilotDetails = (pilot: PilotStanding) => {
    if (!standingsCategory) return
    
    setSelectedPilot(pilot)
    setIsDetailDialogOpen(true)
    fetchPilotResultDetails(pilot.pilot_id, standingsCategory)
  }

  useEffect(() => {
    if (championship && categories.length > 0) {
      fetchPilotStandings()
    }
  }, [championship, categories])

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
              {isPilot && !isOwner && (
                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                  Participando
                </span>
              )}
            </div>
            {isOwner && (
              <div className="flex items-center gap-2">
                <EditChampionshipModal
                  championship={championship}
                  onSuccess={handleChampionshipUpdated}
                />
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-8 space-y-8">
        {/* Tabs Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full ${isOwner ? "grid-cols-4" : "grid-cols-2"} md:w-auto md:inline-flex`}>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            {isOwner && <TabsTrigger value="categories">Categorias</TabsTrigger>}
            {isOwner && <TabsTrigger value="races">Etapas</TabsTrigger>}
            {(isOwner || isPilot) && <TabsTrigger value="standings">Classificação</TabsTrigger>}
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
                <div>
                  <Label className="text-xs">Sistema de Pontuação</Label>
                  <div className="flex justify-between items-center">
                    <p className="text-sm">
                      {scoringSystem ? scoringSystem.name : "Não definido"}
                    </p>
                    {isOwner && (
                      <ScoringSystemModal
                        championship={championship}
                        onSuccess={handleChampionshipUpdated}
                      />
                    )}
                  </div>
                  {scoringSystem && (
                    <div className="mt-2 grid grid-cols-4 gap-2">
                      {Object.entries(scoringSystem.points)
                        .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
                        .slice(0, 8)
                        .map(([position, points]) => (
                          <div key={position} className="text-xs text-muted-foreground">
                            P{position}: <span className="font-medium">{points}</span>
                          </div>
                        ))}
                      {Object.keys(scoringSystem.points).length > 8 && (
                        <div className="text-xs text-muted-foreground">...</div>
                      )}
                    </div>
                  )}
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
                    <p className="text-2xl font-semibold">{races.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Calendário de Etapas */}
            {!isOwner && (
              <Card>
                <CardHeader>
                  <CardTitle>Calendário de Etapas</CardTitle>
                  <CardDescription>Cronograma de corridas do campeonato</CardDescription>
                </CardHeader>
                <CardContent className="px-0">
                  {races.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="bg-muted/50 p-4 rounded-full mb-4">
                        <Calendar className="h-6 w-6 text-muted-foreground/70" />
                      </div>
                      <h3 className="text-base font-medium mb-2">Nenhuma etapa agendada</h3>
                      <p className="text-muted-foreground text-sm max-w-md">
                        {isOwner 
                          ? "Adicione etapas para visualizar o calendário." 
                          : "Este campeonato ainda não possui etapas agendadas."}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {races
                        .sort((a, b) => new Date(a.date || '9999-12-31').getTime() - new Date(b.date || '9999-12-31').getTime())
                        .map((race) => (
                          <div key={race.id} className="flex items-center justify-between px-6 py-4">
                            <div className="flex items-start gap-4">
                              <div className="bg-muted/30 rounded-md p-2 h-12 w-12 flex flex-col items-center justify-center text-center">
                                {race.date ? (
                                  <>
                                    <span className="text-xs font-semibold">{format(parseISO(race.date), "MMM", { locale: ptBR })}</span>
                                    <span className="text-lg font-bold leading-none">{format(parseISO(race.date), "dd")}</span>
                                  </>
                                ) : (
                                  <span className="text-xs font-medium">Data não<br/>definida</span>
                                )}
                              </div>
                              <div>
                                <h4 className="text-sm font-medium">{race.name}</h4>
                                <div className="mt-1 flex flex-col gap-0.5">
                                  {race.description && (
                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                      {race.description}
                                    </p>
                                  )}
                                  {race.location && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <MapPin className="h-3 w-3" />
                                      <span>{race.location}</span>
                                    </div>
                                  )}
                                  {race.track_layout && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Route className="h-3 w-3" />
                                      <span>{race.track_layout}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                race.status === 'completed' 
                                  ? 'bg-green-50 text-green-700' 
                                  : race.status === 'cancelled' 
                                    ? 'bg-red-50 text-red-700' 
                                    : 'bg-blue-50 text-blue-700'
                              }`}>
                                {race.status === 'completed' 
                                  ? 'Concluída' 
                                  : race.status === 'cancelled' 
                                    ? 'Cancelada' 
                                    : 'Agendada'}
                              </span>
                              {isOwner && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => router.push(`/league/${leagueId}/championships/${championshipId}/races/${race.id}`)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            {isOwner || isPilot ? (
              <>
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
                      {isOwner 
                        ? "Crie categorias para organizar os pilotos do campeonato." 
                        : "Este campeonato ainda não possui categorias configuradas."}
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
                            Editar
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            ) : null}
          </TabsContent>
          
          {/* Races Tab */}
          <TabsContent value="races" className="space-y-6">
            {isOwner || isPilot ? (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Etapas</h2>
                  {isOwner && (
                    <CreateRaceModal
                      championshipId={championshipId}
                      onSuccess={handleRaceCreated}
                    />
                  )}
                </div>
                
                {races.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="bg-muted/50 p-4 rounded-full mb-4">
                      <Tag className="h-8 w-8 text-muted-foreground/70" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Nenhuma etapa encontrada</h3>
                    <p className="text-muted-foreground text-sm max-w-md mb-6">
                      {isOwner 
                        ? "Crie etapas para organizar as corridas do campeonato." 
                        : "Este campeonato ainda não possui etapas configuradas."}
                    </p>
                    {isOwner && (
                      <CreateRaceModal
                        championshipId={championshipId}
                        onSuccess={handleRaceCreated}
                      />
                    )}
                  </div>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Calendário de Etapas</CardTitle>
                      <CardDescription>Gerencie as corridas do campeonato</CardDescription>
                    </CardHeader>
                    <CardContent className="px-0">
                      <div className="divide-y">
                        {races
                          .sort((a, b) => new Date(a.date || '9999-12-31').getTime() - new Date(b.date || '9999-12-31').getTime())
                          .map((race) => (
                            <div key={race.id} className="flex items-center justify-between px-6 py-4">
                              <div className="flex items-start gap-4">
                                <div className="bg-muted/30 rounded-md p-2 h-12 w-12 flex flex-col items-center justify-center text-center">
                                  {race.date ? (
                                    <>
                                      <span className="text-xs font-semibold">{format(parseISO(race.date), "MMM", { locale: ptBR })}</span>
                                      <span className="text-lg font-bold leading-none">{format(parseISO(race.date), "dd")}</span>
                                    </>
                                  ) : (
                                    <span className="text-xs font-medium">Data não<br/>definida</span>
                                  )}
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium">{race.name}</h4>
                                  <div className="mt-1 flex flex-col gap-0.5">
                                    {race.description && (
                                      <p className="text-xs text-muted-foreground line-clamp-1">
                                        {race.description}
                                      </p>
                                    )}
                                    {race.location && (
                                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <MapPin className="h-3 w-3" />
                                        <span>{race.location}</span>
                                      </div>
                                    )}
                                    {race.track_layout && (
                                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Route className="h-3 w-3" />
                                        <span>{race.track_layout}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  race.status === 'completed' 
                                    ? 'bg-green-50 text-green-700' 
                                    : race.status === 'cancelled' 
                                      ? 'bg-red-50 text-red-700' 
                                      : 'bg-blue-50 text-blue-700'
                                }`}>
                                  {race.status === 'completed' 
                                    ? 'Concluída' 
                                    : race.status === 'cancelled' 
                                      ? 'Cancelada' 
                                      : 'Agendada'}
                                </span>
                                {isOwner && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => router.push(`/league/${leagueId}/championships/${championshipId}/races/${race.id}`)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : null}
          </TabsContent>
          
          {/* Standings Tab */}
          <TabsContent value="standings" className="space-y-6">
            {isOwner || isPilot ? (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Classificação Geral</h2>
                </div>
                
                {categories.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="bg-muted/50 p-4 rounded-full mb-4">
                      <Medal className="h-8 w-8 text-muted-foreground/70" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Nenhuma categoria encontrada</h3>
                    <p className="text-muted-foreground text-sm max-w-md mb-6">
                      {isOwner 
                        ? "Crie categorias primeiro para visualizar a classificação." 
                        : "Este campeonato ainda não possui categorias configuradas."}
                    </p>
                    {isOwner && (
                      <CreateCategoryModal 
                        championshipId={championshipId} 
                        onSuccess={handleCategoryCreated} 
                      />
                    )}
                  </div>
                ) : (
                  <>
                    {/* Seletor de Categoria - Quando for somente piloto, mostrar só as categorias onde ele participa */}
                    <div className="space-y-2">
                      <Label htmlFor="category-select">Categoria</Label>
                      <Select 
                        value={standingsCategory || ""} 
                        onValueChange={(value: string) => setStandingsCategory(value)}
                      >
                        <SelectTrigger id="category-select">
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {isOwner 
                            ? categories.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.name}
                                </SelectItem>
                              ))
                            : categories
                                .filter(category => userCategories.includes(category.id))
                                .map((category) => (
                                  <SelectItem key={category.id} value={category.id}>
                                    {category.name}
                                  </SelectItem>
                                ))
                          }
                        </SelectContent>
                      </Select>
                    </div>

                    {loadingStandings ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : (
                      <>
                        {standingsCategory && pilotStandings[standingsCategory]?.length > 0 ? (
                          <div className="rounded-md border overflow-hidden">
                            <div className="overflow-x-auto">
                              <table className="w-full divide-y">
                                <thead className="bg-muted">
                                  <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-20">
                                      Pos.
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                      Piloto
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">
                                      Pontos
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider w-24 hidden md:table-cell">
                                      V. Rápidas
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider w-24 hidden md:table-cell">
                                      DNF/DSQ
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y">
                                  {pilotStandings[standingsCategory].map((standing) => (
                                    <tr 
                                      key={standing.pilot_id} 
                                      className="hover:bg-muted/40 transition-colors cursor-pointer" 
                                      onClick={() => handleShowPilotDetails(standing)}
                                    >
                                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                                        <div className="flex items-center gap-1">
                                          <span className="font-semibold">{standing.position}</span>
                                          <span className="text-xs text-muted-foreground ml-1">
                                            {standing.position !== undefined && 
                                             standing.previous_position !== undefined && 
                                             standing.position !== standing.previous_position && (
                                              standing.position < standing.previous_position ? (
                                                <ArrowUp className="h-3.5 w-3.5 text-green-500" />
                                              ) : standing.position > standing.previous_position ? (
                                                <ArrowDown className="h-3.5 w-3.5 text-red-500" />
                                              ) : (
                                                <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                                              )
                                            )}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="flex items-center">
                                          <Avatar className="h-7 w-7 mr-2 hidden sm:inline-flex">
                                            <AvatarImage src={standing.pilot_avatar || undefined} />
                                            <AvatarFallback className="text-xs">
                                              {standing.pilot_name.charAt(0)}
                                            </AvatarFallback>
                                          </Avatar>
                                          <span className="text-sm font-medium">{standing.pilot_name}</span>
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center font-semibold">
                                        {standing.total_points}
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center hidden md:table-cell">
                                        {standing.fastest_laps}
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center hidden md:table-cell">
                                        {standing.dnfs + standing.dqs}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="bg-muted/50 p-4 rounded-full mb-4">
                              <Trophy className="h-8 w-8 text-muted-foreground/70" />
                            </div>
                            <h3 className="text-lg font-medium mb-2">Nenhum resultado disponível</h3>
                            <p className="text-muted-foreground text-sm max-w-md">
                              Adicione pilotos às categorias e registre resultados das etapas para visualizar a classificação.
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </>
            ) : null}
          </TabsContent>
        </Tabs>
      </main>

      {/* Pilot Details Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={selectedPilot?.pilot_avatar || undefined} />
                <AvatarFallback>
                  {selectedPilot?.pilot_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {selectedPilot?.pilot_name}
            </DialogTitle>
          </DialogHeader>
          
          {loadingPilotResults ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="py-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <span className="text-xs text-muted-foreground">Posição</span>
                  <p className="text-xl font-bold">{selectedPilot?.position || '-'}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Total de Pontos</span>
                  <p className="text-xl font-bold text-right">{selectedPilot?.total_points || '0'}</p>
                </div>
              </div>
              
              <div className="rounded-md border overflow-hidden">
                <table className="w-full divide-y">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Etapa
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">
                        Bateria
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">
                        Pos.
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">
                        Pts.
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider w-28 hidden sm:table-cell">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y">
                    {Object.values(selectedPilotResults)
                      .sort((a, b) => {
                        // Ordenar primeiro por data da corrida
                        const dateComparison = new Date(a.race_date || 0).getTime() - new Date(b.race_date || 0).getTime();
                        if (dateComparison !== 0) return dateComparison;
                        
                        // Em caso de mesma corrida, ordenar por número da bateria
                        return a.heat_number - b.heat_number;
                      })
                      .map((result) => (
                        <tr key={`${result.race_id}_${result.heat_number}`} className="hover:bg-muted/40 transition-colors">
                          <td className="px-4 py-2 whitespace-nowrap text-sm">
                            {result.race_name}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-center">
                            {result.heat_name}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-center">
                            {result.position !== null ? result.position : result.dq ? 'DSQ' : result.dnf ? 'DNF' : '-'}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-center font-medium">
                            {result.points}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-xs text-center hidden sm:table-cell">
                            <div className="flex justify-center items-center gap-1">
                              {result.fastest_lap && (
                                <span className="inline-flex items-center rounded-full bg-purple-50 px-1.5 py-0.5 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-600/20">VR</span>
                              )}
                              {result.dnf && (
                                <span className="inline-flex items-center rounded-full bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">DNF</span>
                              )}
                              {result.dq && (
                                <span className="inline-flex items-center rounded-full bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">DSQ</span>
                              )}
                              {!result.fastest_lap && !result.dnf && !result.dq && result.position === null && (
                                <span className="inline-flex items-center rounded-full bg-gray-50 px-1.5 py-0.5 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-600/20">-</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              
              <div className="text-xs text-muted-foreground mt-4">
                <span className="inline-flex items-center rounded-full bg-purple-50 px-1.5 py-0.5 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-600/20 mr-1">VR</span> Volta mais rápida
                <span className="inline-flex items-center rounded-full bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20 mr-1 ml-2">DNF</span> Não completou
                <span className="inline-flex items-center rounded-full bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20 ml-2">DSQ</span> Desqualificado
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setIsDetailDialogOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}