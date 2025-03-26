'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import logger from '@/lib/logger'

interface CreateLeagueModalProps {
  onSuccess?: () => void
}

export function CreateLeagueModal({ onSuccess }: CreateLeagueModalProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })

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
      setIsOpen(false)
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nova Liga
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Nova Liga</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={logoPreview || undefined} alt="Logo da Liga" />
              <AvatarFallback className="text-2xl">
                {formData.name ? formData.name.charAt(0) : 'L'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-center space-y-2">
              <Label htmlFor="logo" className="cursor-pointer">
                Adicionar logo
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

          <div className="space-y-2">
            <Label htmlFor="name">Nome da Liga</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-r-transparent" />
              ) : (
                'Criar Liga'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 