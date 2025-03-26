import { createClient } from '@supabase/supabase-js'

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
        console.log("Criando bucket pilot-avatars...")
        const { error: bucketError } = await supabaseAdmin.storage.createBucket('pilot-avatars', {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif'],
          fileSizeLimit: 5242880 // 5MB
        })

        if (bucketError) {
          console.error('Erro ao criar bucket pilot-avatars:', bucketError)
        } else {
          console.log("Bucket pilot-avatars criado com sucesso!")
        }
      } else {
        console.log("Bucket pilot-avatars já existe")
      }
    } catch (error) {
      console.error('Erro ao verificar/criar bucket:', error)
    }

    // Check if league-logos bucket exists
    try {
      const { data: buckets } = await supabaseAdmin.storage.listBuckets()
      const leageLogosBucket = buckets?.find(bucket => bucket.name === 'league-logos')
      
      if (!leageLogosBucket) {
        console.log("Criando bucket league-logos...")
        const { error: bucketError } = await supabaseAdmin.storage.createBucket('league-logos', {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif'],
          fileSizeLimit: 5242880 // 5MB
        })

        if (bucketError) {
          console.error('Erro ao criar bucket league-logos:', bucketError)
        } else {
          console.log("Bucket league-logos criado com sucesso!")
        }
      } else {
        console.log("Bucket league-logos já existe")
      }
    } catch (error) {
      console.error('Erro ao verificar/criar bucket:', error)
    }

  } catch (error) {
    console.error('Erro ao inicializar schema:', error)
  }
} 