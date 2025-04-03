"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  X as XIcon,
  MapPin,
  Route,
  Trash2,
  Clock,
  Medal,
  Flag,
  Ban,
  Save,
  AlertCircle,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { BackButton } from "@/components/back-button"
import { EditRaceModal } from "@/components/edit-race-modal"

interface Race {
  id: string
  championship_id: string
  name: string
  description: string | null
  date: string | null
  location: string | null
  track_layout: string | null
  status: "scheduled" | "completed" | "cancelled"
}

interface League {
  id: string
  name: string
  owner_id: string
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

interface Pilot {
  id: string
  name: string
}

interface Category {
  id: string
  name: string
  pilots: Pilot[]
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
}

interface PilotWithResult extends Pilot {
  result: RaceResult | null
}

interface CategoryWithPilots extends Category {
  pilotsWithResults: PilotWithResult[]
}

interface RaceDetailProps {
  params: Promise<{
    id: string
    championshipId: string
    raceId: string
  }>
}

export default function RaceDetail({ params }: RaceDetailProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [savingResults, setSavingResults] = useState(false)
  const [leagueId, setLeagueId] = useState<string>("")
  const [championshipId, setChampionshipId] = useState<string>("")
  const [raceId, setRaceId] = useState<string>("")
  const [race, setRace] = useState<Race | null>(null)
  const [championship, setChampionship] = useState<Championship | null>(null)
  const [league, setLeague] = useState<League | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [categoriesWithPilots, setCategoriesWithPilots] = useState<CategoryWithPilots[]>([])
  const [activeTab, setActiveTab] = useState("")
  const [resultsChanged, setResultsChanged] = useState(false)
  const supabase = createClientComponentClient()

  // Formulário temporário para resultados
  const [tempResults, setTempResults] = useState<{[key: string]: {
    position: string,
    qualification_position: string,
    fastest_lap: boolean,
    dnf: boolean,
    dq: boolean,
    notes: string
  }}>({})

  useEffect(() => {
    const resolveParams = async () => {
      try {
        const resolvedParams = await params
        setLeagueId(resolvedParams.id)
        setChampionshipId(resolvedParams.championshipId)
        setRaceId(resolvedParams.raceId)
      } catch (error) {
        console.error("Erro ao resolver parâmetros:", error)
        router.push("/login")
      }
    }
    
    resolveParams()
  }, [params, router])

  useEffect(() => {
    if (!leagueId || !championshipId || !raceId) return

    const fetchData = async () => {
      try {
        setLoading(true)
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          router.push("/login")
          return
        }

        // Buscar dados da liga
        const { data: leagueData, error: leagueError } = await supabase
          .from("leagues")
          .select("*")
          .eq("id", leagueId)
          .single()

        if (leagueError) throw leagueError
        setLeague(leagueData)
        setIsOwner(session.user.id === leagueData.owner_id)

        // Buscar dados do campeonato
        const { data: championshipData, error: championshipError } = await supabase
          .from("championships")
          .select("*")
          .eq("id", championshipId)
          .single()

        if (championshipError) throw championshipError
        setChampionship(championshipData)

        // Buscar dados da etapa
        const { data: raceData, error: raceError } = await supabase
          .from("races")
          .select("*")
          .eq("id", raceId)
          .single()

        if (raceError) throw raceError
        setRace(raceData)

        // Buscar categorias com pilotos e resultados
        await fetchCategoriesWithPilotsAndResults()
      } catch (error) {
        console.error("Erro ao buscar dados:", error)
        toast.error("Erro ao carregar dados da etapa")
        router.push(`/league/${leagueId}/championships/${championshipId}`)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [leagueId, championshipId, raceId, router, supabase])

  const fetchCategoriesWithPilotsAndResults = async () => {
    if (!championshipId || !raceId) return

    try {
      // 1. Buscar todas as categorias do campeonato
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("id, name")
        .eq("championship_id", championshipId)
        .order("name")

      if (categoriesError) throw categoriesError
      
      if (!categoriesData || categoriesData.length === 0) {
        setCategoriesWithPilots([])
        return
      }

      // 2. Para cada categoria, buscar os pilotos e resultados
      const categoriesFull: CategoryWithPilots[] = await Promise.all(
        categoriesData.map(async (category) => {
          // Buscar pilotos da categoria
          const { data: categoryPilotsData, error: pilotsError } = await supabase
            .from("category_pilots")
            .select(`
              pilot_id,
              pilot_profiles:pilot_id (id, name)
            `)
            .eq("category_id", category.id)
          
          if (pilotsError) throw pilotsError

          // Buscar resultados para esta categoria nesta etapa
          const { data: resultsData, error: resultsError } = await supabase
            .from("race_results")
            .select("*")
            .eq("race_id", raceId)
            .eq("category_id", category.id)
          
          if (resultsError) throw resultsError

          // Mapear pilotos com seus resultados
          const pilotsWithResults: PilotWithResult[] = (categoryPilotsData || []).map(cp => {
            const pilotProfile = Array.isArray(cp.pilot_profiles) ? cp.pilot_profiles[0] : cp.pilot_profiles;
            const pilot = {
              id: pilotProfile.id,
              name: pilotProfile.name
            }

            const result = (resultsData || []).find(r => r.pilot_id === pilot.id) || null
            
            // Adicionar ao estado temporário de resultados
            if (result) {
              setTempResults(prev => ({
                ...prev,
                [pilot.id]: {
                  position: result.position?.toString() || "",
                  qualification_position: result.qualification_position?.toString() || "",
                  fastest_lap: result.fastest_lap || false,
                  dnf: result.dnf || false,
                  dq: result.dq || false,
                  notes: result.notes || ""
                }
              }))
            } else {
              setTempResults(prev => ({
                ...prev,
                [pilot.id]: {
                  position: "",
                  qualification_position: "",
                  fastest_lap: false,
                  dnf: false,
                  dq: false,
                  notes: ""
                }
              }))
            }

            return {
              ...pilot,
              result
            }
          })

          // Ordenar pilotsWithResults por ordem alfabética
          pilotsWithResults.sort((a, b) => a.name.localeCompare(b.name));

          return {
            id: category.id,
            name: category.name,
            pilots: [],
            pilotsWithResults
          }
        })
      )

      setCategoriesWithPilots(categoriesFull)
      
      // Definir a primeira categoria como ativa se existir
      if (categoriesFull.length > 0 && !activeTab) {
        setActiveTab(categoriesFull[0].id)
      }
    } catch (error) {
      console.error("Erro ao buscar categorias e pilotos:", error)
      toast.error("Erro ao carregar dados das categorias")
    }
  }

  const handleRaceUpdated = () => {
    if (!raceId) return
    
    try {
      setLoading(true)
      
      const fetchUpdatedRace = async () => {
        const { data, error } = await supabase
          .from("races")
          .select("*")
          .eq("id", raceId)
          .single()

        if (error) throw error
        setRace(data)
      }
      
      fetchUpdatedRace()
    } catch (error) {
      console.error("Erro ao atualizar dados da etapa:", error)
      toast.error("Erro ao atualizar dados")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (pilotId: string, field: string, value: string | boolean) => {
    setTempResults(prev => ({
      ...prev,
      [pilotId]: {
        ...prev[pilotId],
        [field]: value
      }
    }))
    setResultsChanged(true)
  }

  const saveResults = async (categoryId: string) => {
    if (!raceId) return
    
    setSavingResults(true)
    
    try {
      const category = categoriesWithPilots.find(c => c.id === categoryId)
      if (!category) return
      
      // Para cada piloto na categoria
      for (const pilot of category.pilotsWithResults) {
        const tempResult = tempResults[pilot.id]
        if (!tempResult) continue
        
        // Verificar se existem dados significativos para salvar
        const hasData = tempResult.position || 
                         tempResult.qualification_position || 
                         tempResult.fastest_lap || 
                         tempResult.dnf || 
                         tempResult.dq || 
                         tempResult.notes
        
        // Dados a serem salvos/atualizados
        const resultData = {
          race_id: raceId,
          pilot_id: pilot.id,
          category_id: categoryId,
          position: tempResult.position ? parseInt(tempResult.position) : null,
          qualification_position: tempResult.qualification_position ? parseInt(tempResult.qualification_position) : null,
          fastest_lap: tempResult.fastest_lap || false,
          dnf: tempResult.dnf || false,
          dq: tempResult.dq || false,
          notes: tempResult.notes || null
        }
        
        if (pilot.result) {
          // Atualizar resultado existente
          if (hasData) {
            await supabase
              .from("race_results")
              .update(resultData)
              .eq("id", pilot.result.id)
          } else {
            // Se não tem dados significativos, excluir o resultado
            await supabase
              .from("race_results")
              .delete()
              .eq("id", pilot.result.id)
          }
        } else if (hasData) {
          // Criar novo resultado apenas se houver dados
          await supabase
            .from("race_results")
            .insert([resultData])
        }
      }
      
      // Recarregar os dados
      await fetchCategoriesWithPilotsAndResults()
      toast.success("Resultados salvos com sucesso")
      setResultsChanged(false)
    } catch (error) {
      console.error("Erro ao salvar resultados:", error)
      toast.error("Erro ao salvar resultados")
    } finally {
      setSavingResults(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!race || !championship || !league) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Etapa não encontrada</h1>
        <Button onClick={() => router.push(`/league/${leagueId}/championships/${championshipId}`)}>
          Voltar para o Campeonato
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
              <div>
                <h1 className="text-2xl font-bold">{race.name}</h1>
                <div className="flex items-center text-sm text-muted-foreground">
                  <span>{championship.name}</span>
                  <span className="mx-2">•</span>
                  <span>
                    {race.status === 'scheduled' && 'Agendada'}
                    {race.status === 'completed' && 'Concluída'}
                    {race.status === 'cancelled' && 'Cancelada'}
                  </span>
                </div>
              </div>
            </div>
            {isOwner && (
              <div className="flex gap-2">
                <EditRaceModal
                  race={race}
                  onSuccess={handleRaceUpdated}
                />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Detalhes da Etapa</CardTitle>
            <CardDescription>Informações sobre a corrida</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {race.description && (
              <div>
                <p className="text-sm text-muted-foreground">{race.description}</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {race.date && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {new Date(race.date).toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              )}
              {race.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{race.location}</span>
                </div>
              )}
              {race.track_layout && (
                <div className="flex items-center gap-2">
                  <Route className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{race.track_layout}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <h2 className="text-xl font-semibold">Resultados</h2>
        
        {categoriesWithPilots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-muted/50 p-4 rounded-full mb-4">
              <AlertCircle className="h-8 w-8 text-muted-foreground/70" />
            </div>
            <h3 className="text-lg font-medium mb-2">Nenhuma categoria encontrada</h3>
            <p className="text-muted-foreground text-sm max-w-md mb-6">
              Adicione categorias e pilotos ao campeonato para poder registrar resultados.
            </p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid" style={{ gridTemplateColumns: `repeat(${categoriesWithPilots.length}, minmax(0, 1fr))` }}>
              {categoriesWithPilots.map(category => (
                <TabsTrigger key={category.id} value={category.id}>
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {categoriesWithPilots.map(category => (
              <TabsContent key={category.id} value={category.id} className="space-y-4">
                {category.pilotsWithResults.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="bg-muted/50 p-4 rounded-full mb-4">
                      <Flag className="h-8 w-8 text-muted-foreground/70" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Nenhum piloto inscrito nesta categoria</h3>
                    <p className="text-muted-foreground text-sm max-w-md">
                      Adicione pilotos à categoria para poder registrar resultados.
                    </p>
                  </div>
                ) : (
                  <>
                    <Card>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-16">Pos.</TableHead>
                            <TableHead>Piloto</TableHead>
                            <TableHead className="w-16">Qual.</TableHead>
                            <TableHead className="w-28">Melhor Volta</TableHead>
                            <TableHead className="w-20">DNF</TableHead>
                            <TableHead className="w-20">DQ</TableHead>
                            <TableHead>Observações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {category.pilotsWithResults.map((pilot) => (
                            <TableRow key={pilot.id}>
                              <TableCell>
                                {isOwner ? (
                                  <Input
                                    type="number"
                                    min="1"
                                    value={tempResults[pilot.id]?.position || ""}
                                    onChange={(e) => handleInputChange(pilot.id, "position", e.target.value)}
                                    className="w-16"
                                    placeholder="-"
                                  />
                                ) : (
                                  <span className="font-medium">{pilot.result?.position || '-'}</span>
                                )}
                              </TableCell>
                              <TableCell className="font-medium">{pilot.name}</TableCell>
                              <TableCell>
                                {isOwner ? (
                                  <Input
                                    type="number"
                                    min="1"
                                    value={tempResults[pilot.id]?.qualification_position || ""}
                                    onChange={(e) => handleInputChange(pilot.id, "qualification_position", e.target.value)}
                                    className="w-16"
                                    placeholder="-"
                                  />
                                ) : (
                                  <span>{pilot.result?.qualification_position || '-'}</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {isOwner ? (
                                  <div className="flex items-center">
                                    <Checkbox
                                      id={`fastest-lap-${pilot.id}`}
                                      checked={tempResults[pilot.id]?.fastest_lap || false}
                                      onCheckedChange={(checked) => 
                                        handleInputChange(pilot.id, "fastest_lap", checked === true)
                                      }
                                    />
                                    <Label htmlFor={`fastest-lap-${pilot.id}`} className="ml-2 text-sm">
                                      Volta mais rápida
                                    </Label>
                                  </div>
                                ) : (
                                  pilot.result?.fastest_lap ? (
                                    <span title="Volta mais rápida" className="flex items-center">
                                      <Clock className="h-4 w-4 text-yellow-500 mr-1" />
                                      Sim
                                    </span>
                                  ) : "Não"
                                )}
                              </TableCell>
                              <TableCell>
                                {isOwner ? (
                                  <div className="flex items-center">
                                    <Checkbox
                                      id={`dnf-${pilot.id}`}
                                      checked={tempResults[pilot.id]?.dnf || false}
                                      onCheckedChange={(checked) => 
                                        handleInputChange(pilot.id, "dnf", checked === true)
                                      }
                                    />
                                    <Label htmlFor={`dnf-${pilot.id}`} className="ml-2 text-sm">
                                      Não completou
                                    </Label>
                                  </div>
                                ) : (
                                  pilot.result?.dnf ? (
                                    <span title="Não completou" className="flex items-center">
                                      <XIcon className="h-4 w-4 text-orange-500 mr-1" />
                                      Sim
                                    </span>
                                  ) : "Não"
                                )}
                              </TableCell>
                              <TableCell>
                                {isOwner ? (
                                  <div className="flex items-center">
                                    <Checkbox
                                      id={`dq-${pilot.id}`}
                                      checked={tempResults[pilot.id]?.dq || false}
                                      onCheckedChange={(checked) => 
                                        handleInputChange(pilot.id, "dq", checked === true)
                                      }
                                    />
                                    <Label htmlFor={`dq-${pilot.id}`} className="ml-2 text-sm">
                                      Desclassificado
                                    </Label>
                                  </div>
                                ) : (
                                  pilot.result?.dq ? (
                                    <span title="Desclassificado" className="flex items-center">
                                      <Ban className="h-4 w-4 text-red-500 mr-1" />
                                      Sim
                                    </span>
                                  ) : "Não"
                                )}
                              </TableCell>
                              <TableCell>
                                {isOwner ? (
                                  <Textarea
                                    value={tempResults[pilot.id]?.notes || ""}
                                    onChange={(e) => handleInputChange(pilot.id, "notes", e.target.value)}
                                    className="min-h-[40px] h-[40px]"
                                    placeholder="Observações..."
                                  />
                                ) : (
                                  <span className="text-sm">{pilot.result?.notes || '-'}</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Card>
                    
                    {isOwner && resultsChanged && (
                      <div className="flex justify-end mt-4">
                        <Button 
                          onClick={() => saveResults(category.id)}
                          disabled={savingResults}
                          className="gap-2"
                        >
                          {savingResults ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Salvando...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4" />
                              Salvar Resultados
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </main>
    </div>
  )
} 