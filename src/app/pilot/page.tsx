"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreateLeagueModal } from "@/components/create-league-modal"
import { Loader2, User, Trophy, Calendar, History, Plus } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface League {
  id: string
  name: string
  description: string
  created_at: string
}

interface UserProfile {
  id: string
  email: string
  user_metadata: {
    name?: string
    avatar_url?: string
  }
}

export default function PilotPage() {
  const router = useRouter()
  const [leagues, setLeagues] = useState<League[]>([])
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        router.push("/login")
        return
      }

      const userProfile: UserProfile = {
        id: session.user.id,
        email: session.user.email || "",
        user_metadata: session.user.user_metadata || {}
      }
      setUser(userProfile)

      const { data: leaguesData, error } = await supabase
        .from("leagues")
        .select("*")
        .eq("owner_id", session.user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setLeagues(leaguesData || [])
    } catch (error) {
      console.error("Erro ao buscar dados:", error)
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
                <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.user_metadata?.name} />
                <AvatarFallback className="text-2xl">
                  {user?.user_metadata?.name?.charAt(0) || user?.email?.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {user?.user_metadata?.name || "Piloto"}
            </h1>
            <p className="text-lg text-white/90">{user?.email}</p>
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