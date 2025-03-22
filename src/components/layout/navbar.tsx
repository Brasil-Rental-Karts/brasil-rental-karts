"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"

const routes = [
  {
    label: "Início",
    href: "/",
  },
]

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="fixed top-0 w-full z-50 bg-background border-b">
      <div className="px-4 sm:px-6 lg:px-8 flex h-16 items-center">
        <div className="flex items-center">
          <Link href="/" className="flex gap-x-2 items-center">
            <div className="hidden md:block">
              <Image 
                src="/brk_logo.svg" 
                alt="Brasil Rental Karts Logo" 
                width={180} 
                height={40}
                className="h-8 w-auto"
              />
            </div>
            <div className="block md:hidden">
              <Image 
                src="/brk_logo.svg" 
                alt="BRK Logo" 
                width={80} 
                height={30}
                className="h-7 w-auto"
              />
            </div>
          </Link>
        </div>
        <div className="ml-auto flex gap-x-2 items-center">
          <div className="hidden md:flex items-center gap-x-4">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === route.href
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                {route.label}
              </Link>
            ))}
          </div>
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Menu">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col gap-4 mt-8">
                  {routes.map((route) => (
                    <Link
                      key={route.href}
                      href={route.href}
                      className={cn(
                        "text-sm font-medium transition-colors hover:text-primary p-2",
                        pathname === route.href
                          ? "text-primary bg-accent/50 rounded-md"
                          : "text-muted-foreground"
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      {route.label}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
          <Button variant="default" size="sm" className="ml-4">
            Criar Conta
          </Button>
        </div>
      </div>
    </div>
  )
} 