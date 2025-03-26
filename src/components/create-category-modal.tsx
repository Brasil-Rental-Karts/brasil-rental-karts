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
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

interface CreateCategoryModalProps {
  leagueId: string
  onSuccess: () => void
}

export function CreateCategoryModal({ leagueId, onSuccess }: CreateCategoryModalProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Reset errors
    setNameError(null)
    
    // Validate inputs
    let hasErrors = false
    
    if (!name.trim()) {
      setNameError("Nome da categoria é obrigatório")
      hasErrors = true
    }
    
    if (hasErrors) return
    
    try {
      setLoading(true)
      
      // First, check if there's already a category with the same name for this league
      const { data: existingCategories, error: checkError } = await supabase
        .from("categories")
        .select("id")
        .eq("league_id", leagueId)
        .eq("name", name.trim())
        .limit(1)
      
      if (checkError) throw checkError
      
      if (existingCategories && existingCategories.length > 0) {
        setNameError("Já existe uma categoria com este nome nesta liga")
        return
      }
      
      // Insert new category
      const { error: insertError } = await supabase
        .from("categories")
        .insert({
          name: name.trim(),
          description: description.trim(),
          league_id: leagueId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      
      if (insertError) throw insertError
      
      toast.success("Categoria criada com sucesso!")
      setOpen(false)
      setName("")
      setDescription("")
      onSuccess()
    } catch (error) {
      console.error("Erro ao criar categoria:", error)
      toast.error("Erro ao criar categoria. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" size="sm">
          <Plus className="h-4 w-4" />
          Nova Categoria
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Nova Categoria</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome da Categoria</Label>
            <Input
              id="name"
              placeholder="Ex: Categoria A, Categoria B, etc."
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
            {nameError && (
              <p className="text-sm text-red-500">{nameError}</p>
            )}
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descreva a categoria..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </div>
          
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              "Criar Categoria"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
} 