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
} from "lucide-react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { BackButton } from "@/components/back-button"
import { EditRaceModal } from "@/components/edit-race-modal"
import { AddRaceResultModal } from "@/components/add-race-result-modal"
import { EditRaceResultModal } from "@/components/edit-race-result-modal"

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
  league_id: string
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
  pilot: {
    id: string
    name: string
  }
  category: {
    id: string
    name: string
  }
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
  const [leagueId, setLeagueId] = useState<string>("")
  const [championshipId, setChampionshipId] = useState<string>("")
  const [raceId, setRaceId] = useState<string>("")
  const [race, setRace] = useState<Race | null>(null)
  const [championship, setChampionship] = useState<Championship | null>(null)
  const [league, setLeague] = useState<League | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [results, setResults] = useState<RaceResult[]>([])
  const supabase = createClientComponentClient()

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

        // Buscar resultados da etapa
        await fetchResults()
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

  const fetchResults = async () => {
    if (!raceId) return

    try {
      const { data, error } = await supabase
        .from("race_results")
        .select(`
          *,
          pilot:pilot_id (id, name),
          category:category_id (id, name)
        `)
        .eq("race_id", raceId)
        .order("position", { ascending: true, nullsLast: true })

      if (error) throw error
      
      setResults(data || [])
    } catch (error) {
      console.error("Erro ao buscar resultados:", error)
      toast.error("Erro ao carregar resultados")
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

  const handleResultAdded = () => {
    fetchResults()
  }

  const handleResultUpdated = () => {
    fetchResults()
  }

  const handleDeleteResult = async (resultId: string) => {
    if (!confirm("Tem certeza que deseja excluir este resultado? Esta ação não pode ser desfeita.")) {
      return
    }

    try {
      const { error } = await supabase
        .from("race_results")
        .delete()
        .eq("id", resultId)

      if (error) throw error

      toast.success("Resultado excluído com sucesso")
      fetchResults()
    } catch (error) {
      console.error("Erro ao excluir resultado:", error)
      toast.error("Erro ao excluir resultado")
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
              <BackButton 
                href={`/league/${leagueId}/championships/${championshipId}`} 
                label="Voltar para o Campeonato" 
              />
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

        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Resultados</h2>
          {isOwner && (
            <AddRaceResultModal 
              raceId={raceId} 
              championshipId={championshipId}
              onSuccess={handleResultAdded} 
            />
          )}
        </div>

        {results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-muted/50 p-4 rounded-full mb-4">
              <Flag className="h-8 w-8 text-muted-foreground/70" />
            </div>
            <h3 className="text-lg font-medium mb-2">Nenhum resultado registrado</h3>
            <p className="text-muted-foreground text-sm max-w-md mb-6">
              Adicione os resultados dos pilotos nesta etapa.
            </p>
            {isOwner && (
              <AddRaceResultModal 
                raceId={raceId} 
                championshipId={championshipId}
                onSuccess={handleResultAdded} 
              />
            )}
          </div>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Pos.</TableHead>
                  <TableHead>Piloto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="w-16">Qual.</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell className="font-medium">
                      {result.position || '-'}
                    </TableCell>
                    <TableCell>{result.pilot.name}</TableCell>
                    <TableCell>{result.category.name}</TableCell>
                    <TableCell>{result.qualification_position || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {result.fastest_lap && (
                          <Clock className="h-4 w-4 text-yellow-500" title="Volta mais rápida" />
                        )}
                        {result.dnf && (
                          <XIcon className="h-4 w-4 text-orange-500" title="Não completou (DNF)" />
                        )}
                        {result.dq && (
                          <Ban className="h-4 w-4 text-red-500" title="Desclassificado (DQ)" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {isOwner && (
                        <div className="flex justify-end gap-2">
                          <EditRaceResultModal
                            result={result}
                            onSuccess={handleResultUpdated}
                          />
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDeleteResult(result.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </main>
    </div>
  )
} 