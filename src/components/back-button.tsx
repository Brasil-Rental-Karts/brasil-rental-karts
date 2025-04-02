"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface BackButtonProps {
  href: string
  label?: string
}

export function BackButton({ href, label = "Voltar" }: BackButtonProps) {
  return (
    <Button variant="ghost" size="sm" asChild className="gap-1">
      <Link href={href}>
        <ArrowLeft className="h-4 w-4" />
        {label}
      </Link>
    </Button>
  )
} 