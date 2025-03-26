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
import { Loader2, Pencil } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import logger from "@/lib/logger"

interface League {
  id: string
  name: string
  description: string
  logo_url: string | null
  owner_id: string
}

interface EditLeagueModalProps {
  league: League
  onSuccess: () => void
  isOwner: boolean
}

export function EditLeagueModal({ league, onSuccess, isOwner }: EditLeagueModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(league.logo_url)
  const supabase = createClientComponentClient()

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      const name = formData.get("name") as string
      const description = formData.get("description") as string

      let logoUrl = league.logo_url

      // Upload do logo se for fornecido
      if (logoFile) {
        // Obter a sessão para garantir que temos o ID do usuário
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          toast.error("Sua sessão expirou. Faça login novamente.")
          return
        }

        const fileExt = logoFile.name.split(".").pop()
        const fileName = `${league.id}-${Math.random()}.${fileExt}`
        const filePath = `${session.user.id}/${fileName}`

        // Remover logo antigo se existir
        if (league.logo_url) {
          const oldPath = league.logo_url.split('/').pop()
          if (oldPath) {
            try {
              await supabase.storage
                .from('league-logos')
                .remove([`${session.user.id}/${oldPath}`])
            } catch (error) {
              logger.warning('Liga', `Falha ao remover logo antigo`, {
                erro: error instanceof Error ? error.message : String(error),
                ligaId: league.id,
                usuarioId: session.user.id
              });
              // Continuar mesmo se falhar ao remover o logo antigo
            }
          }
        }

        // Upload do novo logo
        const { error: uploadError } = await supabase.storage
          .from("league-logos")
          .upload(filePath, logoFile, {
            cacheControl: '3600',
            upsert: true
          })

        if (uploadError) {
          logger.error('Liga', `Falha no upload do logo`, {
            erro: uploadError.message,
            ligaId: league.id,
            userId: session.user.id
          });
          toast.error("Erro ao fazer upload do logo. Tente novamente.")
          return
        }

        // Obter URL pública
        const { data: { publicUrl } } = supabase.storage
          .from("league-logos")
          .getPublicUrl(filePath)

        logoUrl = publicUrl
      }

      // Atualizar a liga
      const { error: updateError } = await supabase
        .from("leagues")
        .update({
          name,
          description,
          logo_url: logoUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', league.id)

      if (updateError) {
        logger.error('Liga', `Falha na atualização`, {
          erro: updateError.message,
          ligaId: league.id,
          detalhe: updateError.details
        });
        toast.error("Erro ao atualizar liga. Tente novamente.")
        return
      }

      toast.success("Liga atualizada com sucesso!")
      setOpen(false)
      onSuccess()
    } catch (error) {
      logger.error('Liga', `Erro não tratado na atualização`, {
        erro: error instanceof Error ? error.message : String(error),
        ligaId: league.id
      });
      toast.error("Erro ao atualizar liga. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  // Se não for o dono, não exibir o botão de edição
  if (!isOwner) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 bg-white text-black hover:bg-gray-100 border-gray-200">
          <Pencil className="h-4 w-4" />
          Editar Liga
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Liga</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={logoPreview || undefined} alt={league.name} />
              <AvatarFallback className="text-2xl">
                {league.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-center space-y-2">
              <Label htmlFor="logo" className="cursor-pointer">
                Alterar logo
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

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome da Liga</Label>
              <Input
                id="name"
                name="name"
                defaultValue={league.name}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={league.description}
              rows={4}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Alterações
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
} 