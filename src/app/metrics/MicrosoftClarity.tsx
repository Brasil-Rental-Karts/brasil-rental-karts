'use client'

import { useEffect } from 'react'
import Clarity from '@microsoft/clarity'

const MicrosoftClarity = () => {
    useEffect(() => {
        // Verificar se estamos em produção para evitar rastreamento em ambiente de desenvolvimento
        if (process.env.NODE_ENV !== 'production') {
            return
        }

        const clarityId = process.env.NEXT_PUBLIC_MICROSOFT_CLARITY

        // Se não houver ID do Clarity configurado, não inicializar
        if (!clarityId) {
            console.warn('Microsoft Clarity ID não configurado. Adicione NEXT_PUBLIC_MICROSOFT_CLARITY ao seu .env.local')
            return
        }

        // Inicializar o Clarity com o ID do projeto
        try {
            Clarity.init(clarityId)
            
            // Evento personalizado para marcar que o Clarity foi inicializado
            Clarity.event('clarity_initialized')
            
            // Opcionalmente, adicione uma tag para identificar a versão do site
            Clarity.setTag('app_version', process.env.NEXT_PUBLIC_APP_VERSION || 'development')
        } catch (error) {
            console.error('Erro ao inicializar o Microsoft Clarity:', error)
        }

        // Não há método para limpar o Clarity na API oficial
        // Se for necessário desabilitar o Clarity em tempo de execução, 
        // pode-se usar Clarity.consent(false) em outro componente
    }, [])

    // Este componente não renderiza nada visualmente
    return null
}

export default MicrosoftClarity 