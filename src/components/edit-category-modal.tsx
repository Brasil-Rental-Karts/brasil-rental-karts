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
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Pencil, Users, Weight } from "lucide-react"
import { toast } from "sonner"

interface Category {
  id: string
  name: string
  description: string
  championship_id: string
  max_pilots: number | null
  ballast_kg: number | null
  created_at: string
  updated_at: string
}

interface EditCategoryModalProps {
  category: Category
  onSuccess: () => void
}

export function EditCategoryModal({ category, onSuccess }: EditCategoryModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState(category.name)
  const [description, setDescription] = useState(category.description || "")
  const [maxPilots, setMaxPilots] = useState<number | null>(category.max_pilots)
  const [ballastKg, setBallastKg] = useState<number | null>(category.ballast_kg)
  const supabase = createClientComponentClient()
  
  // Atualizar os campos quando a categoria mudar
  useEffect(() => {
    setName(category.name)
    setDescription(category.description || "")
    setMaxPilots(category.max_pilots)
    setBallastKg(category.ballast_kg)
  }, [category])
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      // Resetar para os valores originais quando fechar sem salvar
      setName(category.name)
      setDescription(category.description || "")
      setMaxPilots(category.max_pilots)
      setBallastKg(category.ballast_kg)
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
        .update({
          name,
          description,
          max_pilots: maxPilots,
          ballast_kg: ballastKg,
          updated_at: new Date().toISOString()
        })
        .eq("id", category.id)

      if (error) throw error

      toast.success("Categoria atualizada com sucesso")
      setIsOpen(false)
      onSuccess()
    } catch (error) {
      console.error("Erro ao atualizar categoria:", error)
      toast.error("Erro ao atualizar categoria")
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
        <Button variant="outline" size="icon" className="h-8 w-8">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Editar Categoria</DialogTitle>
          <DialogDescription>
            Modifique os detalhes da categoria
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
              onClick={() => setIsOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 