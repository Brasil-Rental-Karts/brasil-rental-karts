"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar as CalendarIcon, MapPin, ChevronLeft, ChevronRight } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface Race {
  id: string
  championship_id: string
  championship_name: string
  name: string
  description: string | null
  date: string | null
  location: string | null
  status: "scheduled" | "completed" | "cancelled"
}

interface LeagueCalendarProps {
  leagueId: string
}

interface RaceWithChampionship {
  id: string
  championship_id: string
  name: string
  description: string | null
  date: string | null
  location: string | null
  status: "scheduled" | "completed" | "cancelled"
  championships: {
    name: string
  }
}

const RACES_PER_PAGE = 3

export function LeagueCalendar({ leagueId }: LeagueCalendarProps) {
  const [races, setRaces] = useState<Race[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchRaces = async () => {
      try {
        const { data, error } = await supabase
          .from("races")
          .select(`
            id,
            championship_id,
            name,
            description,
            date,
            location,
            status,
            championships (
              name
            )
          `)
          .eq("championships.league_id", leagueId)
          .order("date", { ascending: true })

        if (error) throw error

        const racesWithChampionshipName = data?.map(race => {
          const championshipName = race.championships && typeof race.championships === 'object' 
            ? Array.isArray(race.championships) && race.championships.length > 0 
              ? race.championships[0].name 
              : (race.championships as any).name 
            : "Sem nome";
          
          return {
            id: race.id,
            championship_id: race.championship_id,
            name: race.name,
            description: race.description,
            date: race.date,
            location: race.location,
            status: race.status,
            championship_name: championshipName
          } as Race;
        }) || [];

        setRaces(racesWithChampionshipName)
      } catch (error) {
        console.error("Erro ao buscar corridas:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRaces()
  }, [leagueId, supabase])

  const totalPages = Math.ceil(races.length / RACES_PER_PAGE)
  const startIndex = (currentPage - 1) * RACES_PER_PAGE
  const endIndex = startIndex + RACES_PER_PAGE
  const currentRaces = races.slice(startIndex, endIndex)

  if (loading) {
    return (
      <Card className="border border-border/40 shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Calendário de Provas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-muted-foreground">Carregando...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (races.length === 0) {
    return (
      <Card className="border border-border/40 shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Calendário de Provas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CalendarIcon className="h-8 w-8 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Nenhuma prova agendada</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-border/40 shadow-none">
      <CardHeader>
        <CardTitle className="text-base">Calendário de Provas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {currentRaces.map((race) => (
            <Link 
              key={race.id}
              href={`/league/${leagueId}/championships/${race.championship_id}/races/${race.id}`}
              className="block"
            >
              <div className="flex items-center gap-4 p-3 rounded-lg border border-border/40 hover:border-primary/20 hover:bg-muted/50 transition-colors">
                <div className="flex-shrink-0">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                    ${race.status === "completed" ? "bg-green-100 text-green-700" :
                      race.status === "cancelled" ? "bg-red-100 text-red-700" :
                      "bg-blue-100 text-blue-700"}`}>
                    {race.status === "completed" ? "Concluída" :
                     race.status === "cancelled" ? "Cancelada" :
                     "Agendada"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">{race.name}</h3>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {race.championship_name}
                    </span>
                  </div>
                  {race.date && (
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(race.date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  )}
                </div>
                {race.location && (
                  <div className="flex-shrink-0 text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {race.location}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Próxima
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 