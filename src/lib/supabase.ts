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
    // Create leagues table if it doesn't exist
    const { error: leaguesError } = await supabaseAdmin.rpc('create_leagues_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS leagues (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          owner_id UUID NOT NULL REFERENCES auth.users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          UNIQUE(name)
        );
      `
    })

    if (leaguesError) {
      console.error('Error creating leagues table:', leaguesError)
    }
  } catch (error) {
    console.error('Error initializing schema:', error)
  }
} 