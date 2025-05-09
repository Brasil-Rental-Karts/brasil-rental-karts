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
  Info,
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
import { Breadcrumb, BreadcrumbHome, BreadcrumbItem, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"

interface Race {
  id: string
  championship_id: string
  name: string
  description: string | null
  date: string | null
  location: string | null
  track_layout: string | null
  status: "scheduled" | "completed" | "cancelled"
  double_points: boolean
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
  heat_number: number
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
  const [activeHeat, setActiveHeat] = useState<number>(1)
  const [maxHeats, setMaxHeats] = useState<Record<string, number>>({})
  const supabase = createClientComponentClient()

  const [tempResults, setTempResults] = useState<{[key: string]: {
    position: string,
    qualification_position: string,
    fastest_lap: boolean,
    dnf: boolean,
    dq: boolean,
    notes: string,
    heat_number: number
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

        const { data: leagueData, error: leagueError } = await supabase
          .from("leagues")
          .select("*")
          .eq("id", leagueId)
          .single()

        if (leagueError) throw leagueError
        setLeague(leagueData)
        setIsOwner(session.user.id === leagueData.owner_id)

        const { data: championshipData, error: championshipError } = await supabase
          .from("championships")
          .select("*")
          .eq("id", championshipId)
          .single()

        if (championshipError) throw championshipError
        setChampionship(championshipData)

        const { data: raceData, error: raceError } = await supabase
          .from("races")
          .select("*")
          .eq("id", raceId)
          .single()

        if (raceError) throw raceError
        setRace(raceData)

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

      const tempMaxHeats: Record<string, number> = {};
      const newTempResults = { ...tempResults };

      const categoriesFull: CategoryWithPilots[] = await Promise.all(
        categoriesData.map(async (category) => {
          const { data: categoryPilotsData, error: pilotsError } = await supabase
            .from("category_pilots")
            .select(`
              pilot_id,
              pilot_profiles:pilot_id (id, name)
            `)
            .eq("category_id", category.id)
          
          if (pilotsError) throw pilotsError

          const { data: resultsData, error: resultsError } = await supabase
            .from("race_results")
            .select("*")
            .eq("race_id", raceId)
            .eq("category_id", category.id)
          
          if (resultsError) throw resultsError

          console.log(`Resultados existentes para categoria ${category.name}:`, resultsData);

          let maxHeatNumber = 1;
          if (resultsData && resultsData.length > 0) {
            const hasHeatNumber = resultsData.some(r => r.heat_number !== undefined && r.heat_number !== null);
            
            if (hasHeatNumber) {
              const heats = resultsData.map(r => r.heat_number || 1);
              maxHeatNumber = Math.max(...heats);
              console.log(`Número máximo de baterias detectado: ${maxHeatNumber}`);
            } else {
              console.log(`Nenhum heat_number encontrado nos resultados, usando valor padrão 1`);
            }
          }
          tempMaxHeats[category.id] = maxHeatNumber;

          if (resultsData && resultsData.length > 0) {
            resultsData.forEach(result => {
              const heatNum = result.heat_number !== undefined && result.heat_number !== null ? 
                Number(result.heat_number) : 1;
              
              const key = `${result.pilot_id}_${heatNum}`;
              
              newTempResults[key] = {
                position: result.position?.toString() || "",
                qualification_position: result.qualification_position?.toString() || "",
                fastest_lap: result.fastest_lap || false,
                dnf: result.dnf || false,
                dq: result.dq || false,
                notes: result.notes || "",
                heat_number: heatNum
              };
            });
          }
          
          const pilotsWithResults: PilotWithResult[] = (categoryPilotsData || []).map(cp => {
            const pilotProfile = Array.isArray(cp.pilot_profiles) ? cp.pilot_profiles[0] : cp.pilot_profiles;
            const pilot = {
              id: pilotProfile.id,
              name: pilotProfile.name
            }

            const allResults = (resultsData || []).filter(r => r.pilot_id === pilot.id);
            
            const activeHeatNum = Number(activeHeat);
            
            const result = allResults.find(r => {
              const resultHeatNum = r.heat_number !== undefined && r.heat_number !== null ? 
                Number(r.heat_number) : 1;
              return resultHeatNum === activeHeatNum;
            }) || null;
            
            const key = `${pilot.id}_${activeHeatNum}`;
            if (!newTempResults[key]) {
              newTempResults[key] = {
                position: "",
                qualification_position: "",
                fastest_lap: false,
                dnf: false,
                dq: false,
                notes: "",
                heat_number: activeHeatNum
              };
            }

            return {
              ...pilot,
              result
            }
          });

          pilotsWithResults.sort((a, b) => a.name.localeCompare(b.name));

          return {
            id: category.id,
            name: category.name,
            pilots: [],
            pilotsWithResults
          }
        })
      );

      setTempResults(newTempResults);
      setCategoriesWithPilots(categoriesFull);
      setMaxHeats(tempMaxHeats);
      
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
    const key = `${pilotId}_${activeHeat}`;
    
    // Tratamento especial para volta mais rápida
    if (field === "fastest_lap" && value === true) {
      // Se estamos marcando este piloto com volta mais rápida,
      // desmarcar todos os outros pilotos da mesma categoria na mesma bateria
      const newTempResults = { ...tempResults };
      
      // Encontrar a categoria atual
      const currentCategory = categoriesWithPilots.find(c => c.id === activeTab);
      if (currentCategory) {
        // Desmarcar a volta mais rápida de todos os outros pilotos
        currentCategory.pilotsWithResults.forEach(pilot => {
          if (pilot.id !== pilotId) {
            const otherPilotKey = `${pilot.id}_${activeHeat}`;
            if (newTempResults[otherPilotKey]) {
              newTempResults[otherPilotKey] = {
                ...newTempResults[otherPilotKey],
                fastest_lap: false
              };
            }
          }
        });
      }
      
      // Atualizar o piloto atual com a volta mais rápida
      newTempResults[key] = {
        ...newTempResults[key],
        [field]: value
      };
      
      setTempResults(newTempResults);
    } else {
      // Comportamento normal para outros campos
      setTempResults(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          [field]: value
        }
      }));
    }
    
    setResultsChanged(true);
  }

  const addHeat = (categoryId: string) => {
    const newHeatNumber = (maxHeats[categoryId] || 1) + 1;
    console.log(`Adicionando nova bateria ${newHeatNumber} para categoria ${categoryId}`);
    
    setMaxHeats(prev => ({
      ...prev,
      [categoryId]: newHeatNumber
    }));
    
    const category = categoriesWithPilots.find(c => c.id === categoryId);
    if (category) {
      const newTempResults = { ...tempResults };
      
      category.pilotsWithResults.forEach(pilot => {
        const key = `${pilot.id}_${newHeatNumber}`;
        console.log(`Inicializando dados para piloto ${pilot.name} na bateria ${newHeatNumber}, chave: ${key}`);
        
        newTempResults[key] = {
          position: "",
          qualification_position: "",
          fastest_lap: false,
          dnf: false,
          dq: false,
          notes: "",
          heat_number: newHeatNumber
        };
      });
      
      setTempResults(newTempResults);
    }
    
    setActiveHeat(newHeatNumber);
  }

  const switchHeat = (heatNumber: number) => {
    console.log(`Alternando para bateria ${heatNumber}`);
    
    const currentCategoryId = activeTab;
    if (currentCategoryId && resultsChanged) {
      const saveCurrentResults = window.confirm("Você tem alterações não salvas. Deseja salvar antes de trocar de bateria?");
      if (saveCurrentResults) {
        saveResults(currentCategoryId);
      }
      setResultsChanged(false);
    }
    
    setActiveHeat(heatNumber);
    fetchCategoriesWithPilotsAndResults();
  }

  const saveResults = async (categoryId: string) => {
    if (!raceId) return
    
    setSavingResults(true)
    const heatNumber = activeHeat;
    console.log(`Salvando resultados para categoria ${categoryId}, bateria ${heatNumber}`);
    
    try {
      const category = categoriesWithPilots.find(c => c.id === categoryId)
      if (!category) return

      // Primeiro limpar quaisquer resultados existentes para esta bateria
      // Isso evita problemas com restrições de unicidade
      await clearExistingResultsForHeat(categoryId, heatNumber);
      
      // Agora inserir os novos resultados
      for (const pilot of category.pilotsWithResults) {
        const key = `${pilot.id}_${heatNumber}`;
        const tempResult = tempResults[key];
        
        if (!tempResult) {
          console.log(`Sem dados para o piloto ${pilot.name} na bateria ${heatNumber}`);
          continue;
        }
        
        // Verificar se existem dados significativos para salvar
        const hasData = tempResult.position || 
                        tempResult.qualification_position || 
                        tempResult.fastest_lap || 
                        tempResult.dnf || 
                        tempResult.dq || 
                        tempResult.notes;
        
        // Só inserir se tiver dados
        if (hasData) {
          console.log(`Inserindo resultado para ${pilot.name}, bateria ${heatNumber}`);
          
          const resultData = {
            race_id: raceId,
            pilot_id: pilot.id,
            category_id: categoryId,
            position: tempResult.position ? parseInt(tempResult.position) : null,
            qualification_position: tempResult.qualification_position ? parseInt(tempResult.qualification_position) : null,
            fastest_lap: tempResult.fastest_lap || false,
            dnf: tempResult.dnf || false,
            dq: tempResult.dq || false,
            notes: tempResult.notes || null,
            heat_number: heatNumber
          };
          
          const { data: insertData, error: insertError } = await supabase
            .from("race_results")
            .insert([resultData]);
            
          if (insertError) {
            console.error(`Erro ao salvar resultado para ${pilot.name}:`, insertError);
          } else {
            console.log(`Resultado salvo com sucesso para ${pilot.name}`);
          }
        }
      }
      
      // Recarregar os resultados para atualizar a UI
      await reloadResults(categoryId);
      
      toast.success("Resultados salvos com sucesso");
      setResultsChanged(false);
    } catch (error) {
      console.error("Erro ao salvar resultados:", error);
      toast.error("Erro ao salvar resultados");
    } finally {
      setSavingResults(false);
    }
  }

  // Função auxiliar para limpar resultados existentes
  const clearExistingResultsForHeat = async (categoryId: string, heatNumber: number) => {
    console.log(`Limpando resultados existentes para categoria ${categoryId}, bateria ${heatNumber}`);
    
    try {
      // Primeiro buscar os IDs dos resultados existentes
      const { data: existingData, error: existingError } = await supabase
        .from("race_results")
        .select("id")
        .eq("race_id", raceId)
        .eq("category_id", categoryId)
        .eq("heat_number", heatNumber);
        
      if (existingError) {
        console.error("Erro ao buscar resultados existentes:", existingError);
        return;
      }
      
      if (existingData && existingData.length > 0) {
        console.log(`Encontrados ${existingData.length} resultados existentes para excluir`);
        
        for (const row of existingData) {
          const { error: deleteError } = await supabase
            .from("race_results")
            .delete()
            .eq("id", row.id);
            
          if (deleteError) {
            console.error(`Erro ao excluir resultado ${row.id}:`, deleteError);
          }
        }
      } else {
        console.log("Nenhum resultado existente encontrado para limpar");
      }
    } catch (error) {
      console.error("Erro não tratado ao limpar resultados:", error);
    }
  }
  
  // Função para recarregar os resultados após salvar
  const reloadResults = async (categoryId: string) => {
    try {
      // Buscar a categoria atual
      const category = categoriesWithPilots.find(c => c.id === categoryId);
      if (!category) return;
      
      // Criar uma cópia atualizada da categoria
      const updatedCategory = { ...category };
      
      // Buscar os resultados atualizados para cada piloto
      updatedCategory.pilotsWithResults = await Promise.all(
        category.pilotsWithResults.map(async (pilot) => {
          const { data: result, error } = await supabase
            .from("race_results")
            .select("*")
            .eq("race_id", raceId)
            .eq("pilot_id", pilot.id)
            .eq("category_id", categoryId)
            .eq("heat_number", activeHeat)
            .maybeSingle();
            
          if (error) {
            console.error(`Erro ao buscar resultado para ${pilot.name}:`, error);
          }
          
          return {
            ...pilot,
            result: result || null
          };
        })
      );
      
      // Atualizar apenas esta categoria no estado
      setCategoriesWithPilots(prev => 
        prev.map(cat => cat.id === categoryId ? updatedCategory : cat)
      );
    } catch (error) {
      console.error("Erro ao recarregar resultados:", error);
    }
  }

  const removeHeat = async (categoryId: string, heatNumber: number) => {
    if (!raceId) return;
    
    try {
      setLoading(true);
      console.log(`Removendo bateria ${heatNumber} da categoria ${categoryId}`);
      
      // Eliminar os resultados desta bateria
      const { error } = await supabase
        .from("race_results")
        .delete()
        .eq("race_id", raceId)
        .eq("category_id", categoryId)
        .eq("heat_number", heatNumber);
        
      if (error) {
        console.error("Erro ao excluir resultados da bateria:", error);
        toast.error("Erro ao excluir a bateria");
        return;
      }
      
      // Reajustar números de baterias subsequentes
      if (heatNumber < maxHeats[categoryId]) {
        // Buscar todas as baterias posteriores
        const { data: laterHeats, error: fetchError } = await supabase
          .from("race_results")
          .select("id, heat_number")
          .eq("race_id", raceId)
          .eq("category_id", categoryId)
          .gt("heat_number", heatNumber);
          
        if (fetchError) {
          console.error("Erro ao buscar baterias subsequentes:", fetchError);
        } else if (laterHeats && laterHeats.length > 0) {
          console.log(`Reajustando ${laterHeats.length} resultados de baterias subsequentes`);
          
          // Atualizar cada resultado das baterias subsequentes
          for (const heatResult of laterHeats) {
            const { error: updateError } = await supabase
              .from("race_results")
              .update({ heat_number: heatResult.heat_number - 1 })
              .eq("id", heatResult.id);
              
            if (updateError) {
              console.error(`Erro ao ajustar heat_number para resultado ${heatResult.id}:`, updateError);
            }
          }
        }
      }
      
      // Atualizar o estado local
      const newMaxHeats = { ...maxHeats };
      newMaxHeats[categoryId] = Math.max(1, (maxHeats[categoryId] || 1) - 1);
      setMaxHeats(newMaxHeats);
      
      // Se a bateria atual foi removida ou é maior que o máximo, volte para a bateria 1
      if (activeHeat === heatNumber || activeHeat > newMaxHeats[categoryId]) {
        setActiveHeat(1);
      }
      
      // Recarregar os dados
      await fetchCategoriesWithPilotsAndResults();
      
      toast.success("Bateria removida com sucesso");
    } catch (error) {
      console.error("Erro ao remover bateria:", error);
      toast.error("Erro ao excluir a bateria");
    } finally {
      setLoading(false);
    }
  }
  
  const deleteRace = async () => {
    if (!raceId || !championshipId) return;
    
    try {
      setLoading(true);
      console.log(`Removendo etapa ${raceId}`);
      
      // Primeiro excluir todos os resultados associados a esta etapa
      const { error: resultsError } = await supabase
        .from("race_results")
        .delete()
        .eq("race_id", raceId);
        
      if (resultsError) {
        console.error("Erro ao excluir resultados da etapa:", resultsError);
        toast.error("Erro ao excluir resultados da etapa");
        return;
      }
      
      // Agora excluir a etapa em si
      const { error: raceError } = await supabase
        .from("races")
        .delete()
        .eq("id", raceId);
        
      if (raceError) {
        console.error("Erro ao excluir etapa:", raceError);
        toast.error("Erro ao excluir etapa");
        return;
      }
      
      toast.success("Etapa excluída com sucesso");
      // Redirecionar para a página do campeonato
      router.push(`/league/${leagueId}/championships/${championshipId}`);
      
    } catch (error) {
      console.error("Erro ao excluir etapa:", error);
      toast.error("Erro ao excluir etapa");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header Section Skeleton */}
        <header className="bg-white sticky top-0 z-10 border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9" />
                <Skeleton className="h-5 w-32" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          </div>
        </header>

        {/* Breadcrumb Skeleton */}
        <div className="container mx-auto px-4 py-2 border-b border-border/40">
          <div className="flex items-center gap-1">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>

        <main className="container mx-auto px-4 py-6 md:py-8 space-y-8">
          {/* Race Info Skeleton */}
          <section>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-5 w-full max-w-md" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Categories Tabs Skeleton */}
          <section>
            <Skeleton className="h-6 w-40 mb-4" />
            <Skeleton className="h-10 w-full max-w-md mb-6" />
            
            {/* Category Results Skeleton */}
            <div className="space-y-6">
              <Card className="border border-border/40 shadow-none">
                <CardHeader className="border-b">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-8 w-24" />
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-24" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {/* Results Table Skeleton */}
                  <div className="rounded-md overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>
                              <Skeleton className="h-4 w-8" />
                            </TableHead>
                            <TableHead>
                              <Skeleton className="h-4 w-16" />
                            </TableHead>
                            <TableHead>
                              <Skeleton className="h-4 w-24" />
                            </TableHead>
                            <TableHead>
                              <Skeleton className="h-4 w-16" />
                            </TableHead>
                            <TableHead>
                              <Skeleton className="h-4 w-16" />
                            </TableHead>
                            <TableHead>
                              <Skeleton className="h-4 w-16" />
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[1, 2, 3].map((i) => (
                            <TableRow key={i}>
                              <TableCell>
                                <Skeleton className="h-6 w-8" />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Skeleton className="h-8 w-8 rounded-full" />
                                  <Skeleton className="h-6 w-32" />
                                </div>
                              </TableCell>
                              <TableCell>
                                <Skeleton className="h-6 w-8" />
                              </TableCell>
                              <TableCell>
                                <Skeleton className="h-6 w-6" />
                              </TableCell>
                              <TableCell>
                                <Skeleton className="h-6 w-6" />
                              </TableCell>
                              <TableCell>
                                <Skeleton className="h-6 w-6" />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                  
                </CardContent>

              </Card>
            </div>
          </section>
        </main>
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
              <span className="font-medium">Etapa: {race?.name}</span>
            </div>

            <div className="flex items-center gap-2">
              {isOwner && race && (
                <>
                  <EditRaceModal
                    race={race}
                    championship={championship}
                    onSuccess={handleRaceUpdated}
                  />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1 text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                        Excluir
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Etapa</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir esta etapa? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={deleteRace}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-2 border-b border-border/40">
        <Breadcrumb className="text-xs">
          <BreadcrumbHome href="/pilot" />
          <BreadcrumbSeparator />
          <BreadcrumbItem href={`/league/${leagueId}`}>{league?.name || 'Liga'}</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem href={`/league/${leagueId}/championships`}>Campeonatos</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem href={`/league/${leagueId}/championships/${championshipId}`}>{championship?.name || 'Campeonato'}</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem active>{race?.name || 'Etapa'}</BreadcrumbItem>
        </Breadcrumb>
      </div>

      <main className="container mx-auto px-4 py-6 md:py-8 space-y-8">
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
            {race.status === "completed" && (
              <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
                <CheckCircle className="h-4 w-4" />
                Concluída
              </div>
            )}
            {race.status === "cancelled" && (
              <div className="flex items-center gap-1.5 text-red-600 text-sm font-medium">
                <XIcon className="h-4 w-4" />
                Cancelada
              </div>
            )}
            {race.status === "scheduled" && (
              <div className="flex items-center gap-1.5 text-blue-600 text-sm font-medium">
                <Clock className="h-4 w-4" />
                Agendada
              </div>
            )}
            {race.double_points && (
              <div className="flex items-center gap-1.5 text-amber-600 text-sm font-medium mt-2">
                <Medal className="h-4 w-4" />
                Pontuação em dobro
              </div>
            )}
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
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        {Array.from({ length: maxHeats[category.id] || 1 }, (_, i) => i + 1).map((heatNum) => (
                          <Button
                            key={heatNum}
                            variant={activeHeat === heatNum ? "default" : "outline"}
                            onClick={() => switchHeat(heatNum)}
                            className="flex gap-1"
                          >
                            Bateria {heatNum}
                            {isOwner && maxHeats[category.id] > 1 && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                  <XIcon className="h-3.5 w-3.5 text-red-500 cursor-pointer" />
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir Bateria</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir a bateria {heatNum}? Esta ação não pode ser desfeita
                                      e todos os resultados associados a esta bateria serão perdidos.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={(e: React.MouseEvent) => {
                                        e.stopPropagation(); 
                                        removeHeat(category.id, heatNum);
                                      }} 
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </Button>
                        ))}
                      </div>
                      {isOwner && (
                        <Button 
                          variant="outline"
                          onClick={() => addHeat(category.id)}
                        >
                          + Nova Bateria
                        </Button>
                      )}
                    </div>
                    
                    <Card>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-16">Pos.</TableHead>
                            <TableHead>Piloto</TableHead>
                            <TableHead className="w-16">Qual.</TableHead>
                            <TableHead className="w-40">
                              <div className="flex items-center gap-1">
                                Melhor Volta
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Apenas um piloto pode ter a volta mais rápida por bateria</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </TableHead>
                            <TableHead className="w-40">DNF</TableHead>
                            <TableHead className="w-40">DQ</TableHead>
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
                                    value={tempResults[`${pilot.id}_${activeHeat}`]?.position || ""}
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
                                    value={tempResults[`${pilot.id}_${activeHeat}`]?.qualification_position || ""}
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
                                      id={`fastest-lap-${pilot.id}-${activeHeat}`}
                                      checked={tempResults[`${pilot.id}_${activeHeat}`]?.fastest_lap || false}
                                      onCheckedChange={(checked) => 
                                        handleInputChange(pilot.id, "fastest_lap", checked === true)
                                      }
                                    />
                                    <Label htmlFor={`fastest-lap-${pilot.id}-${activeHeat}`} className="ml-2 text-sm">
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
                                      id={`dnf-${pilot.id}-${activeHeat}`}
                                      checked={tempResults[`${pilot.id}_${activeHeat}`]?.dnf || false}
                                      onCheckedChange={(checked) => 
                                        handleInputChange(pilot.id, "dnf", checked === true)
                                      }
                                    />
                                    <Label htmlFor={`dnf-${pilot.id}-${activeHeat}`} className="ml-2 text-sm">
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
                                      id={`dq-${pilot.id}-${activeHeat}`}
                                      checked={tempResults[`${pilot.id}_${activeHeat}`]?.dq || false}
                                      onCheckedChange={(checked) => 
                                        handleInputChange(pilot.id, "dq", checked === true)
                                      }
                                    />
                                    <Label htmlFor={`dq-${pilot.id}-${activeHeat}`} className="ml-2 text-sm">
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
                                    value={tempResults[`${pilot.id}_${activeHeat}`]?.notes || ""}
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