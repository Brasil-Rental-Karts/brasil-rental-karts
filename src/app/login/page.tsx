"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSignUp, setIsSignUp] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if the user just logged out
        const searchParams = new URLSearchParams(window.location.search);
        const fromLogout = searchParams.get('logout') === 'true';
        
        if (fromLogout) {
          // If coming from logout, don't redirect even if session exists
          // Session may still exist in memory but we want to force login screen
          return;
        }
        
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          router.push("/pilot")
        }
      } catch (error) {
        // Silently ignore session check errors
      }
    }
    checkAuth()
  }, [router, supabase.auth])

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })

        if (error) {
          if (error.message.includes("User already registered")) {
            setError("Este email já está cadastrado")
          } else {
            setError("Ocorreu um erro ao criar a conta. Tente novamente.")
          }
        } else {
          setError("Verifique seu email para confirmar sua conta")
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            setError("Email ou senha incorretos")
          } else if (error.message.includes("Email not confirmed")) {
            setError("Por favor, confirme seu email antes de fazer login")
          } else {
            setError("Ocorreu um erro ao fazer login. Tente novamente.")
          }
        } else {
          router.push("/pilot")
        }
      }
    } catch (error) {
      setError("Ocorreu um erro. Tente novamente.")
    } finally {
      setLoading(false)
    }
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
              {isSignUp ? "Criar conta" : "Bem-vindo de volta"}
            </h1>
            <p className="text-lg text-white/90 max-w-md mx-auto">
              {isSignUp
                ? "Preencha os dados abaixo para criar sua conta e começar sua jornada no kart rental"
                : "Faça login para acessar sua conta e continuar sua jornada no kart rental"}
            </p>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <Card className="border-2 shadow-lg">
            <CardContent className="pt-6">
              <form onSubmit={onSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    required
                    disabled={loading}
                    className="h-12 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-base">Senha</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    disabled={loading}
                    className="h-12 text-base"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-semibold" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {isSignUp ? "Criando conta..." : "Entrando..."}
                    </>
                  ) : (
                    isSignUp ? "Criar conta" : "Entrar"
                  )}
                </Button>

                <div className="text-center pt-4">
                  <button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-base text-primary hover:text-primary/80 transition-colors font-medium"
                    disabled={loading}
                  >
                    {isSignUp
                      ? "Já tem uma conta? Faça login"
                      : "Não tem uma conta? Criar conta"}
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 