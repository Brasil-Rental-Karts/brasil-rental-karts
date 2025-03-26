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
    try {
      await supabaseAdmin.from('pilot_profiles').select('id').limit(1)
      console.log("Tabela pilot_profiles já existe")
    } catch {
      console.log("Criando tabela pilot_profiles...")
      const { error: pilotProfilesError } = await supabaseAdmin.rpc('exec_sql', {
        sql: `
          -- Create pilot_profiles table
          CREATE TABLE IF NOT EXISTS pilot_profiles (
              id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
              name TEXT NOT NULL,
              email TEXT NOT NULL,
              phone TEXT,
              bio TEXT,
              avatar_url TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
          );

          -- Enable RLS on pilot_profiles
          ALTER TABLE pilot_profiles ENABLE ROW LEVEL SECURITY;

          -- Create policies for pilot_profiles
          CREATE POLICY "Users can view their own profile"
              ON pilot_profiles FOR SELECT
              USING (auth.uid() = id);

          CREATE POLICY "Users can update their own profile"
              ON pilot_profiles FOR UPDATE
              USING (auth.uid() = id);

          CREATE POLICY "Users can insert their own profile"
              ON pilot_profiles FOR INSERT
              WITH CHECK (auth.uid() = id);

          -- Create trigger for updating updated_at
          CREATE OR REPLACE FUNCTION update_updated_at_column()
          RETURNS TRIGGER AS $$
          BEGIN
              NEW.updated_at = timezone('utc'::text, now());
              RETURN NEW;
          END;
          $$ language 'plpgsql';

          CREATE TRIGGER update_pilot_profiles_updated_at
              BEFORE UPDATE ON pilot_profiles
              FOR EACH ROW
              EXECUTE FUNCTION update_updated_at_column();

          -- Function to handle user creation
          CREATE OR REPLACE FUNCTION public.handle_new_user()
          RETURNS trigger AS $$
          BEGIN
              INSERT INTO public.pilot_profiles (id, name, email)
              VALUES (
                  NEW.id,
                  COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
                  NEW.email
              );
              RETURN NEW;
          END;
          $$ language plpgsql security definer;

          -- Trigger for new user creation
          DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
          CREATE TRIGGER on_auth_user_created
              AFTER INSERT ON auth.users
              FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
        `
      })

      if (pilotProfilesError) {
        console.error('Erro ao criar tabela pilot_profiles:', pilotProfilesError)
      } else {
        console.log("Tabela pilot_profiles criada com sucesso!")
      }
    }

    // Check if leagues table exists
    try {
      await supabaseAdmin.from('leagues').select('id').limit(1)
      console.log("Tabela leagues já existe")
    } catch {
      console.log("Criando tabela leagues...")
      console.log("A tabela leagues não existe. Execute o seguinte SQL no painel do Supabase para criá-la:")
      console.log(`
        -- Create leagues table
        CREATE TABLE IF NOT EXISTS leagues (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            owner_id UUID NOT NULL REFERENCES auth.users(id),
            logo_url TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            UNIQUE(name)
        );

        -- Enable RLS on leagues
        ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;

        -- Create policies for leagues
        CREATE POLICY "Anyone can view leagues"
            ON leagues FOR SELECT
            USING (true);

        CREATE POLICY "Authenticated users can create leagues"
            ON leagues FOR INSERT
            WITH CHECK (auth.role() = 'authenticated');

        CREATE POLICY "League owners can update their leagues"
            ON leagues FOR UPDATE
            USING (auth.uid() = owner_id);

        CREATE POLICY "League owners can delete their leagues"
            ON leagues FOR DELETE
            USING (auth.uid() = owner_id);

        -- Create trigger for updating updated_at
        CREATE TRIGGER update_leagues_updated_at
            BEFORE UPDATE ON leagues
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
      `)

      console.log("Você pode executar este SQL no painel do Supabase ou criar manualmente a tabela. Em seguida, reinicie a aplicação.")
    }

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

          // Create storage policies
          const { error: policiesError } = await supabaseAdmin.rpc('exec_sql', {
            sql: `
              -- Set up storage policies for pilot-avatars bucket
              CREATE POLICY "Avatar images are publicly accessible"
                  ON storage.objects FOR SELECT
                  USING (bucket_id = 'pilot-avatars');

              CREATE POLICY "Users can upload avatar to their own folder"
                  ON storage.objects FOR INSERT
                  WITH CHECK (
                      bucket_id = 'pilot-avatars' 
                      AND auth.role() = 'authenticated'
                      AND (storage.foldername(name))[1] = auth.uid()::text
                  );

              CREATE POLICY "Users can update avatar in their own folder"
                  ON storage.objects FOR UPDATE
                  USING (
                      bucket_id = 'pilot-avatars'
                      AND auth.role() = 'authenticated'
                      AND (storage.foldername(name))[1] = auth.uid()::text
                  );

              CREATE POLICY "Users can delete avatar from their own folder"
                  ON storage.objects FOR DELETE
                  USING (
                      bucket_id = 'pilot-avatars'
                      AND auth.role() = 'authenticated'
                      AND (storage.foldername(name))[1] = auth.uid()::text
                  );
            `
          })

          if (policiesError) {
            console.error('Erro ao criar políticas do bucket:', policiesError)
          } else {
            console.log("Políticas do bucket criadas com sucesso!")
          }
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

          console.log("Para criar as políticas do bucket league-logos, execute as seguintes comandos SQL no painel do Supabase:")
          console.log(`
            -- Set up storage policies for league-logos bucket
            CREATE POLICY "League logos are publicly accessible"
              ON storage.objects FOR SELECT
              USING (bucket_id = 'league-logos');

            CREATE POLICY "Users can upload league logos to their own folder"
              ON storage.objects FOR INSERT
              WITH CHECK (
                bucket_id = 'league-logos' 
                AND auth.role() = 'authenticated'
                AND (storage.foldername(name))[1] = auth.uid()::text
              );

            CREATE POLICY "Users can update league logos in their own folder"
              ON storage.objects FOR UPDATE
              USING (
                bucket_id = 'league-logos'
                AND auth.role() = 'authenticated'
                AND (storage.foldername(name))[1] = auth.uid()::text
              );

            CREATE POLICY "Users can delete league logos from their own folder"
              ON storage.objects FOR DELETE
              USING (
                bucket_id = 'league-logos'
                AND auth.role() = 'authenticated'
                AND (storage.foldername(name))[1] = auth.uid()::text
              );
          `);
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