"use client"

import { Button } from '@/components/ui/button'
import { StepBack } from 'lucide-react'

export default function BackButton() {
  const handleGoBack = () => {
    // Volta para a página anterior usando o histórico do navegador
    window.history.back()
  }

  return (
    <Button onClick={handleGoBack} className="flex items-center gap-2">
      <StepBack className="h-4 w-4" />
      Voltar para a Pista
    </Button>
  )
} 