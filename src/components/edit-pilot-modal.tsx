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
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Pencil, Camera, User, Phone, Mail, FileText } from "lucide-react"
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
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
          <Pencil className="h-3.5 w-3.5" />
          <span className="sm:inline hidden">Editar</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>Editar Perfil</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Atualize suas informações pessoais
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative bg-gradient-to-r from-primary/5 to-primary/10 py-8">
            <div className="flex justify-center">
              <div className="relative group">
                <Avatar className="h-24 w-24 border-2 border-background shadow-md">
                  <AvatarImage src={avatarPreview || undefined} alt={pilot.name} />
                  <AvatarFallback className="text-2xl bg-primary/5">
                    {pilot.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/30 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200">
                  <Label htmlFor="avatar" className="cursor-pointer w-full h-full flex items-center justify-center">
                    <Camera className="h-6 w-6 text-white" />
                    <span className="sr-only">Alterar foto</span>
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
            </div>
          </div>

          <div className="px-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-medium flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground/70" />
                Nome completo
              </Label>
              <Input
                id="name"
                name="name"
                defaultValue={pilot.name}
                className="h-9"
                required
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-muted-foreground/70" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={pilot.email}
                className="h-9 bg-muted/40"
                disabled
              />
              <p className="text-[10px] text-muted-foreground">Este email não pode ser alterado</p>
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-medium flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-muted-foreground/70" />
                Telefone
              </Label>
              <IMaskInput
                id="phone"
                name="phone"
                type="tel"
                placeholder="(99) 99999-9999"
                mask="(00) 00000-0000"
                defaultValue={pilot.phone || ''}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bio" className="text-xs font-medium flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-muted-foreground/70" />
                Sobre você
              </Label>
              <Textarea
                id="bio"
                name="bio"
                defaultValue={pilot.bio}
                placeholder="Conte um pouco sobre você, sua experiência no kart..."
                className="resize-none text-sm min-h-[80px]"
                rows={3}
              />
            </div>
          </div>

          <div className="px-6 pb-6 pt-2 flex justify-end gap-2">
            <Button 
              type="button" 
              variant="ghost" 
              size="sm"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={loading} className="min-w-[80px]">
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                "Salvar"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 