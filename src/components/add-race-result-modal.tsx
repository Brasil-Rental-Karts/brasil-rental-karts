"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Award, Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

interface Pilot {
  id: string
  name: string
}

interface Category {
  id: string
  name: string
}

interface AddRaceResultModalProps {
  raceId: string
  championshipId: string
  onSuccess: () => void
}

export function AddRaceResultModal({ raceId, championshipId, onSuccess }: AddRaceResultModalProps) {
  const [open, setOpen] = useState(false)
  const [pilots, setPilots] = useState<Pilot[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedPilot, setSelectedPilot] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [position, setPosition] = useState("")
  const [qualificationPosition, setQualificationPosition] = useState("")
  const [fastestLap, setFastestLap] = useState(false)
  const [dnf, setDnf] = useState(false)
  const [dq, setDq] = useState(false)
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const supabase = createClientComponentClient()

  // Carregar pilotos e categorias ao abrir o modal
  useEffect(() => {
    if (open) {
      fetchPilotsAndCategories()
    }
  }, [open, championshipId])

  const fetchPilotsAndCategories = async () => {
    setLoadingData(true)

    try {
      // Buscar categorias do campeonato
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("id, name")
        .eq("championship_id", championshipId)
        .order("name")

      if (categoriesError) throw categoriesError
      setCategories(categoriesData || [])

      // Buscar pilotos associados a essas categorias
      if (categoriesData && categoriesData.length > 0) {
        const categoryIds = categoriesData.map(cat => cat.id)
        
        const { data: categoryPilotsData, error: pilotsError } = await supabase
          .from("category_pilots")
          .select(`
            pilot_id,
            pilot_profiles:pilot_id (id, name)
          `)
          .in("category_id", categoryIds)
        
        if (pilotsError) throw pilotsError

        if (categoryPilotsData) {
          // Extrair pilotos únicos
          const uniquePilots = Array.from(
            new Map(
              categoryPilotsData.map(cp => [
                cp.pilot_profiles.id,
                { id: cp.pilot_profiles.id, name: cp.pilot_profiles.name }
              ])
            ).values()
          )

          setPilots(uniquePilots)
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast.error("Erro ao carregar pilotos e categorias")
    } finally {
      setLoadingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPilot) {
      toast.error("Selecione um piloto")
      return
    }

    if (!selectedCategory) {
      toast.error("Selecione uma categoria")
      return
    }

    setLoading(true)
    try {
      // Verificar se já existe um resultado para este piloto nesta etapa
      const { data: existingResult, error: checkError } = await supabase
        .from("race_results")
        .select("id")
        .eq("race_id", raceId)
        .eq("pilot_id", selectedPilot)
        .maybeSingle()

      if (checkError) throw checkError

      if (existingResult) {
        toast.error("Este piloto já possui um resultado nesta etapa")
        setLoading(false)
        return
      }

      // Criar novo resultado
      const { error } = await supabase
        .from("race_results")
        .insert([
          {
            race_id: raceId,
            pilot_id: selectedPilot,
            category_id: selectedCategory,
            position: position ? parseInt(position) : null,
            qualification_position: qualificationPosition ? parseInt(qualificationPosition) : null,
            fastest_lap: fastestLap,
            dnf: dnf,
            dq: dq,
            notes
          }
        ])

      if (error) throw error

      toast.success("Resultado adicionado com sucesso")
      resetForm()
      setOpen(false)
      onSuccess()
    } catch (error) {
      console.error("Erro ao adicionar resultado:", error)
      toast.error("Erro ao adicionar resultado")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedPilot("")
    setSelectedCategory("")
    setPosition("")
    setQualificationPosition("")
    setFastestLap(false)
    setDnf(false)
    setDq(false)
    setNotes("")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Adicionar Resultado
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Resultado</DialogTitle>
          <DialogDescription>
            Registre o resultado de um piloto nesta etapa.
          </DialogDescription>
        </DialogHeader>
        {loadingData ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pilot">Piloto</Label>
              <Select value={selectedPilot} onValueChange={setSelectedPilot}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um piloto" />
                </SelectTrigger>
                <SelectContent>
                  {pilots.map((pilot) => (
                    <SelectItem key={pilot.id} value={pilot.id}>{pilot.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="position">Posição Final</Label>
                <Input
                  id="position"
                  type="number"
                  min="1"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="Ex: 1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qualificationPosition">Posição na Classificação</Label>
                <Input
                  id="qualificationPosition"
                  type="number"
                  min="1"
                  value={qualificationPosition}
                  onChange={(e) => setQualificationPosition(e.target.value)}
                  placeholder="Ex: 3"
                />
              </div>
            </div>
            
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="fastestLap"
                  checked={fastestLap}
                  onCheckedChange={(checked) => setFastestLap(checked === true)}
                />
                <Label htmlFor="fastestLap" className="text-sm font-normal">Volta mais rápida</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="dnf"
                  checked={dnf}
                  onCheckedChange={(checked) => setDnf(checked === true)}
                />
                <Label htmlFor="dnf" className="text-sm font-normal">Não completou (DNF)</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="dq"
                  checked={dq}
                  onCheckedChange={(checked) => setDq(checked === true)}
                />
                <Label htmlFor="dq" className="text-sm font-normal">Desclassificado (DQ)</Label>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações adicionais..."
                rows={2}
              />
            </div>
            
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
} 