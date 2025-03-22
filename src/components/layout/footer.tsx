import Link from "next/link"
import Image from "next/image"
import { Mail, MapPin, Instagram, Youtube, MessageCircle } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="bg-secondary text-secondary-foreground pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Logo e Sobre */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Image 
                src="/brk_logo.svg" 
                alt="Brasil Rental Karts Logo" 
                width={180} 
                height={40}
                className="h-8 w-auto"
              />
              <h2 className="text-lg font-semibold text-primary-foreground">Brasil Rental Karts</h2>
            </div>
            <p className="text-sm opacity-85 mt-2">
              A plataforma definitiva para organização e gestão de ligas de kart rental no Brasil.
            </p>
          </div>
          
          {/* Links Rápidos */}
          <div>
            <h3 className="text-primary font-semibold text-lg mb-4">Links Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm opacity-85 hover:opacity-100 hover:text-primary transition-colors">
                  Página Inicial
                </Link>
              </li>
              <li>
                <Link href="/cadastro" className="text-sm opacity-85 hover:opacity-100 hover:text-primary transition-colors">
                  Criar Conta
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Contato */}
          <div>
            <h3 className="text-primary font-semibold text-lg mb-4">Contato</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <Mail size={18} className="mt-0.5 flex-shrink-0 text-primary" />
                <span className="text-sm opacity-85">contato@brasilrentalkarts.com.br</span>
              </li>
              <li className="flex items-start gap-2">
                <MessageCircle size={18} className="mt-0.5 flex-shrink-0 text-primary" />
                <Link 
                  href="https://wa.me/5547999999999" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm opacity-85 hover:opacity-100 hover:text-primary transition-colors"
                >
                  (47) 99999-9999
                </Link>
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={18} className="mt-0.5 flex-shrink-0 text-primary" />
                <span className="text-sm opacity-85">Blumenau, SC</span>
              </li>
            </ul>
          </div>
          
          {/* Redes Sociais */}
          <div>
            <h3 className="text-primary font-semibold text-lg mb-4">Redes Sociais</h3>
            <p className="text-sm opacity-85 mb-4">
              Acompanhe nossas redes sociais para novidades do mundo do kart rental.
            </p>
            <div className="flex gap-6 mt-2">
              <Link 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary-foreground/10 hover:bg-primary/20 text-secondary-foreground hover:text-primary transition-all"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </Link>
              <Link 
                href="https://youtube.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary-foreground/10 hover:bg-primary/20 text-secondary-foreground hover:text-primary transition-all"
                aria-label="YouTube"
              >
                <Youtube size={20} />
              </Link>
              <Link 
                href="https://x.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary-foreground/10 hover:bg-primary/20 text-secondary-foreground hover:text-primary transition-all"
                aria-label="X (Twitter)"
              >
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="currentColor" 
                  stroke="none"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Linha divisória */}
        <div className="border-t border-secondary-foreground/20 my-6"></div>
        
        {/* Copyright e links legais */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs opacity-75">
            © {currentYear} Brasil Rental Karts. Todos os direitos reservados.
          </p>
          <div className="flex gap-6">
            <Link href="/termos" className="text-xs opacity-75 hover:opacity-100 hover:text-primary transition-colors">
              Termos de Uso
            </Link>
            <Link href="/privacidade" className="text-xs opacity-75 hover:opacity-100 hover:text-primary transition-colors">
              Política de Privacidade
            </Link>
            <Link href="/cookies" className="text-xs opacity-75 hover:opacity-100 hover:text-primary transition-colors">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
} 