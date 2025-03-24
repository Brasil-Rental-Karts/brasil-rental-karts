import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Flag, StepBack } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[30vh] flex items-center">
        <div className="absolute inset-0 bg-black/75 z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/60 to-secondary/70 z-20" />
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1560990816-bb30289c6611')" }}
        />
        <div className="container mx-auto px-4 z-30">
          <div className="max-w-2xl text-white">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Bandeira Vermelha! 404
            </h1>
            <p className="text-lg md:text-xl">
              Parece que você saiu da pista...
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="flex-1 py-16 bg-muted/40">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8 flex justify-center items-center">
              <div className="flex items-center gap-4">
                <Flag className="h-16 w-16 text-primary animate-wave" />
                <span className="text-8xl font-bold text-primary">404</span>
              </div>
            </div>
            
            <h2 className="text-2xl font-bold mb-4">
              Esta volta não foi computada!
            </h2>
            
            <p className="text-muted-foreground mb-8">
              A página que você está procurando pode ter sido removida, renomeada ou está temporariamente indisponível.
              Que tal voltar para a pista principal?
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild>
                <Link href="/" className="flex items-center gap-2">
                  <StepBack className="h-4 w-4" />
                  Voltar para a Pista
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

// Adicione estes estilos ao seu arquivo globals.css
/*
@keyframes wave {
  0%, 100% {
    transform: rotate(-10deg);
  }
  50% {
    transform: rotate(10deg);
  }
}

.animate-wave {
  animation: wave 2s ease-in-out infinite;
}
*/ 