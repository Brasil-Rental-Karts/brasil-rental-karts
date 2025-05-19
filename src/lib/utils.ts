import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | null) {
  if (!date) return ""
  
  try {
    const parsedDate = typeof date === "string" ? parseISO(date) : date
    return format(parsedDate, "dd/MM/yyyy", { locale: ptBR })
  } catch (error) {
    console.error("Erro ao formatar data:", error)
    return ""
  }
}
