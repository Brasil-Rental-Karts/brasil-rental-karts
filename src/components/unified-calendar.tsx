"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar as CalendarIcon, MapPin, ChevronLeft, ChevronRight } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface Race {
  id: string
  championship_id: string
  championship_name: string
  league_id: string
  league_name: string
  name: string
  description: string | null
  date: string | null
  location: string | null
  status: "scheduled" | "completed" | "cancelled"
}

interface UnifiedCalendarProps {
  leagueId?: string
  pilotId?: string
  title?: string
  showAllStatuses?: boolean
  racesPerPage?: number
}

export function UnifiedCalendar({ 
  leagueId, 
  pilotId, 
  title = "Calendário de Provas", 
  showAllStatuses = false,
  racesPerPage = 3 
}: UnifiedCalendarProps) {
  const [races, setRaces] = useState<Race[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchRaces = async () => {
      try {
        if (pilotId) {
          // Lógica para buscar corridas do piloto
          const { data: categoriesData, error: categoriesError } = await supabase
            .from("category_pilots")
            .select("category_id, categories(championship_id)")
            .eq("pilot_id", pilotId);
          
          if (categoriesError) throw categoriesError;
          
          if (!categoriesData || categoriesData.length === 0) {
            setRaces([]);
            setLoading(false);
            return;
          }
          
          // Extrair IDs de campeonatos das categorias do piloto
          const championshipIds = categoriesData
            .filter(item => item.categories && typeof item.categories === 'object')
            .map(item => {
              const categoriesObj = item.categories as any;
              return categoriesObj?.championship_id;
            })
            .filter(Boolean);
          
          if (championshipIds.length === 0) {
            setRaces([]);
            setLoading(false);
            return;
          }
          
          // Buscar corridas dos campeonatos do piloto
          let query = supabase
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
                name,
                league_id,
                leagues (
                  name
                )
              )
            `)
            .in("championship_id", championshipIds)
            .order("date", { ascending: true });
          
          // Filtrar por status agendado se não mostrar todos os status
          if (!showAllStatuses) {
            query = query.eq("status", "scheduled");
          }
          
          const { data, error } = await query;

          if (error) throw error;

          const racesWithDetails = data?.map(race => {
            const championships = race.championships as any;
            let championshipName = "Sem nome";
            let leagueId = "";
            let leagueName = "Sem nome";
            
            if (championships) {
              if (Array.isArray(championships) && championships.length > 0) {
                championshipName = championships[0].name || "Sem nome";
                leagueId = championships[0].league_id || "";
                const leagues = championships[0].leagues;
                if (leagues) {
                  leagueName = leagues.name || "Sem nome";
                }
              } else {
                championshipName = championships.name || "Sem nome";
                leagueId = championships.league_id || "";
                const leagues = championships.leagues;
                if (leagues) {
                  leagueName = leagues.name || "Sem nome";
                }
              }
            }
            
            return {
              id: race.id,
              championship_id: race.championship_id,
              name: race.name,
              description: race.description,
              date: race.date,
              location: race.location,
              status: race.status,
              championship_name: championshipName,
              league_id: leagueId,
              league_name: leagueName
            } as Race;
          }) || [];

          setRaces(racesWithDetails);
        } 
        else if (leagueId) {
          // Lógica para buscar corridas da liga
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
                name,
                league_id
              )
            `)
            .eq("championships.league_id", leagueId)
            .order("date", { ascending: true });

          if (error) throw error;

          const racesWithDetails = data?.map(race => {
            const championships = race.championships as any;
            let championshipName = "Sem nome";
            let leagueId = "";
            
            if (championships) {
              if (Array.isArray(championships) && championships.length > 0) {
                championshipName = championships[0].name || "Sem nome";
                leagueId = championships[0].league_id || "";
              } else {
                championshipName = championships.name || "Sem nome";
                leagueId = championships.league_id || "";
              }
            }
            
            return {
              id: race.id,
              championship_id: race.championship_id,
              name: race.name,
              description: race.description,
              date: race.date,
              location: race.location,
              status: race.status,
              championship_name: championshipName,
              league_id: leagueId,
              league_name: ""
            } as Race;
          }) || [];

          setRaces(racesWithDetails);
        }
      } catch (error) {
        console.error("Erro ao buscar corridas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRaces();
  }, [leagueId, pilotId, supabase, showAllStatuses]);

  const totalPages = Math.ceil(races.length / racesPerPage)
  const startIndex = (currentPage - 1) * racesPerPage
  const endIndex = startIndex + racesPerPage
  const currentRaces = races.slice(startIndex, endIndex)

  if (loading) {
    return (
      <Card className="border border-border/40 shadow-none">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">{title}</CardTitle>
          <div className="flex items-center gap-1">
            <Skeleton className="h-7 w-20" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg border border-border/40">
                <div className="flex-shrink-0">
                  <Skeleton className="h-12 w-12 rounded-md" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-20 rounded-full" />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <Skeleton className="h-4 w-24 rounded-full" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (races.length === 0) {
    return (
      <Card className="border border-border/40 shadow-none">
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CalendarIcon className="h-8 w-8 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Nenhuma corrida agendada</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-border/40 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground px-1">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {currentRaces.map((race) => (
            <Link 
              key={race.id}
              href={`/league/${race.league_id}/championships/${race.championship_id}/races/${race.id}`}
              className="block"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4 p-3 rounded-lg border border-border/40 hover:border-primary/20 hover:bg-muted/50 transition-colors">
                <div className="flex-shrink-0 mb-2 md:mb-0">
                  {race.date ? (
                    <div className="bg-muted/30 rounded-md p-2 h-12 w-12 flex flex-col items-center justify-center text-center">
                      <span className="text-xs font-semibold">{format(new Date(race.date), "MMM", { locale: ptBR })}</span>
                      <span className="text-lg font-bold leading-none">{format(new Date(race.date), "dd")}</span>
                    </div>
                  ) : (
                    <div className="bg-muted/30 rounded-md p-2 h-12 w-12 flex flex-col items-center justify-center text-center">
                      <span className="text-xs font-medium">Data não<br/>definida</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium truncate max-w-[200px] md:max-w-none">{race.name}</h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                      ${race.status === "completed" ? "bg-green-100 text-green-700" :
                        race.status === "cancelled" ? "bg-red-100 text-red-700" :
                        "bg-blue-100 text-blue-700"}`}>
                      {race.status === "completed" ? "Concluída" :
                       race.status === "cancelled" ? "Cancelada" :
                       "Agendada"}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {race.championship_name}
                    </span>
                    {race.league_name && (
                      <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {race.league_name}
                      </span>
                    )}
                  </div>
                  {race.date && (
                    <p className="text-xs text-muted-foreground mt-1 md:hidden">
                      {format(new Date(race.date), "EEEE, d 'de' MMMM", { locale: ptBR })}
                    </p>
                  )}
                </div>
                {race.location && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2 w-full md:w-auto md:mt-0 md:ml-auto">
                    <MapPin className="h-3 w-3" />
                    <span>{race.location}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t md:hidden">
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
              {currentPage} / {totalPages}
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