"use client"

import { useState } from "react"
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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CalendarIcon, Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

interface CreateRaceModalProps {
  championshipId: string
  onSuccess: () => void
}

export function CreateRaceModal({ championshipId, onSuccess }: CreateRaceModalProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [location, setLocation] = useState("")
  const [trackLayout, setTrackLayout] = useState("")
  const [status, setStatus] = useState<"scheduled" | "completed" | "cancelled">("scheduled")
  const [loading, setLoading] = useState(false)
  const supabase = createClientComponentClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Nome da etapa é obrigatório")
      return
    }

    setLoading(true)
    try {
      // Combinar data e hora
      let combinedDate = null
      if (date) {
        if (time) {
          // Se tiver data e hora, combinar ambos
          const dateObj = new Date(date)
          const [hours, minutes] = time.split(':').map(Number)
          dateObj.setHours(hours, minutes)
          combinedDate = dateObj.toISOString()
        } else {
          // Se tiver só data, usar meio-dia como horário padrão
          const dateObj = new Date(date)
          dateObj.setHours(12, 0, 0, 0)
          combinedDate = dateObj.toISOString()
        }
      }

      // Criar etapa no banco de dados
      const { error } = await supabase
        .from("races")
        .insert([
          {
            name,
            description,
            championship_id: championshipId,
            date: combinedDate,
            location,
            track_layout: trackLayout,
            status
          }
        ])

      if (error) throw error

      toast.success("Etapa criada com sucesso")
      setName("")
      setDescription("")
      setDate("")
      setTime("")
      setLocation("")
      setTrackLayout("")
      setStatus("scheduled")
      setOpen(false)
      onSuccess()
    } catch (error) {
      console.error("Erro ao criar etapa:", error)
      toast.error("Erro ao criar etapa")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Nova Etapa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Etapa</DialogTitle>
          <DialogDescription>
            Crie uma nova etapa para o campeonato. Preencha os detalhes abaixo.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Etapa</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: 1ª Etapa - Abertura"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva detalhes da etapa..."
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Horário</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Local</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ex: Kartódromo Internacional de São Paulo"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="trackLayout">Traçado da Pista</Label>
            <Input
              id="trackLayout"
              value={trackLayout}
              onChange={(e) => setTrackLayout(e.target.value)}
              placeholder="Ex: Circuito Completo"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={status}
              onValueChange={(value: "scheduled" | "completed" | "cancelled") => setStatus(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Agendada</SelectItem>
                <SelectItem value="completed">Concluída</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
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