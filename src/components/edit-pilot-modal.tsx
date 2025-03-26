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
import { IMaskInput } from "react-imask"
import logger from "@/lib/logger"

interface PilotProfile {
  id: string
  name: string
  email: string
  phone: string
  bio: string
  avatar_url: string | null
}

interface EditPilotModalProps {
  pilot: PilotProfile
  onSuccess: () => void
}

export function EditPilotModal({ pilot, onSuccess }: EditPilotModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(pilot.avatar_url)
  const supabase = createClientComponentClient()

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
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
      const phone = formData.get("phone") as string
      const bio = formData.get("bio") as string

      let avatarUrl = pilot.avatar_url

      if (avatarFile) {
        // Upload avatar to Supabase Storage
        const fileExt = avatarFile.name.split(".").pop()
        const fileName = `${pilot.id}-${Math.random()}.${fileExt}`
        const filePath = `${pilot.id}/${fileName}`

        // Delete old avatar if it exists
        if (pilot.avatar_url) {
          const oldPath = pilot.avatar_url.split('/').pop()
          if (oldPath) {
            try {
              await supabase.storage
                .from('pilot-avatars')
                .remove([`${pilot.id}/${oldPath}`])
            } catch (error) {
              logger.warning('Avatar', `Falha ao remover avatar antigo`, {
                erro: error instanceof Error ? error.message : String(error),
                pilotoId: pilot.id
              });
              // Continue even if we fail to remove the old avatar
            }
          }
        }

        // Upload new avatar
        const { error: uploadError } = await supabase.storage
          .from("pilot-avatars")
          .upload(filePath, avatarFile, {
            cacheControl: '3600',
            upsert: true
          })

        if (uploadError) {
          logger.error('Avatar', `Upload falhou`, { 
            erro: uploadError.message,
            pilotoId: pilot.id
          });
          toast.error("Erro ao fazer upload da foto. Tente novamente.")
          return
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from("pilot-avatars")
          .getPublicUrl(filePath)

        avatarUrl = publicUrl
      }

      // First, try to update the pilot profile
      const { error: updateError } = await supabase
        .from("pilot_profiles")
        .upsert({
          id: pilot.id,
          name,
          email: pilot.email,
          phone,
          bio,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        })

      if (updateError) {
        logger.error('Perfil', `Atualização falhou`, {
          pilotoId: pilot.id,
          erro: updateError.message,
          detalhe: updateError.details
        });
        toast.error("Erro ao atualizar perfil. Tente novamente.")
        return
      }

      // Then, update the user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { 
          name,
          avatar_url: avatarUrl
        }
      })

      if (authError) {
        logger.error('Auth', `Falha ao atualizar metadados do usuário`, {
          pilotoId: pilot.id,
          erro: authError.message
        });
        toast.error("Erro ao atualizar perfil. Tente novamente.")
        return
      }

      toast.success("Perfil atualizado com sucesso!")
      setOpen(false)
      onSuccess()
    } catch (error) {
      logger.error('Perfil', `Erro não tratado na atualização`, {
        erro: error instanceof Error ? error.message : String(error),
        pilotoId: pilot.id
      });
      toast.error("Erro ao atualizar perfil. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Pencil className="h-4 w-4" />
          Editar Perfil
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatarPreview || undefined} alt={pilot.name} />
              <AvatarFallback className="text-2xl">
                {pilot.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-center space-y-2">
              <Label htmlFor="avatar" className="cursor-pointer">
                Alterar foto
              </Label>
              <Input
                id="avatar"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
          </div>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                name="name"
                defaultValue={pilot.name}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Telefone</Label>
              <IMaskInput
                id="phone"
                name="phone"
                type="tel"
                placeholder="(99) 99999-9999"
                mask="(00) 00000-0000"
                defaultValue={pilot.phone || ''}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={pilot.email}
              disabled
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Biografia</Label>
            <Textarea
              id="bio"
              name="bio"
              defaultValue={pilot.bio}
              rows={4}
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