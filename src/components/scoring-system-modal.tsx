"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Edit, Plus, Minus } from "lucide-react"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"

interface ScoringSystem {
  id: string
  name: string
  description: string
  is_default: boolean
  points: Record<string, number>
}

interface Championship {
  id: string
  name: string
  scoring_system_id: string | null
}

interface ScoringSystemModalProps {
  championship: Championship
  onSuccess: () => void
}

export function ScoringSystemModal({ championship, onSuccess }: ScoringSystemModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetchingSystems, setFetchingSystems] = useState(true)
  const [scoringSystems, setScoringSystems] = useState<ScoringSystem[]>([])
  const [selectedSystem, setSelectedSystem] = useState<string>("")
  const [activeTab, setActiveTab] = useState<string>("select")

  // Campos para criar um novo sistema de pontuação
  const [newSystemName, setNewSystemName] = useState<string>("")
  const [newSystemDescription, setNewSystemDescription] = useState<string>("")
  const [newSystemPoints, setNewSystemPoints] = useState<{ position: number; points: number }[]>([
    { position: 1, points: 10 },
    { position: 2, points: 8 },
    { position: 3, points: 6 },
    { position: 4, points: 5 },
    { position: 5, points: 4 },
    { position: 6, points: 3 },
    { position: 7, points: 2 },
    { position: 8, points: 1 },
  ])

  const supabase = createClientComponentClient()

  useEffect(() => {
    if (open) {
      fetchScoringSystems()
    }
  }, [open])

  useEffect(() => {
    if (scoringSystems.length > 0 && championship.scoring_system_id) {
      setSelectedSystem(championship.scoring_system_id)
    }
  }, [scoringSystems, championship])

  const fetchScoringSystems = async () => {
    setFetchingSystems(true)
    try {
      const { data, error } = await supabase
        .from("scoring_systems")
        .select("*")
        .order("is_default", { ascending: false })
        .order("name", { ascending: true })

      if (error) throw error
      
      setScoringSystems(data || [])
      
      // Se o campeonato já tem um sistema de pontuação, selecione-o
      if (championship.scoring_system_id) {
        setSelectedSystem(championship.scoring_system_id)
      } else if (data && data.length > 0) {
        // Caso contrário, selecionamos o primeiro sistema da lista
        setSelectedSystem(data[0].id)
      }
    } catch (error) {
      console.error("Erro ao buscar sistemas de pontuação:", error)
      toast.error("Erro ao carregar sistemas de pontuação")
    } finally {
      setFetchingSystems(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSystem) {
      toast.error("Selecione um sistema de pontuação")
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from("championships")
        .update({
          scoring_system_id: selectedSystem,
          updated_at: new Date().toISOString()
        })
        .eq("id", championship.id)

      if (error) throw error

      toast.success("Sistema de pontuação atualizado com sucesso")
      setOpen(false)
      onSuccess()
    } catch (error) {
      console.error("Erro ao atualizar sistema de pontuação:", error)
      toast.error("Erro ao atualizar sistema de pontuação")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSystem = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newSystemName.trim()) {
      toast.error("Nome do sistema de pontuação é obrigatório")
      return
    }
    
    if (newSystemPoints.length === 0) {
      toast.error("Adicione pelo menos uma posição com pontuação")
      return
    }

    setLoading(true)
    try {
      // Converter o array de posições e pontos para o formato JSON esperado
      const pointsObject: Record<string, number> = {}
      newSystemPoints.forEach(item => {
        pointsObject[item.position.toString()] = item.points
      })

      // Criar novo sistema de pontuação
      const { data, error } = await supabase
        .from("scoring_systems")
        .insert([
          {
            name: newSystemName,
            description: newSystemDescription,
            is_default: false,
            points: pointsObject
          }
        ])
        .select()

      if (error) throw error

      // Se a criação foi bem-sucedida, atualizar a lista e selecionar o novo sistema
      if (data && data.length > 0) {
        const newSystemId = data[0].id
        
        // Atualizar lista de sistemas
        await fetchScoringSystems()
        
        // Selecionar o novo sistema
        setSelectedSystem(newSystemId)
        
        // Mudar para a aba de seleção
        setActiveTab("select")
        
        toast.success("Sistema de pontuação criado com sucesso")
        
        // Limpar os campos
        setNewSystemName("")
        setNewSystemDescription("")
        setNewSystemPoints([
          { position: 1, points: 10 },
          { position: 2, points: 8 },
          { position: 3, points: 6 },
          { position: 4, points: 5 },
          { position: 5, points: 4 },
          { position: 6, points: 3 },
          { position: 7, points: 2 },
          { position: 8, points: 1 },
        ])
      }
    } catch (error) {
      console.error("Erro ao criar sistema de pontuação:", error)
      toast.error("Erro ao criar sistema de pontuação")
    } finally {
      setLoading(false)
    }
  }

  const addPositionRow = () => {
    const nextPosition = newSystemPoints.length > 0 
      ? Math.max(...newSystemPoints.map(p => p.position)) + 1 
      : 1
    
    setNewSystemPoints([...newSystemPoints, { position: nextPosition, points: 1 }])
  }

  const removePositionRow = (position: number) => {
    setNewSystemPoints(newSystemPoints.filter(p => p.position !== position))
  }

  const updatePointsValue = (position: number, points: number) => {
    setNewSystemPoints(
      newSystemPoints.map(p => 
        p.position === position ? { ...p, points } : p
      )
    )
  }

  // Ordenar as posições para exibição
  const sortedPositions = [...newSystemPoints].sort((a, b) => a.position - b.position)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Edit className="h-3.5 w-3.5" />
          Sistema de Pontuação
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Sistema de Pontuação</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="select">Selecionar</TabsTrigger>
            <TabsTrigger value="create">Criar Novo</TabsTrigger>
          </TabsList>
          
          <TabsContent value="select" className="space-y-4 py-4">
            {fetchingSystems ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="scoring-system">Sistema de Pontuação</Label>
                  <Select 
                    value={selectedSystem} 
                    onValueChange={setSelectedSystem}
                    disabled={scoringSystems.length === 0}
                  >
                    <SelectTrigger id="scoring-system">
                      <SelectValue placeholder="Selecione um sistema de pontuação" />
                    </SelectTrigger>
                    <SelectContent>
                      {scoringSystems.map((system) => (
                        <SelectItem key={system.id} value={system.id}>
                          {system.name} {system.is_default ? "(Padrão)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedSystem && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          {scoringSystems
                            .find(s => s.id === selectedSystem)
                            ?.points && 
                            Object.entries(scoringSystems.find(s => s.id === selectedSystem)!.points)
                              .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
                              .map(([position, points]) => (
                                <div key={position} className="flex justify-between items-center">
                                  <span className="text-sm font-medium">Posição {position}</span>
                                  <span className="text-sm">{points} pontos</span>
                                </div>
                              ))
                          }
                        </div>
                        {scoringSystems.find(s => s.id === selectedSystem)?.description && (
                          <div className="text-xs text-muted-foreground mt-2">
                            {scoringSystems.find(s => s.id === selectedSystem)?.description}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading || !selectedSystem}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>Salvar</>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </TabsContent>
          
          <TabsContent value="create" className="space-y-4 py-4">
            <form onSubmit={handleCreateSystem} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="new-system-name">Nome do Sistema</Label>
                <Input
                  id="new-system-name"
                  value={newSystemName}
                  onChange={(e) => setNewSystemName(e.target.value)}
                  placeholder="Ex: Meu Sistema Personalizado"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-system-description">Descrição (opcional)</Label>
                <Input
                  id="new-system-description"
                  value={newSystemDescription}
                  onChange={(e) => setNewSystemDescription(e.target.value)}
                  placeholder="Descreva seu sistema de pontuação..."
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Pontuação por Posição</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={addPositionRow}
                    className="h-8 gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Adicionar
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {sortedPositions.map((item) => (
                    <div key={item.position} className="flex items-center gap-2">
                      <div className="flex-shrink-0 w-24">
                        <span className="text-sm">Posição {item.position}</span>
                      </div>
                      <Input
                        type="number"
                        min="0"
                        value={item.points}
                        onChange={(e) => updatePointsValue(item.position, Number(e.target.value))}
                        className="h-8"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removePositionRow(item.position)}
                        className="h-8 w-8"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setActiveTab("select")}>
                  Voltar
                </Button>
                <Button type="submit" disabled={loading || !newSystemName.trim() || newSystemPoints.length === 0}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>Criar Sistema</>
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
} 