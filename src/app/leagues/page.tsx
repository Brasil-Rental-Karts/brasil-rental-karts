"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Loader2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface League {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  created_at: string;
}

export default function LeaguesPage() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchLeagues() {
      try {
        const { data, error } = await supabase
          .from("leagues")
          .select("id, name, description, logo_url, created_at")
          .order("name");

        if (error) {
          console.error("Error fetching leagues:", error);
          return;
        }

        setLeagues(data || []);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchLeagues();
  }, [supabase]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="relative h-[250px] w-full mb-10 rounded-lg overflow-hidden">
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
              Ligas de Kart Rental
            </h1>
            <p className="text-lg text-white/90 max-w-md mx-auto">
              Conheça todas as ligas cadastradas na plataforma e acompanhe os campeonatos
            </p>
          </div>
        </div>
      </div>

      {/* Leagues Grid */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6">Todas as Ligas</h2>
        
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : leagues.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {leagues.map((league) => (
              <Link href={`/leagues/${league.id}`} key={league.id} className="transition-transform hover:scale-105">
                <Card className="h-full flex flex-col overflow-hidden border-2 hover:border-primary">
                  <div className="h-[160px] relative bg-muted">
                    {league.logo_url ? (
                      <img
                        src={league.logo_url}
                        alt={league.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-secondary/10">
                        <span className="text-2xl font-bold text-secondary/50">
                          {league.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="line-clamp-1">{league.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {league.description || "Sem descrição disponível"}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">Nenhuma liga encontrada</p>
          </div>
        )}
      </div>
    </div>
  );
} 