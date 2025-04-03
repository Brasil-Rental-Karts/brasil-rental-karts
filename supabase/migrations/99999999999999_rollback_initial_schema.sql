-- Rollback Migration: Drop everything created in the initial schema

-- Drop storage policies
DROP POLICY IF EXISTS "League owners can manage championship logos" ON storage.objects;
DROP POLICY IF EXISTS "Championship logos are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "League owners can manage league logos" ON storage.objects;
DROP POLICY IF EXISTS "League logos are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can update avatar in their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload avatar to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

-- First delete objects in storage buckets to avoid foreign key constraint violation
DELETE FROM storage.objects WHERE bucket_id IN ('pilot-avatars', 'league-logos', 'championship-logos');

-- Then drop storage buckets
DELETE FROM storage.buckets WHERE id IN ('pilot-avatars', 'league-logos', 'championship-logos');

-- Drop trigger for scoring_systems
DROP TRIGGER IF EXISTS update_scoring_systems_updated_at ON scoring_systems;

-- Drop scoring_systems table
DROP TABLE IF EXISTS scoring_systems CASCADE;

-- Drop race_results indexes and table
DROP INDEX IF EXISTS idx_race_results_heat_number;
DROP INDEX IF EXISTS idx_race_results_category_id;
DROP INDEX IF EXISTS idx_race_results_pilot_id;
DROP INDEX IF EXISTS idx_race_results_race_id;
DROP TABLE IF EXISTS race_results CASCADE;

-- Drop races trigger and table
DROP TRIGGER IF EXISTS set_updated_at_races ON races;
DROP POLICY IF EXISTS "League owners and admins can manage races" ON races;
DROP POLICY IF EXISTS "Anyone can read races" ON races;
DROP TABLE IF EXISTS races CASCADE;

-- Drop league_admins trigger and table
DROP TRIGGER IF EXISTS set_updated_at_league_admins ON league_admins;
DROP POLICY IF EXISTS "League owners can manage admins" ON league_admins;
DROP POLICY IF EXISTS "Anyone can read league_admins" ON league_admins;
DROP TABLE IF EXISTS league_admins CASCADE;

-- Drop category_pilots table
DROP POLICY IF EXISTS "League owners can manage category pilots" ON category_pilots;
DROP POLICY IF EXISTS "Anyone can view category_pilots" ON category_pilots;
DROP TABLE IF EXISTS category_pilots CASCADE;

-- Drop categories trigger and table
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
DROP POLICY IF EXISTS "League owners can manage categories" ON categories;
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
DROP TABLE IF EXISTS categories CASCADE;

-- Drop championships trigger and table
DROP TRIGGER IF EXISTS update_championships_updated_at ON championships;
DROP POLICY IF EXISTS "League owners can delete championships" ON championships;
DROP POLICY IF EXISTS "League owners can update championships" ON championships;
DROP POLICY IF EXISTS "League owners can manage championships" ON championships;
DROP POLICY IF EXISTS "Anyone can view championships" ON championships;
DROP TABLE IF EXISTS championships CASCADE;

-- Drop leagues trigger and table
DROP TRIGGER IF EXISTS update_leagues_updated_at ON leagues;
DROP POLICY IF EXISTS "League owners can delete their leagues" ON leagues;
DROP POLICY IF EXISTS "League owners can update their leagues" ON leagues;
DROP POLICY IF EXISTS "Authenticated users can create leagues" ON leagues;
DROP POLICY IF EXISTS "Anyone can view leagues" ON leagues;
DROP TABLE IF EXISTS leagues CASCADE;

-- Drop user creation trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop pilot_profiles trigger and table
DROP TRIGGER IF EXISTS update_pilot_profiles_updated_at ON pilot_profiles;
DROP POLICY IF EXISTS "Pilotos podem inserir seus próprios perfis" ON pilot_profiles;
DROP POLICY IF EXISTS "Pilotos podem atualizar seus próprios perfis" ON pilot_profiles;
DROP POLICY IF EXISTS "Qualquer um pode ver perfis de pilotos" ON pilot_profiles;
DROP TABLE IF EXISTS pilot_profiles CASCADE;

-- Drop updated_at function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop extensions
DROP EXTENSION IF EXISTS "uuid-ossp"; 