CREATE TABLE IF NOT EXISTS pilot_profiles (
    id UUID PRIMARY KEY,
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

-- Create championships table
CREATE TABLE IF NOT EXISTS championships (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    start_date DATE,
    end_date DATE,
    status TEXT CHECK (status IN ('upcoming', 'active', 'completed')) DEFAULT 'upcoming',
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on championships
ALTER TABLE championships ENABLE ROW LEVEL SECURITY;

-- Create policies for championships
CREATE POLICY "Anyone can view championships"
    ON championships FOR SELECT
    USING (true);

CREATE POLICY "League owners can manage championships"
    ON championships FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT owner_id FROM leagues WHERE id = league_id
        )
    );

CREATE POLICY "League owners can update championships"
    ON championships FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT owner_id FROM leagues WHERE id = league_id
        )
    );

CREATE POLICY "League owners can delete championships"
    ON championships FOR DELETE
    USING (
        auth.uid() IN (
            SELECT owner_id FROM leagues WHERE id = league_id
        )
    );

-- Create trigger for updating updated_at for championships
CREATE TRIGGER update_championships_updated_at
    BEFORE UPDATE ON championships
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Now create categories linked to championships instead of leagues
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    championship_id UUID NOT NULL REFERENCES championships(id) ON DELETE CASCADE,
    max_pilots INTEGER,
    ballast_kg DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create policies for categories
CREATE POLICY "Anyone can view categories"
    ON categories FOR SELECT
    USING (true);

CREATE POLICY "League owners can manage categories"
    ON categories FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT l.owner_id FROM leagues l
            JOIN championships c ON c.league_id = l.id
            WHERE c.id = championship_id
        )
    );

CREATE POLICY "League owners can update categories"
    ON categories FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT l.owner_id FROM leagues l
            JOIN championships c ON c.league_id = l.id
            WHERE c.id = championship_id
        )
    );

CREATE POLICY "League owners can delete categories"
    ON categories FOR DELETE
    USING (
        auth.uid() IN (
            SELECT l.owner_id FROM leagues l
            JOIN championships c ON c.league_id = l.id
            WHERE c.id = championship_id
        )
    );

-- Create trigger for updating updated_at
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS category_pilots (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    pilot_id UUID NOT NULL REFERENCES pilot_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(category_id, pilot_id)
);

-- Enable RLS on category_pilots
ALTER TABLE category_pilots ENABLE ROW LEVEL SECURITY;

-- Create policies for category_pilots
CREATE POLICY "Anyone can view category_pilots"
    ON category_pilots FOR SELECT
    USING (true);
    
CREATE POLICY "League owners can manage category pilots"
    ON category_pilots FOR ALL
    USING (
        auth.uid() IN (
            SELECT l.owner_id FROM leagues l
            JOIN championships champ ON champ.league_id = l.id
            JOIN categories cat ON cat.championship_id = champ.id
            WHERE cat.id = category_id
        )
);

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

-- Set up storage policies for championship-logos bucket
CREATE POLICY "Championship logos are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'championship-logos');

CREATE POLICY "Users can upload championship logos to their own folder"
    ON storage.objects FOR INSERT
    WITH CHECK (
    bucket_id = 'championship-logos' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can update championship logos in their own folder"
    ON storage.objects FOR UPDATE
    USING (
    bucket_id = 'championship-logos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete championship logos from their own folder"
    ON storage.objects FOR DELETE
    USING (
    bucket_id = 'championship-logos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Drop statements for old tables (to be run separately when migrating data)
-- DROP TABLE IF EXISTS category_pilots;
-- DROP TABLE IF EXISTS categories;
