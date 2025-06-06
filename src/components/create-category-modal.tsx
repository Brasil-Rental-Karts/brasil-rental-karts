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
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Plus, Users, Weight } from "lucide-react"
import { toast } from "sonner"

interface CreateCategoryModalProps {
  championshipId: string
  onSuccess: () => void
}

export function CreateCategoryModal({ championshipId, onSuccess }: CreateCategoryModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [maxPilots, setMaxPilots] = useState<number | null>(null)
  const [ballastKg, setBallastKg] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClientComponentClient()

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setName("")
      setDescription("")
      setMaxPilots(null)
      setBallastKg(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Nome da categoria é obrigatório")
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from("categories")
        .insert([
          {
            name,
            description,
            championship_id: championshipId,
            max_pilots: maxPilots,
            ballast_kg: ballastKg
          }
        ])

      if (error) throw error

      toast.success("Categoria criada com sucesso")
      setName("")
      setDescription("")
      setMaxPilots(null)
      setBallastKg(null)
      setIsOpen(false)
      onSuccess()
    } catch (error) {
      console.error("Erro ao criar categoria:", error)
      toast.error("Erro ao criar categoria")
    } finally {
      setIsLoading(false)
    }
  }

  const handleNumberChange = (setter: React.Dispatch<React.SetStateAction<number | null>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value !== "" ? parseFloat(e.target.value) : null
    setter(value)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Nova Categoria
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Criar Nova Categoria</DialogTitle>
          <DialogDescription>
            Configure os detalhes da categoria para seu campeonato
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Categoria</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Novatos, Profissional, Master, etc."
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva esta categoria..."
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxPilots" className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                <span>Máximo de Pilotos</span>
              </Label>
              <Input
                id="maxPilots"
                type="number"
                min="0"
                step="1"
                value={maxPilots !== null ? maxPilots : ''}
                onChange={handleNumberChange(setMaxPilots)}
                placeholder="Ex: 20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ballastKg" className="flex items-center gap-1">
                <Weight className="h-3.5 w-3.5" />
                <span>Lastro (Kg)</span>
              </Label>
              <Input
                id="ballastKg"
                type="number"
                min="0"
                step="0.1"
                value={ballastKg !== null ? ballastKg : ''}
                onChange={handleNumberChange(setBallastKg)}
                placeholder="Ex: 5.5"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Categoria"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 