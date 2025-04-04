"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Trophy, Calendar, Clock, MapPin, ArrowLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LeagueStandings } from "@/components/league-standings";

interface League {
  id: string;
  name: string;
  description: string;
  logo_url: string | null;
  owner_id: string;
  created_at: string;
}

interface Championship {
  id: string;
  name: string;
  description: string;
  league_id: string;
  start_date: string | null;
  end_date: string | null;
  status: 'upcoming' | 'active' | 'completed';
  logo_url: string | null;
  scoring_system_id: string;
  created_at: string;
}

interface Race {
  id: string;
  championship_id: string;
  name: string;
  description: string | null;
  date: string | null;
  location: string | null;
  track_layout: string | null;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at: string;
}

// Definindo a interface dos parâmetros
type PageParams = {
  id: string;
};

export default function LeagueDetailPage({ params }: { params: Promise<PageParams> }) {
  const router = useRouter();
  const [league, setLeague] = useState<League | null>(null);
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();
  // Usar React.use para acessar o parâmetro
  const { id } = use(params);

  useEffect(() => {
    async function fetchData() {
      try {
        // Buscar dados da liga
        const { data: leagueData, error: leagueError } = await supabase
          .from("leagues")
          .select("*")
          .eq("id", id)
          .single();

        if (leagueError) {
          console.error("Erro ao buscar liga:", leagueError);
          return;
        }

        setLeague(leagueData);

        // Buscar campeonatos
        const { data: championshipsData, error: championshipsError } = await supabase
          .from("championships")
          .select("*")
          .eq("league_id", id)
          .order("created_at", { ascending: false });

        if (championshipsError) {
          console.error("Erro ao buscar campeonatos:", championshipsError);
          return;
        }

        setChampionships(championshipsData || []);

        // Buscar todas as etapas de todos os campeonatos da liga
        if (championshipsData && championshipsData.length > 0) {
          const championshipIds = championshipsData.map(champ => champ.id);
          
          const { data: racesData, error: racesError } = await supabase
            .from("races")
            .select("*")
            .in("championship_id", championshipIds)
            .order("date", { ascending: true });

          if (racesError) {
            console.error("Erro ao buscar etapas:", racesError);
            return;
          }

          setRaces(racesData || []);
        }
      } catch (error) {
        console.error("Erro:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id, supabase]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Data não definida";
    return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 hover:bg-green-600">Ativo</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Agendada</Badge>;
      case 'completed':
        return <Badge variant="secondary">Concluído</Badge>;
      case 'upcoming':
        return <Badge variant="outline">Em breve</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return null;
    }
  };

  const getRacesByChampionship = (championshipId: string) => {
    return races.filter(race => race.championship_id === championshipId);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!league) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Liga não encontrada</h1>
        <Button onClick={() => router.push("/leagues")}>
          Voltar para lista de ligas
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header com informações da liga */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => router.push("/leagues")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={league.logo_url || undefined} alt={league.name} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {league.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{league.name}</h1>
              <p className="text-muted-foreground">{championships.length} campeonatos</p>
            </div>
          </div>
        </div>

        {league.description && (
          <div className="mb-6">
            <p className="text-muted-foreground">{league.description}</p>
          </div>
        )}
      </div>

      <Tabs defaultValue="championships" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="championships">Campeonatos</TabsTrigger>
          <TabsTrigger value="races">Próximas Etapas</TabsTrigger>
          <TabsTrigger value="standings">Classificação</TabsTrigger>
        </TabsList>

        <TabsContent value="championships">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Campeonatos da Liga</h2>
            
            {championships.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {championships.map((championship) => (
                  <Card key={championship.id} className="overflow-hidden border-2 hover:border-primary">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>{championship.name}</CardTitle>
                        <CardDescription>
                          {championship.start_date && championship.end_date 
                            ? `${formatDate(championship.start_date)} - ${formatDate(championship.end_date)}`
                            : "Datas não definidas"
                          }
                        </CardDescription>
                      </div>
                      {getStatusBadge(championship.status)}
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {championship.description || "Sem descrição disponível"}
                      </p>
                      
                      <div className="space-y-3">
                        <div className="text-sm font-medium">Etapas:</div>
                        {getRacesByChampionship(championship.id).length > 0 ? (
                          <div className="space-y-2">
                            {getRacesByChampionship(championship.id).slice(0, 3).map((race) => (
                              <div key={race.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{race.name}</span>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {race.date ? formatDate(race.date) : "Data não definida"}
                                </div>
                              </div>
                            ))}
                            
                            {getRacesByChampionship(championship.id).length > 3 && (
                              <Button variant="ghost" className="w-full text-sm" asChild>
                                <Link href={`/leagues/${league.id}/championships/${championship.id}`}>
                                  Ver todas as {getRacesByChampionship(championship.id).length} etapas
                                  <ChevronRight className="h-4 w-4 ml-1" />
                                </Link>
                              </Button>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground p-2 bg-muted/50 rounded-md">
                            Nenhuma etapa cadastrada
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 border-2 border-dashed rounded-lg">
                <Trophy className="h-10 w-10 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-medium mb-1">Nenhum campeonato encontrado</h3>
                <p className="text-muted-foreground">Esta liga ainda não possui campeonatos cadastrados.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="races">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Próximas Etapas</h2>
            
            {races.length > 0 ? (
              <div className="space-y-4">
                {races
                  .filter(race => race.status !== 'cancelled')
                  .sort((a, b) => {
                    if (!a.date) return 1;
                    if (!b.date) return -1;
                    return new Date(a.date).getTime() - new Date(b.date).getTime();
                  })
                  .map((race) => {
                    // Encontrar o campeonato correspondente
                    const championship = championships.find(c => c.id === race.championship_id);
                    
                    return (
                      <Card key={race.id} className="overflow-hidden hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                {getStatusBadge(race.status)}
                                <span className="text-xs text-muted-foreground">
                                  {championship?.name || "Campeonato desconhecido"}
                                </span>
                              </div>
                              <h3 className="text-lg font-medium">{race.name}</h3>
                              {race.description && (
                                <p className="text-sm text-muted-foreground">{race.description}</p>
                              )}
                            </div>
                            
                            <div className="flex flex-col gap-2 md:items-end">
                              {race.date && (
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{formatDate(race.date)}</span>
                                </div>
                              )}
                              
                              {race.location && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{race.location}</span>
                                </div>
                              )}
                              
                              {race.track_layout && (
                                <div className="text-xs text-muted-foreground">
                                  Traçado: {race.track_layout}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center p-8 border-2 border-dashed rounded-lg">
                <Calendar className="h-10 w-10 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-medium mb-1">Nenhuma etapa encontrada</h3>
                <p className="text-muted-foreground">Esta liga ainda não possui etapas cadastradas.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="standings">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Classificação dos Campeonatos</h2>
            <LeagueStandings leagueId={id} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 