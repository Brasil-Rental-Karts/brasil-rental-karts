"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreateLeagueModal } from "@/components/create-league-modal"
import { EditPilotModal } from "@/components/edit-pilot-modal"
import { Loader2, User, Trophy, Calendar, History, Plus } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface League {
  id: string
  name: string
  description: string
  created_at: string
}

interface PilotProfile {
  id: string
  name: string
  email: string
  phone: string
  bio: string
  avatar_url: string | null
}

export default function PilotPage() {
  const router = useRouter()
  const [leagues, setLeagues] = useState<League[]>([])
  const [pilot, setPilot] = useState<PilotProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  const fetchData = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error("Erro ao obter sessão:", sessionError)
        router.push("/login")
        return
      }
      
      if (!session?.user) {
        router.push("/login")
        return
      }

      console.log("Buscando perfil do piloto para o usuário:", session.user.id)
      // Fetch pilot profile
      const { data: pilotData, error: pilotError } = await supabase
        .from("pilot_profiles")
        .select("*")
        .eq("id", session.user.id)
        .single()

      if (pilotError) {
        console.error("Erro detalhado ao buscar perfil do piloto:", {
          code: pilotError.code,
          message: pilotError.message,
          details: pilotError.details,
          hint: pilotError.hint
        })
        
        // If the error is not "no rows returned", throw it
        if (pilotError.code !== "PGRST116") {
          throw pilotError
        }
      }

      // If no profile exists, create one with default values
      if (!pilotData) {
        console.log("Criando novo perfil para o piloto:", session.user.id)
        const { data: newPilot, error: createError } = await supabase
          .from("pilot_profiles")
          .insert({
            id: session.user.id,
            name: session.user.user_metadata?.name || "",
            email: session.user.email || "",
            phone: "",
            bio: "",
            avatar_url: session.user.user_metadata?.avatar_url || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (createError) {
          console.error("Erro detalhado ao criar perfil do piloto:", {
            code: createError.code,
            message: createError.message,
            details: createError.details,
            hint: createError.hint
          })
          throw createError
        }
        setPilot(newPilot)
      } else {
        setPilot(pilotData)
      }

      console.log("Buscando ligas do piloto...")
      // Fetch leagues
      const { data: leaguesData, error: leaguesError } = await supabase
        .from("leagues")
        .select("*")
        .eq("owner_id", session.user.id)
        .order("created_at", { ascending: false })

      if (leaguesError) {
        console.error("Erro detalhado ao buscar ligas:", {
          code: leaguesError.code,
          message: leaguesError.message,
          details: leaguesError.details,
          hint: leaguesError.hint
        })
        throw leaguesError
      }
      setLeagues(leaguesData || [])
    } catch (error) {
      console.error("Erro detalhado ao buscar dados:", {
        message: error instanceof Error ? error.message : "Erro desconhecido",
        error: error
      })
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!pilot) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Hero Section */}
      <div className="relative h-[300px] w-full">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center" 
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1560990816-bb30289c6611')"
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-secondary/90 z-10" />
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="text-center px-4">
            <div className="flex items-center justify-center mb-6">
              <Avatar className="h-24 w-24 border-4 border-white/20">
                <AvatarImage src={pilot.avatar_url || undefined} alt={pilot.name} />
                <AvatarFallback className="text-2xl">
                  {pilot.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {pilot.name}
            </h1>
            <p className="text-lg text-white/90">{pilot.email}</p>
            <div className="mt-4">
              <EditPilotModal pilot={pilot} onSuccess={fetchData} />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-12 bg-muted/40">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">Ligas Ativas</CardTitle>
                <Trophy className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{leagues.length}</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Ligas que você gerencia
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">Próxima Corrida</CardTitle>
                <Calendar className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">-</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Data da próxima competição
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">Corridas Realizadas</CardTitle>
                <History className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">0</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Total de corridas participadas
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Leagues Section */}
      <div className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold">Minhas Ligas</h2>
              <p className="text-muted-foreground mt-2">
                Gerencie suas ligas e acompanhe suas competições
              </p>
            </div>
            <CreateLeagueModal onSuccess={fetchData} />
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {leagues.map((league) => (
              <Card key={league.id} className="border-2 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <CardTitle className="text-xl">{league.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-6">{league.description}</p>
                  <Button
                    variant="outline"
                    className="w-full h-11 text-base"
                    onClick={() => router.push(`/league/${league.id}`)}
                  >
                    Ver Detalhes
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 