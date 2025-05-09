"use client"

import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Edit, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface EditPilotPointsModalProps {
  categoryPilotId: string
  pilotName: string
  initialPoints: number
  onSuccess: () => void
}

export function EditPilotPointsModal({ 
  categoryPilotId, 
  pilotName, 
  initialPoints, 
  onSuccess 
}: EditPilotPointsModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [points, setPoints] = useState(initialPoints.toString())
  const supabase = createClientComponentClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const pointsValue = parseFloat(points)
    if (isNaN(pointsValue) || pointsValue < 0) {
      toast.error("Informe um valor válido para a pontuação inicial")
      return
    }
    
    setLoading(true)
    try {
      const { error } = await supabase
        .from("category_pilots")
        .update({
          initial_points: pointsValue,
        })
        .eq("id", categoryPilotId)

      if (error) throw error

      toast.success("Pontuação inicial atualizada com sucesso")
      setOpen(false)
      onSuccess()
    } catch (error) {
      console.error("Erro ao atualizar pontuação inicial:", error)
      toast.error("Erro ao atualizar pontuação inicial")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Edit className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Pontuação Inicial</DialogTitle>
          <DialogDescription>
            Adicione uma pontuação inicial para o piloto {pilotName}.
            Use esta opção caso o campeonato já tenha começado e você não tenha o histórico das etapas anteriores.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="points">Pontuação Inicial</Label>
            <Input
              id="points"
              type="number"
              step="0.01"
              min="0"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              placeholder="Ex: 10.5"
            />
            <p className="text-xs text-muted-foreground">
              Esta pontuação será somada aos pontos conquistados nas etapas para o cálculo da classificação geral.
            </p>
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