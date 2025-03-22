'use client'

import Script from "next/script"

const MicrosoftClarity = () => {
    // Verificar se estamos em produção para evitar rastreamento em ambiente de desenvolvimento
    if (process.env.NODE_ENV !== 'production') {
        return null
    }

    const clarityId = process.env.NEXT_PUBLIC_MICROSOFT_CLARITY

    // Se não houver ID do Clarity configurado, não renderizar o script
    if (!clarityId) {
        console.warn('Microsoft Clarity ID não configurado. Adicione NEXT_PUBLIC_MICROSOFT_CLARITY ao seu .env.local')
        return null
    }

    return (
        <Script
            id="microsoft-clarity-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
                __html: `
                (function(c,l,a,r,i,t,y){
                    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                })(window, document, "clarity", "script", "${clarityId}");
                `,
            }}
        />
    )
}

export default MicrosoftClarity 