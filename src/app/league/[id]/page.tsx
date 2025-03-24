"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Medal, Calendar, History, Users, BarChart, Plus, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { use } from "react"
import { Loader2 } from "lucide-react"

interface League {
  id: string
  name: string
  description: string
  created_at: string
}

export default function LeagueDashboard({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [league, setLeague] = useState<League | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()
  const { id } = use(params)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          router.push("/login")
          return
        }

        const { data: leagueData, error } = await supabase
          .from("leagues")
          .select("*")
          .eq("id", id)
          .single()

        if (error) throw error
        setLeague(leagueData)
      } catch (error) {
        console.error("Erro ao buscar liga:", error)
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [id, router, supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!league) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Liga não encontrada</h1>
        <Button onClick={() => router.push("/pilot")}>
          Voltar para Minhas Ligas
        </Button>
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
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {league.name}
            </h1>
            <p className="text-lg text-white/90 max-w-2xl mx-auto">
              {league.description}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-12 bg-muted/40">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">Campeonatos Ativos</CardTitle>
                <Trophy className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">0</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Campeonatos em andamento
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">Total de Pilotos</CardTitle>
                <Users className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">0</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Pilotos registrados
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
                  Data do próximo evento
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Actions Section */}
      <div className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold">Ações Rápidas</h2>
              <p className="text-muted-foreground mt-2">
                Gerencie sua liga e acompanhe as competições
              </p>
            </div>
            <Button variant="outline" onClick={() => router.push("/pilot")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl">Campeonatos</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Crie e gerencie campeonatos para sua liga
                </p>
                <Button
                  className="w-full h-11 text-base"
                  onClick={() => router.push(`/league/${id}/championships`)}
                >
                  Gerenciar Campeonatos
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl">Estatísticas</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Acompanhe as estatísticas e desempenho da liga
                </p>
                <Button
                  variant="outline"
                  className="w-full h-11 text-base"
                  onClick={() => router.push(`/league/${id}/stats`)}
                >
                  Ver Estatísticas
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Medal className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl">Rankings</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Visualize as classificações e rankings dos pilotos
                </p>
                <Button
                  variant="outline"
                  className="w-full h-11 text-base"
                  onClick={() => router.push(`/league/${id}/rankings`)}
                >
                  Ver Rankings
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 