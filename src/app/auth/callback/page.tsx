'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { searchParams } = new URL(window.location.href)
      const code = searchParams.get('code')

      if (code) {
        try {
          await supabase.auth.exchangeCodeForSession(code)
          router.push('/pilot') // Redirect to the pilot dashboard after successful authentication
        } catch (error) {
          console.error('Error exchanging code for session:', error)
          router.push('/login?error=auth_callback_failed')
        }
      }
    }

    handleAuthCallback()
  }, [router, supabase])

  return (
    <div className="min-h-screen flex items-center justify-center" data-testid="loading-spinner">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
    </div>
  )
} 