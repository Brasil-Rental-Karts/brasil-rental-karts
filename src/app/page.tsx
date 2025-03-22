import Link from "next/link";
import { Trophy, UserRound, Users, Medal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[70vh] flex items-center">
        <div className="absolute inset-0 bg-black/75 z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/60 to-secondary/70 z-20" />
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1560990816-bb30289c6611')" }}
        />
        <div className="container mx-auto px-4 z-30">
          <div className="max-w-2xl text-white">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              A Plataforma Definitiva para Ligas de Kart Rental
            </h1>
            <p className="text-lg md:text-xl mb-8">
              Gerenciamento completo de competições, cadastro de pilotos e acompanhamento de resultados para ligas de kart rental.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild>
                <Link href="/ligas">Criar Liga</Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-white/15 border-white text-white hover:bg-white hover:text-primary font-semibold">
                <Link href="/pilotos">Perfil de Piloto</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/40">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Por que usar a Brasil Rental Karts?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Todas as ferramentas que sua liga rental precisa para gerenciar competições de kart de forma profissional.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="mb-4 flex justify-center">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-center">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* For Leagues and Pilots */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Para Ligas e Pilotos</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Soluções completas para organizadores de competições e pilotos de kart rental.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {solutions.map((solution, index) => (
              <Card key={index} className="overflow-hidden">
                <div className="h-48 relative">
                  <div 
                    className="absolute inset-0 bg-cover bg-center filter grayscale"
                    style={{ backgroundImage: `url(${solution.image})` }}
                  />
                </div>
                <CardHeader>
                  <div className="flex items-center">
                    {solution.icon}
                    <CardTitle>{solution.name}</CardTitle>
                  </div>
                  <CardDescription>{solution.category}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{solution.description}</p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">Saiba Mais</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Pronto para transformar sua liga?</h2>
          <p className="mb-8 max-w-xl mx-auto">
            Crie uma conta e comece a gerenciar suas competições de kart com ferramentas profissionais.
          </p>
          <Button size="lg" variant="secondary" className="hover:bg-accent hover:text-white" asChild>
            <Link href="/cadastro">Criar Conta</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

// Mock data
const features = [
  {
    title: "Gestão de Competições",
    description: "Sistema completo para criação e gerenciamento de campeonatos, com tabelas de classificação, pontuação automática e calendário.",
    icon: <Trophy className="h-12 w-12 p-2.5 rounded-full bg-primary/15 text-primary" />,
  },
  {
    title: "Perfis de Pilotos",
    description: "Cadastro de pilotos com histórico de resultados, estatísticas de desempenho e ranking na comunidade de kart rental.",
    icon: <UserRound className="h-12 w-12 p-2.5 rounded-full bg-primary/15 text-primary" />,
  },
  {
    title: "Comunidade Conectada",
    description: "Conecte-se com outras ligas e pilotos, compartilhe resultados e descubra novos campeonatos para participar.",
    icon: <Users className="h-12 w-12 p-2.5 rounded-full bg-primary/15 text-primary" />,
  },
];

const solutions = [
  {
    name: "Para Organizadores de Ligas",
    category: "Gestão de Competições",
    description: "Ferramentas para criar campeonatos, gerenciar inscrições, controlar pontuações, registrar resultados e publicar classificações.",
    image: "https://images.unsplash.com/photo-1728487804388-14d27f388fd4",
    icon: <Trophy className="h-6 w-6 text-primary mr-2" />,
  },
  {
    name: "Para Pilotos",
    category: "Perfil e Participação",
    description: "Crie seu perfil, acompanhe seu histórico de corridas, encontre competições para participar e conecte-se com outros pilotos.",
    image: "https://images.unsplash.com/photo-1594121645044-99fdeb12412e",
    icon: <Medal className="h-6 w-6 text-primary mr-2" />,
  },
];
