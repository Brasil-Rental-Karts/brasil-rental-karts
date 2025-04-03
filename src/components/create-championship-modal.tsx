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
import { Loader2, Plus, Trophy, Upload, Image } from "lucide-react"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { v4 as uuidv4 } from 'uuid'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format, parse } from "date-fns"

interface CreateChampionshipModalProps {
  leagueId: string
  onSuccess: () => void
}

export function CreateChampionshipModal({ leagueId, onSuccess }: CreateChampionshipModalProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [status, setStatus] = useState<"upcoming" | "active" | "completed">("upcoming")
  const [loading, setLoading] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const supabase = createClientComponentClient()

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    if (file) {
      setLogoFile(file)
      // Criar URL para preview
      const previewUrl = URL.createObjectURL(file)
      setLogoPreview(previewUrl)
    }
  }

  const uploadLogo = async () => {
    if (!logoFile) return null
    
    try {
      setUploadingLogo(true)
      
      // Obter o ID do usuário atual
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error("Usuário não autenticado")
      
      const userId = session.user.id
      const fileExt = logoFile.name.split('.').pop()
      const fileName = `${userId}/${Date.now()}-${uuidv4()}.${fileExt}`
      
      // Upload do arquivo para o bucket championship-logos
      const { error: uploadError } = await supabase.storage
        .from('championship-logos')
        .upload(fileName, logoFile, {
          cacheControl: '3600',
          upsert: true
        })
      
      if (uploadError) {
        console.error("Erro ao fazer upload da logo:", uploadError)
        throw uploadError
      }
      
      // Obter URL pública do arquivo
      const { data: { publicUrl } } = supabase.storage
        .from('championship-logos')
        .getPublicUrl(fileName)
      
      return publicUrl
    } catch (error) {
      console.error("Erro ao fazer upload da logo:", error)
      toast.error("Erro ao fazer upload da logo")
      return null
    } finally {
      setUploadingLogo(false)
    }
  }

  // Função para converter data mês/ano para ISO
  const convertMonthYearToISO = (monthYearValue: string) => {
    if (!monthYearValue) return null;
    
    try {
      // Convertendo formato YYYY-MM para um objeto Date
      // Usando o dia 1 do mês
      const dateObj = parse(monthYearValue, "yyyy-MM", new Date());
      
      // Formatar como string ISO
      return dateObj.toISOString();
    } catch (error) {
      console.error("Erro ao converter data:", error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Nome do campeonato é obrigatório")
      return
    }

    setLoading(true)
    try {
      // Fazer upload da logo, se existir
      const logoUrl = logoFile ? await uploadLogo() : null
      
      // Converter datas para ISO
      const startDateISO = convertMonthYearToISO(startDate);
      const endDateISO = convertMonthYearToISO(endDate);
      
      // Criar campeonato no banco de dados
      const { error } = await supabase
        .from("championships")
        .insert([
          {
            name,
            description,
            league_id: leagueId,
            start_date: startDateISO,
            end_date: endDateISO,
            status,
            logo_url: logoUrl
          }
        ])

      if (error) throw error

      toast.success("Campeonato criado com sucesso")
      setName("")
      setDescription("")
      setStartDate("")
      setEndDate("")
      setStatus("upcoming")
      setLogoFile(null)
      setLogoPreview(null)
      setOpen(false)
      onSuccess()
    } catch (error) {
      console.error("Erro ao criar campeonato:", error)
      toast.error("Erro ao criar campeonato")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Novo Campeonato
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Campeonato</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Logo Upload */}
          <div className="space-y-2">
            <Label>Logo do Campeonato</Label>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 ring-2 ring-primary/10 ring-offset-2">
                {logoPreview ? (
                  <AvatarImage src={logoPreview} alt="Preview" />
                ) : (
                  <AvatarFallback className="bg-primary/5">
                    <Image className="h-6 w-6 text-muted-foreground" />
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1">
                <Label htmlFor="logo-upload" className="cursor-pointer">
                  <div className="flex items-center gap-2 p-2 border rounded hover:bg-muted transition-colors">
                    <Upload className="h-4 w-4" />
                    <span className="text-sm">Escolher imagem</span>
                  </div>
                  <Input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Recomendado: 512x512px, máx. 2MB
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Campeonato</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Campeonato de Verão 2023"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva seu campeonato..."
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Mês/Ano de Início</Label>
              <Input
                id="startDate"
                type="month"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Mês/Ano de Término</Label>
              <Input
                id="endDate"
                type="month"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(value: string) => setStatus(value as "upcoming" | "active" | "completed")}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upcoming">Em breve</SelectItem>
                <SelectItem value="active">Em andamento</SelectItem>
                <SelectItem value="completed">Finalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || uploadingLogo}>
              {loading || uploadingLogo ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploadingLogo ? "Fazendo upload..." : "Salvando..."}
                </>
              ) : (
                <>Criar Campeonato</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 