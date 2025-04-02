"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Plus, Search, User, Mail } from "lucide-react"
import { toast } from "sonner"
import { v4 as uuidv4 } from 'uuid'
import { debounce } from "lodash"

interface Pilot {
  id: string
  name: string
  email: string
  avatar_url: string | null
}

interface AddPilotToCategoryModalProps {
  categoryId: string
  maxPilots: number | null
  currentPilotCount: number
  onSuccess: () => void
}

export function AddPilotToCategoryModal({
  categoryId,
  maxPilots,
  currentPilotCount,
  onSuccess
}: AddPilotToCategoryModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("search")
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<Pilot[]>([])
  const [isSearching, setIsSearching] = useState(false)
  
  // Campos para novo piloto
  const [newPilotName, setNewPilotName] = useState("")
  const [newPilotEmail, setNewPilotEmail] = useState("")
  const [selectedPilotId, setSelectedPilotId] = useState<string | null>(null)
  
  const supabase = createClientComponentClient()
  
  // Verificar se atingiu o limite de pilotos
  const hasReachedLimit = maxPilots !== null && currentPilotCount >= maxPilots
  
  // Função de busca debounced
  const debouncedSearch = debounce(async (term: string) => {
    if (!term || term.length < 3) {
      setSearchResults([])
      setIsSearching(false)
      return
    }
    
    try {
      setIsSearching(true)
      const { data, error } = await supabase
        .from("pilot_profiles")
        .select("*")
        .or(`name.ilike.%${term}%,email.ilike.%${term}%`)
        .limit(5)
      
      if (error) throw error
      
      setSearchResults(data || [])
    } catch (error) {
      console.error("Erro ao buscar pilotos:", error)
      toast.error("Erro ao buscar pilotos")
    } finally {
      setIsSearching(false)
    }
  }, 300)
  
  // Atualizar a busca quando o termo mudar
  useEffect(() => {
    debouncedSearch(searchTerm)
    
    // Cleanup
    return () => {
      debouncedSearch.cancel()
    }
  }, [searchTerm])
  
  // Resetar o estado quando o modal for fechado
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setSearchTerm("")
      setSearchResults([])
      setNewPilotName("")
      setNewPilotEmail("")
      setSelectedPilotId(null)
      setActiveTab("search")
    }
  }
  
  // Adicionar piloto existente à categoria
  const handleAddExistingPilot = async () => {
    if (!selectedPilotId) {
      toast.error("Selecione um piloto para adicionar à categoria")
      return
    }
    
    try {
      setIsLoading(true)
      
      // Verificar se o piloto já está na categoria
      const { data: existingPilot, error: checkError } = await supabase
        .from("category_pilots")
        .select("id")
        .eq("category_id", categoryId)
        .eq("pilot_id", selectedPilotId)
        .single()
      
      if (existingPilot) {
        toast.error("Este piloto já está registrado nesta categoria")
        setIsLoading(false)
        return
      }
      
      // Adicionar piloto à categoria
      const { error } = await supabase
        .from("category_pilots")
        .insert({
          category_id: categoryId,
          pilot_id: selectedPilotId
        })
      
      if (error) throw error
      
      toast.success("Piloto adicionado com sucesso")
      onSuccess()
      setIsOpen(false)
    } catch (error) {
      console.error("Erro ao adicionar piloto:", error)
      toast.error("Erro ao adicionar piloto à categoria")
    } finally {
      setIsLoading(false)
    }
  }
  
  // Criar novo piloto e adicionar à categoria
  const handleCreateAndAddPilot = async () => {
    if (!newPilotName || !newPilotEmail) {
      toast.error("Nome e e-mail são obrigatórios")
      return
    }
    
    try {
      setIsLoading(true)
      
      // Verificar se já existe um piloto com este e-mail
      const { data: existingPilots, error: checkError } = await supabase
        .from("pilot_profiles")
        .select("id")
        .eq("email", newPilotEmail)
      
      if (existingPilots && existingPilots.length > 0) {
        toast.error("Já existe um piloto com este e-mail")
        setIsLoading(false)
        return
      }
      
      // Usar a função check_email_and_create_pilot para criar o piloto
      // Esta função verificará se o e-mail pertence a um usuário existente
      const { data: pilotId, error: createError } = await supabase
        .rpc('check_email_and_create_pilot', {
          p_email: newPilotEmail,
          p_name: newPilotName
        })
      
      if (createError) throw createError
      
      // Adicionar piloto à categoria
      const { error: addError } = await supabase
        .from("category_pilots")
        .insert({
          category_id: categoryId,
          pilot_id: pilotId
        })
      
      if (addError) throw addError
      
      toast.success("Piloto criado e adicionado com sucesso")
      onSuccess()
      setIsOpen(false)
    } catch (error) {
      console.error("Erro ao criar e adicionar piloto:", error)
      toast.error("Erro ao criar piloto")
    } finally {
      setIsLoading(false)
    }
  }
  
  // Selecionar piloto da lista de resultados
  const handleSelectPilot = (pilotId: string) => {
    setSelectedPilotId(pilotId === selectedPilotId ? null : pilotId)
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          size="sm" 
          className="gap-1.5"
          disabled={hasReachedLimit}
          title={hasReachedLimit ? "Limite de pilotos atingido" : "Adicionar piloto"}
        >
          <Plus className="h-3.5 w-3.5" />
          Adicionar Piloto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Piloto à Categoria</DialogTitle>
          <DialogDescription>
            Busque um piloto existente ou crie um novo piloto para adicionar à categoria.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search">Buscar Piloto</TabsTrigger>
            <TabsTrigger value="create">Criar Novo</TabsTrigger>
          </TabsList>
          
          <TabsContent value="search" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar piloto por nome ou e-mail</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Digite para buscar..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              {isSearching && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}
              {!isSearching && searchResults.length > 0 && (
                <div className="mt-4 space-y-2 max-h-[240px] overflow-y-auto">
                  {searchResults.map((pilot) => (
                    <div 
                      key={pilot.id}
                      className={`flex items-center justify-between p-3 rounded-md ${
                        selectedPilotId === pilot.id 
                          ? "bg-primary/10 border border-primary/30" 
                          : "border border-border hover:bg-muted/30"
                      } cursor-pointer transition-colors`}
                      onClick={() => handleSelectPilot(pilot.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={pilot.avatar_url || undefined} alt={pilot.name} />
                          <AvatarFallback className="text-xs bg-primary/5">
                            {pilot.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{pilot.name}</p>
                          <p className="text-xs text-muted-foreground">{pilot.email}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {!isSearching && searchTerm.length >= 3 && searchResults.length === 0 && (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <p className="text-muted-foreground mb-2">Nenhum piloto encontrado</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setActiveTab("create")
                      setNewPilotEmail(searchTerm.includes('@') ? searchTerm : '')
                    }}
                  >
                    Criar novo piloto
                  </Button>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleAddExistingPilot} 
                disabled={!selectedPilotId || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  "Adicionar Piloto"
                )}
              </Button>
            </DialogFooter>
          </TabsContent>
          
          <TabsContent value="create" className="space-y-4 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    <span>Nome do Piloto</span>
                  </div>
                </Label>
                <Input
                  id="name"
                  placeholder="Nome completo"
                  value={newPilotName}
                  onChange={(e) => setNewPilotName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    <span>E-mail</span>
                  </div>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={newPilotEmail}
                  onChange={(e) => setNewPilotEmail(e.target.value)}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateAndAddPilot} 
                disabled={!newPilotName || !newPilotEmail || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar e Adicionar"
                )}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
} 