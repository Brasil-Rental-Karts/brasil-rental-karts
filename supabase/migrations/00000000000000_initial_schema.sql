-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar função para atualizar o updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar tabela de perfis de pilotos
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

-- Habilitar RLS na tabela pilot_profiles
ALTER TABLE pilot_profiles ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para pilot_profiles
CREATE POLICY "Qualquer um pode ver perfis de pilotos"
    ON pilot_profiles FOR SELECT
    USING (true);

CREATE POLICY "Pilotos podem atualizar seus próprios perfis"
    ON pilot_profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Pilotos podem inserir seus próprios perfis"
    ON pilot_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Criar trigger para atualizar updated_at em pilot_profiles
CREATE TRIGGER update_pilot_profiles_updated_at
    BEFORE UPDATE ON pilot_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Criar função para criar perfil automaticamente após signup
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

-- Criar trigger para novo usuário
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Criar tabela de ligas
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

-- Habilitar RLS na tabela leagues
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para leagues
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

-- Criar trigger para atualizar updated_at em leagues
CREATE TRIGGER update_leagues_updated_at
    BEFORE UPDATE ON leagues
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Criar tabela de sistemas de pontuação
CREATE TABLE IF NOT EXISTS scoring_systems (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    points JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS na tabela scoring_systems
ALTER TABLE scoring_systems ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para scoring_systems
CREATE POLICY "Anyone can view scoring systems"
    ON scoring_systems FOR SELECT
    USING (true);

CREATE POLICY "League owners can manage scoring systems"
    ON scoring_systems FOR ALL
    USING (
        auth.uid() IN (
            SELECT owner_id FROM leagues
        )
    );

-- Trigger para atualizar o campo updated_at
CREATE TRIGGER update_scoring_systems_updated_at
    BEFORE UPDATE ON scoring_systems
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Criar tabela de campeonatos
CREATE TABLE IF NOT EXISTS championships (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    start_date DATE,
    end_date DATE,
    status TEXT CHECK (status IN ('upcoming', 'active', 'completed')) DEFAULT 'upcoming',
    logo_url TEXT,
    scoring_system_id UUID REFERENCES scoring_systems(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS na tabela championships
ALTER TABLE championships ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para championships
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

-- Criar trigger para atualizar updated_at em championships
CREATE TRIGGER update_championships_updated_at
    BEFORE UPDATE ON championships
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Criar tabela de categorias
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

-- Habilitar RLS na tabela categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para categories
CREATE POLICY "Anyone can view categories"
    ON categories FOR SELECT
    USING (true);

CREATE POLICY "League owners can manage categories"
    ON categories FOR ALL
    USING (
        auth.uid() IN (
            SELECT l.owner_id FROM leagues l
            JOIN championships c ON c.league_id = l.id
            WHERE c.id = championship_id
        )
    );

-- Criar trigger para atualizar updated_at em categories
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Criar tabela de pilotos por categoria
CREATE TABLE IF NOT EXISTS category_pilots (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    pilot_id UUID NOT NULL REFERENCES pilot_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(category_id, pilot_id)
);

-- Habilitar RLS na tabela category_pilots
ALTER TABLE category_pilots ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para category_pilots
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

-- Criar tabela de administradores de ligas
CREATE TABLE IF NOT EXISTS league_admins (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(league_id, user_id)
);

-- Habilitar RLS na tabela league_admins
ALTER TABLE league_admins ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para league_admins
CREATE POLICY "Anyone can read league_admins"
    ON league_admins FOR SELECT
    USING (true);

CREATE POLICY "League owners can manage admins"
    ON league_admins FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM leagues l
            WHERE l.id = league_id
            AND l.owner_id = auth.uid()
        )
    );

-- Criar trigger para atualizar updated_at em league_admins
CREATE TRIGGER set_updated_at_league_admins
    BEFORE UPDATE ON league_admins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Criar tabela de etapas
CREATE TABLE IF NOT EXISTS races (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    championship_id UUID NOT NULL REFERENCES championships(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    date TIMESTAMP WITH TIME ZONE,
    location VARCHAR(255),
    track_layout VARCHAR(255),
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS na tabela races
ALTER TABLE races ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para races
CREATE POLICY "Anyone can read races"
    ON races FOR SELECT
    USING (true);

CREATE POLICY "League owners and admins can manage races"
    ON races FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM championships c
            JOIN leagues l ON c.league_id = l.id
            LEFT JOIN league_admins la ON la.league_id = l.id
            WHERE c.id = championship_id
            AND (l.owner_id = auth.uid() OR la.user_id = auth.uid())
        )
    );

-- Criar trigger para atualizar updated_at em races
CREATE TRIGGER set_updated_at_races
    BEFORE UPDATE ON races
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Criar tabela de resultados
CREATE TABLE race_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  race_id UUID NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  pilot_id UUID NOT NULL REFERENCES pilot_profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  position INTEGER,
  qualification_position INTEGER,
  fastest_lap BOOLEAN NOT NULL DEFAULT false,
  dnf BOOLEAN NOT NULL DEFAULT false,
  dq BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  heat_number INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Nova restrição de unicidade incluindo heat_number
  CONSTRAINT race_results_race_pilot_category_heat_unique 
  UNIQUE (race_id, pilot_id, category_id, heat_number)
);

-- Criar índices para melhorar a performance
CREATE INDEX idx_race_results_race_id ON race_results(race_id);
CREATE INDEX idx_race_results_pilot_id ON race_results(pilot_id);
CREATE INDEX idx_race_results_category_id ON race_results(category_id);
CREATE INDEX idx_race_results_heat_number ON race_results(heat_number);

-- Configurar buckets do storage
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('pilot-avatars', 'pilot-avatars', true),
    ('league-logos', 'league-logos', true),
    ('championship-logos', 'championship-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Criar políticas de storage para avatares
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

-- Criar políticas de storage para logos de ligas
CREATE POLICY "League logos are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'league-logos');

CREATE POLICY "League owners can manage league logos"
    ON storage.objects FOR ALL
    USING (
        bucket_id = 'league-logos'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Criar políticas de storage para logos de campeonatos
CREATE POLICY "Championship logos are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'championship-logos');

CREATE POLICY "League owners can manage championship logos"
    ON storage.objects FOR ALL
    USING (
        bucket_id = 'championship-logos'
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    ); 