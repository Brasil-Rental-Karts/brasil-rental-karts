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
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Edit, Upload, Image, X } from "lucide-react"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { v4 as uuidv4 } from 'uuid'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format, parse } from "date-fns"

interface Championship {
  id: string
  name: string
  description: string
  league_id: string
  start_date: string | null
  end_date: string | null
  status: 'upcoming' | 'active' | 'completed'
  logo_url: string | null
  scoring_system_id: string
  created_at: string
  updated_at: string
}

interface EditChampionshipModalProps {
  championship: Championship
  onSuccess: () => void
}

export function EditChampionshipModal({ championship, onSuccess }: EditChampionshipModalProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [status, setStatus] = useState<"upcoming" | "active" | "completed">("upcoming")
  const [loading, setLoading] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [removeLogo, setRemoveLogo] = useState(false)
  const supabase = createClientComponentClient()

  // Função para formatar a data ISO para o formato mês/ano (YYYY-MM)
  const formatDateToMonthYear = (isoDate: string | null) => {
    if (!isoDate) return "";
    try {
      return format(new Date(isoDate), "yyyy-MM");
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return "";
    }
  };

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

  useEffect(() => {
    if (championship) {
      setName(championship.name)
      setDescription(championship.description || "")
      setStartDate(formatDateToMonthYear(championship.start_date))
      setEndDate(formatDateToMonthYear(championship.end_date))
      setStatus(championship.status)
      setLogoUrl(championship.logo_url)
      setLogoPreview(null)
      setLogoFile(null)
      setRemoveLogo(false)
    }
  }, [championship, open])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    if (file) {
      setLogoFile(file)
      // Criar URL para preview
      const previewUrl = URL.createObjectURL(file)
      setLogoPreview(previewUrl)
      setRemoveLogo(false)
    }
  }

  const handleRemoveLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
    setRemoveLogo(true)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Nome do campeonato é obrigatório")
      return
    }

    setLoading(true)
    try {
      // Determinar a logoUrl final
      let finalLogoUrl = logoUrl
      
      // Se há um novo arquivo para upload
      if (logoFile) {
        finalLogoUrl = await uploadLogo()
      } 
      // Se o usuário optou por remover a logo
      else if (removeLogo) {
        finalLogoUrl = null
      }

      // Converter datas para ISO
      const startDateISO = convertMonthYearToISO(startDate);
      const endDateISO = convertMonthYearToISO(endDate);

      const { error } = await supabase
        .from("championships")
        .update({
          name,
          description,
          start_date: startDateISO,
          end_date: endDateISO,
          status,
          logo_url: finalLogoUrl,
          updated_at: new Date().toISOString()
        })
        .eq("id", championship.id)

      if (error) throw error

      toast.success("Campeonato atualizado com sucesso")
      setOpen(false)
      onSuccess()
    } catch (error) {
      console.error("Erro ao atualizar campeonato:", error)
      toast.error("Erro ao atualizar campeonato")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Campeonato</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Logo Upload */}
          <div className="space-y-2">
            <Label>Logo do Campeonato</Label>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 ring-2 ring-primary/10 ring-offset-2">
                {logoPreview ? (
                  <AvatarImage src={logoPreview} alt="Preview" />
                ) : logoUrl ? (
                  <AvatarImage src={logoUrl} alt={name} />
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
                {logoUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-1 text-destructive hover:text-destructive"
                    onClick={handleRemoveLogo}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remover logo
                  </Button>
                )}
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
            <Select 
              value={status} 
              onValueChange={(value: string) => 
                setStatus(value as "upcoming" | "active" | "completed")
              }
            >
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
                <>Salvar Alterações</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 