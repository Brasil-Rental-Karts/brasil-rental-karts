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
import { Edit, Loader2 } from "lucide-react"
import { toast } from "sonner"

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

interface EditRaceResultModalProps {
  result: RaceResult
  onSuccess: () => void
}

export function EditRaceResultModal({ result, onSuccess }: EditRaceResultModalProps) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState("")
  const [qualificationPosition, setQualificationPosition] = useState("")
  const [fastestLap, setFastestLap] = useState(false)
  const [dnf, setDnf] = useState(false)
  const [dq, setDq] = useState(false)
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const supabase = createClientComponentClient()

  // Inicializar o formulário com os dados existentes
  useEffect(() => {
    if (result) {
      setPosition(result.position?.toString() || "")
      setQualificationPosition(result.qualification_position?.toString() || "")
      setFastestLap(result.fastest_lap || false)
      setDnf(result.dnf || false)
      setDq(result.dq || false)
      setNotes(result.notes || "")
    }
  }, [result])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setLoading(true)
    try {
      // Atualizar resultado
      const { error } = await supabase
        .from("race_results")
        .update({
          position: position ? parseInt(position) : null,
          qualification_position: qualificationPosition ? parseInt(qualificationPosition) : null,
          fastest_lap: fastestLap,
          dnf: dnf,
          dq: dq,
          notes
        })
        .eq("id", result.id)

      if (error) throw error

      toast.success("Resultado atualizado com sucesso")
      setOpen(false)
      onSuccess()
    } catch (error) {
      console.error("Erro ao atualizar resultado:", error)
      toast.error("Erro ao atualizar resultado")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8">
          <Edit className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Resultado</DialogTitle>
          <DialogDescription>
            Atualize o resultado de {result.pilot.name} na categoria {result.category.name}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
                onCheckedChange={(checked: boolean) => setFastestLap(checked)}
              />
              <Label htmlFor="fastestLap" className="text-sm font-normal">Volta mais rápida</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="dnf"
                checked={dnf}
                onCheckedChange={(checked: boolean) => setDnf(checked)}
              />
              <Label htmlFor="dnf" className="text-sm font-normal">Não completou (DNF)</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="dq"
                checked={dq}
                onCheckedChange={(checked: boolean) => setDq(checked)}
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
      </DialogContent>
    </Dialog>
  )
} 