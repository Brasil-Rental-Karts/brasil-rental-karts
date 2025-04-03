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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Edit, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Race {
  id: string
  championship_id: string
  name: string
  description: string | null
  date: string | null
  location: string | null
  track_layout: string | null
  status: "scheduled" | "completed" | "cancelled"
}

interface EditRaceModalProps {
  race: Race
  onSuccess: () => void
}

export function EditRaceModal({ race, onSuccess }: EditRaceModalProps) {
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

  // Inicializa o formulário com os dados da etapa
  useEffect(() => {
    if (race) {
      setName(race.name || "")
      setDescription(race.description || "")
      setLocation(race.location || "")
      setTrackLayout(race.track_layout || "")
      setStatus(race.status || "scheduled")

      // Processar data e hora
      if (race.date) {
        const dateObj = new Date(race.date)
        
        // Converter para o fuso horário local
        const year = dateObj.getUTCFullYear()
        const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0')
        const day = String(dateObj.getUTCDate()).padStart(2, '0')
        setDate(`${year}-${month}-${day}`)
        
        // Formatar hora HH:MM
        const hours = String(dateObj.getUTCHours()).padStart(2, '0')
        const minutes = String(dateObj.getUTCMinutes()).padStart(2, '0')
        setTime(`${hours}:${minutes}`)
      } else {
        setDate("")
        setTime("")
      }
    }
  }, [race])

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
          const [year, month, day] = date.split('-').map(Number)
          const [hours, minutes] = time.split(':').map(Number)
          
          // Criar um objeto Date UTC com os valores exatos (mês em JS é base 0)
          combinedDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0)).toISOString()
        } else {
          // Se tiver só data, usar meio-dia como horário padrão
          const [year, month, day] = date.split('-').map(Number)
          
          // Usar meio-dia no UTC
          combinedDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0)).toISOString()
        }
      }

      // Atualizar etapa no banco de dados
      const { error } = await supabase
        .from("races")
        .update({
          name,
          description,
          date: combinedDate,
          location,
          track_layout: trackLayout,
          status
        })
        .eq("id", race.id)

      if (error) throw error

      toast.success("Etapa atualizada com sucesso")
      setOpen(false)
      onSuccess()
    } catch (error) {
      console.error("Erro ao atualizar etapa:", error)
      toast.error("Erro ao atualizar etapa")
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Etapa</DialogTitle>
          <DialogDescription>
            Atualize as informações desta etapa.
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