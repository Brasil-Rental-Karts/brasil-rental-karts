'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Image, Loader2, Trophy } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import logger from '@/lib/logger'

interface CreateLeagueModalProps {
  onSuccess?: () => void
  isOpenExternal?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CreateLeagueModal({ onSuccess, isOpenExternal, onOpenChange }: CreateLeagueModalProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [isOpen, setIsOpen] = useState(isOpenExternal || false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })

  // Sincronizar o estado interno com o externo quando a prop mudar
  useEffect(() => {
    if (isOpenExternal !== undefined) {
      setIsOpen(isOpenExternal)
    }
  }, [isOpenExternal])

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (onOpenChange) {
      onOpenChange(open)
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Primeiro, obter a sessão do usuário
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Não autorizado')
      }

      let logoUrl = null

      // Upload do logo se for fornecido
      if (logoFile) {
        const fileExt = logoFile.name.split(".").pop()
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`
        const filePath = `${session.user.id}/${fileName}`

        // Upload do logo para o Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from("league-logos")
          .upload(filePath, logoFile, {
            cacheControl: '3600',
            upsert: true
          })

        if (uploadError) {
          logger.error('Liga', `Falha no upload do logo (criação)`, {
            erro: uploadError.message,
            userId: session.user.id,
            fileName
          });
          throw new Error('Erro ao fazer upload do logo')
        }

        // Obtendo URL pública
        const { data: { publicUrl } } = supabase.storage
          .from("league-logos")
          .getPublicUrl(filePath)

        logoUrl = publicUrl
      }

      // Criar a liga com ou sem logo
      const response = await fetch('/api/league/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          logo_url: logoUrl
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao criar liga')
      }

      // Fechar modal e redirecionar para a nova liga
      handleOpenChange(false)
      onSuccess?.()
      router.push(`/league/${data.league.id}`)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Resetar o formulário quando o modal fechar
  const handleClose = (open: boolean) => {
    handleOpenChange(open)
    if (!open) {
      setFormData({ name: '', description: '' })
      setLogoFile(null)
      setLogoPreview(null)
      setError('')
    }
  }

  // Não renderizar o DialogTrigger quando controlado externamente
  const modalContent = (
    <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden">
      <DialogHeader className="px-6 pt-6 pb-2">
        <DialogTitle>Criar Nova Liga</DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Configure os detalhes da sua liga de kartismo
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="relative bg-gradient-to-r from-primary/5 to-primary/10 py-8">
          <div className="flex justify-center">
            <div className="relative group">
              <Avatar className="h-24 w-24 border-2 border-background shadow-md">
                <AvatarImage src={logoPreview || undefined} alt="Logo da Liga" />
                <AvatarFallback className="text-2xl bg-primary/5">
                  {formData.name ? formData.name.charAt(0) : <Trophy className="h-8 w-8 text-primary/60" />}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 bg-black/30 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200">
                <Label htmlFor="logo" className="cursor-pointer w-full h-full flex items-center justify-center">
                  <Image className="h-6 w-6 text-white" />
                  <span className="sr-only">Adicionar logo</span>
                </Label>
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-medium flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5 text-muted-foreground/70" />
              Nome da Liga
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="Digite o nome da liga"
              value={formData.name}
              onChange={handleChange}
              className="h-9"
              autoFocus
              required
            />
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-medium">
              Descrição
            </Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Descreva a sua liga e como funcionará"
              value={formData.description}
              onChange={handleChange}
              className="resize-none text-sm min-h-[80px]"
              rows={3}
              required
            />
          </div>
          
          {error && (
            <div className="bg-destructive/10 px-3 py-2 rounded-md">
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}
        </div>

        <div className="px-6 pb-6 pt-2 flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleClose(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" size="sm" disabled={isLoading} className="min-w-[80px]">
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              "Criar Liga"
            )}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
  
  // Se controlado externamente, não incluir o trigger
  if (isOpenExternal !== undefined) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        {modalContent}
      </Dialog>
    );
  }
  
  // Caso contrário, incluir o trigger padrão
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="flex items-center gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Nova Liga
        </Button>
      </DialogTrigger>
      {modalContent}
    </Dialog>
  );
} 