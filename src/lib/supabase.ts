import { createClient } from '@supabase/supabase-js'
import logger from '@/lib/logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

// Create Supabase client with anonymous key for client-side operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Create Supabase admin client with service key for server-side operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey)

// Initialize database schema
export async function initializeSchema() {
  try {
    // Check if pilot_profiles table exists


    // Check if pilot-avatars bucket exists
    try {
      const { data: buckets } = await supabaseAdmin.storage.listBuckets()
      const pilotAvatarsBucket = buckets?.find(bucket => bucket.name === 'pilot-avatars')
      
      if (!pilotAvatarsBucket) {
        const { error: bucketError } = await supabaseAdmin.storage.createBucket('pilot-avatars', {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif'],
          fileSizeLimit: 5242880 // 5MB
        })

        if (bucketError) {
          logger.error('Storage', `Falha ao criar bucket pilot-avatars: ${bucketError.message}`)
        }
      }
    } catch (error) {
      logger.error('Storage', `Falha ao verificar/criar bucket pilot-avatars`, 
        { erro: error instanceof Error ? error.message : String(error) })
    }

    // Check if league-logos bucket exists
    try {
      const { data: buckets } = await supabaseAdmin.storage.listBuckets()
      const leageLogosBucket = buckets?.find(bucket => bucket.name === 'league-logos')
      
      if (!leageLogosBucket) {
        const { error: bucketError } = await supabaseAdmin.storage.createBucket('league-logos', {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif'],
          fileSizeLimit: 5242880 // 5MB
        })

        if (bucketError) {
          logger.error('Storage', `Falha ao criar bucket league-logos: ${bucketError.message}`)
        }
      }
    } catch (error) {
      logger.error('Storage', `Falha ao verificar/criar bucket league-logos`, 
        { erro: error instanceof Error ? error.message : String(error) })
    }

  } catch (error) {
    logger.error('Database', `Falha ao inicializar schema`, 
      { erro: error instanceof Error ? error.message : String(error) })
  }
} 