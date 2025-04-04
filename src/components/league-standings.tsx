"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Loader2, Trophy } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Championship {
  id: string;
  name: string;
  league_id: string;
  scoring_system_id: string;
  status: string;
}

interface Category {
  id: string;
  name: string;
  championship_id: string;
}

interface PilotStanding {
  pilot_id: string;
  pilot_name: string;
  pilot_avatar: string | null;
  total_points: number;
  positions: Record<string, number | null>;
  fastest_laps: number;
  dnfs: number;
  dqs: number;
  position?: number;
}

interface ScoringSystem {
  points: Record<string, number>;
}

interface LeagueStandingsProps {
  leagueId: string;
}

export function LeagueStandings({ leagueId }: LeagueStandingsProps) {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [selectedChampionship, setSelectedChampionship] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [pilotStandings, setPilotStandings] = useState<Record<string, PilotStanding[]>>({});
  const [scoringSystem, setScoringSystem] = useState<ScoringSystem | null>(null);

  useEffect(() => {
    const fetchChampionships = async () => {
      try {
        const { data, error } = await supabase
          .from("championships")
          .select("id, name, league_id, status, scoring_system_id")
          .eq("league_id", leagueId)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Erro ao buscar campeonatos:", error);
          return;
        }

        if (data && data.length > 0) {
          setChampionships(data);
          // Selecionar o primeiro campeonato por padrão
          setSelectedChampionship(data[0].id);
        }
      } catch (error) {
        console.error("Erro:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChampionships();
  }, [leagueId, supabase]);

  useEffect(() => {
    if (!selectedChampionship) return;

    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from("categories")
          .select("id, name, championship_id")
          .eq("championship_id", selectedChampionship)
          .order("name");

        if (error) {
          console.error("Erro ao buscar categorias:", error);
          return;
        }

        if (data && data.length > 0) {
          setCategories(data);
          // Selecionar a primeira categoria por padrão
          setSelectedCategory(data[0].id);
        } else {
          setCategories([]);
          setSelectedCategory(null);
        }
      } catch (error) {
        console.error("Erro:", error);
      }
    };

    fetchCategories();
  }, [selectedChampionship, supabase]);

  useEffect(() => {
    if (!selectedChampionship) return;

    const fetchScoringSystem = async () => {
      try {
        const championship = championships.find(c => c.id === selectedChampionship);
        if (!championship || !championship.scoring_system_id) return;

        const { data, error } = await supabase
          .from("scoring_systems")
          .select("points")
          .eq("id", championship.scoring_system_id)
          .single();

        if (error) {
          console.error("Erro ao buscar sistema de pontuação:", error);
          return;
        }

        setScoringSystem(data as ScoringSystem);
      } catch (error) {
        console.error("Erro:", error);
      }
    };

    fetchScoringSystem();
  }, [selectedChampionship, championships, supabase]);

  useEffect(() => {
    if (!selectedCategory || !selectedChampionship || !scoringSystem) return;

    const fetchStandings = async () => {
      try {
        setLoading(true);
        
        // 1. Obter os pilotos da categoria
        const { data: pilotsData, error: pilotsError } = await supabase
          .from("category_pilots")
          .select(`
            pilot_id,
            pilot_profiles (
              id,
              name,
              avatar_url
            )
          `)
          .eq("category_id", selectedCategory);
        
        if (pilotsError) {
          console.error("Erro ao buscar pilotos da categoria:", pilotsError);
          return;
        }
        
        if (!pilotsData || pilotsData.length === 0) {
          setPilotStandings({ [selectedCategory]: [] });
          return;
        }
        
        // 2. Criar estrutura inicial de classificação
        const standings: PilotStanding[] = pilotsData.map(entry => ({
          pilot_id: entry.pilot_id,
          pilot_name: (entry.pilot_profiles as any).name,
          pilot_avatar: (entry.pilot_profiles as any).avatar_url,
          total_points: 0,
          positions: {},
          fastest_laps: 0,
          dnfs: 0,
          dqs: 0
        }));
        
        // 3. Obter todas as corridas do campeonato
        const { data: racesData, error: racesError } = await supabase
          .from("races")
          .select("id")
          .eq("championship_id", selectedChampionship);
        
        if (racesError) {
          console.error("Erro ao buscar corridas:", racesError);
          return;
        }
        
        if (!racesData || racesData.length === 0) {
          setPilotStandings({ [selectedCategory]: standings });
          return;
        }
        
        // 4. Para cada corrida, buscar os resultados dos pilotos
        for (const race of racesData) {
          // Buscar resultados da corrida para a categoria
          const { data: resultsData, error: resultsError } = await supabase
            .from("race_results")
            .select("*")
            .eq("race_id", race.id)
            .eq("category_id", selectedCategory);
          
          if (resultsError) {
            console.error("Erro ao buscar resultados:", resultsError);
            continue;
          }
          
          if (!resultsData || resultsData.length === 0) continue;
          
          // 5. Agrupar resultados por bateria (heat_number)
          const heatResults: Record<string, any[]> = {};
          
          for (const result of resultsData) {
            const heatNumber = result.heat_number.toString();
            if (!heatResults[heatNumber]) {
              heatResults[heatNumber] = [];
            }
            heatResults[heatNumber].push(result);
          }
          
          // 6. Para cada bateria, atualizar os pontos e estatísticas de cada piloto
          for (const [heatNumber, heatResultsData] of Object.entries(heatResults)) {
            for (const result of heatResultsData) {
              const pilotIndex = standings.findIndex(
                p => p.pilot_id === result.pilot_id
              );
              
              if (pilotIndex === -1) continue;
              
              // Definir chave única para posição (combina ID da corrida e número da bateria)
              const positionKey = `${race.id}_${heatNumber}`;
              
              // Atualizar a posição do piloto nesta corrida/bateria
              standings[pilotIndex].positions[positionKey] = result.position;
              
              // Atualizar estatísticas
              if (result.fastest_lap) {
                standings[pilotIndex].fastest_laps += 1;
              }
              
              if (result.dnf) {
                standings[pilotIndex].dnfs += 1;
              }
              
              if (result.dq) {
                standings[pilotIndex].dqs += 1;
              }
              
              // Calcular pontos se tiver posição e não estiver desqualificado
              if (result.position !== null && !result.dq) {
                const positionStr = result.position.toString();
                const points = scoringSystem.points[positionStr] || 0;
                standings[pilotIndex].total_points += points;
              }
            }
          }
        }
        
        // 7. Ordenar os pilotos por pontuação
        standings.sort((a, b) => b.total_points - a.total_points);
        
        // 8. Atribuir a posição atual
        standings.forEach((pilot, index) => {
          pilot.position = index + 1;
        });
        
        // Atualizar o estado
        setPilotStandings({ [selectedCategory]: standings });
      } catch (error) {
        console.error("Erro ao calcular classificação:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStandings();
  }, [selectedCategory, selectedChampionship, scoringSystem, supabase]);

  if (championships.length === 0 && !loading) {
    return (
      <Card className="border-2 border-dashed">
        <CardContent className="p-6 text-center">
          <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-medium mb-1">Nenhum campeonato encontrado</h3>
          <p className="text-muted-foreground text-sm">Esta liga ainda não possui campeonatos cadastrados.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Classificação</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && championships.length === 0 ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Seleção de Campeonato */}
            <div className="space-y-4">
              <div className="mb-4">
                <Tabs 
                  value={selectedChampionship || ""} 
                  onValueChange={setSelectedChampionship}
                  className="w-full"
                >
                  <TabsList className="w-full mb-4 flex overflow-x-auto">
                    {championships.map((championship) => (
                      <TabsTrigger 
                        key={championship.id} 
                        value={championship.id}
                        className="flex-shrink-0"
                      >
                        {championship.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
              
              {/* Seleção de Categoria */}
              {categories.length > 0 && (
                <div className="mb-4">
                  <Tabs 
                    value={selectedCategory || ""} 
                    onValueChange={setSelectedCategory}
                    className="w-full"
                  >
                    <TabsList className="mb-4">
                      {categories.map((category) => (
                        <TabsTrigger key={category.id} value={category.id}>
                          {category.name}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>
              )}
              
              {/* Tabela de Classificação */}
              {selectedCategory && pilotStandings[selectedCategory] ? (
                loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : pilotStandings[selectedCategory].length > 0 ? (
                  <div className="rounded-md border overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full divide-y">
                        <thead className="bg-muted">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-16">
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
                          {pilotStandings[selectedCategory].map((pilot) => (
                            <tr key={pilot.pilot_id} className="hover:bg-muted/40 transition-colors">
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                {pilot.position}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center">
                                  <Avatar className="h-7 w-7 mr-3">
                                    <AvatarImage src={pilot.pilot_avatar || undefined} />
                                    <AvatarFallback className="text-xs">
                                      {pilot.pilot_name ? pilot.pilot_name.charAt(0) : "?"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="text-sm">{pilot.pilot_name}</div>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-center">
                                <span className="text-sm font-semibold">
                                  {pilot.total_points}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-center hidden md:table-cell">
                                <Badge variant="outline" className="text-purple-600 border-purple-600/20 bg-purple-50">
                                  {pilot.fastest_laps}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-center hidden md:table-cell">
                                <Badge variant="outline" className="text-amber-600 border-amber-600/20 bg-amber-50">
                                  {pilot.dnfs + pilot.dqs}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">Nenhum resultado encontrado nesta categoria</p>
                  </div>
                )
              ) : (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground">Selecione um campeonato e uma categoria para ver a classificação</p>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 