-- Criar ou atualizar a função set_updated_at para usar nos triggers
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Atualização da tabela pilot_profiles para remover a restrição de foreign key com auth.users
ALTER TABLE pilot_profiles 
DROP CONSTRAINT IF EXISTS pilot_profiles_id_fkey;

-- Remover as políticas existentes relacionadas a autenticação
DROP POLICY IF EXISTS "Users can view their own profile" ON pilot_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON pilot_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON pilot_profiles;

-- Criar novas políticas
-- Permitir que qualquer piloto seja visualizado
CREATE POLICY "Anyone can view pilot profiles"
    ON pilot_profiles FOR SELECT
    USING (true);

-- Manter as políticas de atualização e inserção apenas para o dono da liga
CREATE POLICY "League owners can update any pilot"
    ON pilot_profiles FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT l.owner_id FROM leagues l
        )
    );

CREATE POLICY "League owners can create pilots"
    ON pilot_profiles FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT l.owner_id FROM leagues l
        )
    );

-- Manter a política para que usuários possam atualizar seus próprios perfis
CREATE POLICY "Users can update their own profile"
    ON pilot_profiles FOR UPDATE
    USING (auth.uid()::text = id::text);

-- Trigger para atualizar o campo updated_at
CREATE TRIGGER set_updated_at_league_admins
BEFORE UPDATE ON public.league_admins
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Criar tabela para administradores de ligas
CREATE TABLE IF NOT EXISTS public.league_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(league_id, user_id)
);

-- Permissões para a tabela league_admins
ALTER TABLE public.league_admins ENABLE ROW LEVEL SECURITY;

-- Política de acesso para leitura de league_admins (qualquer um pode ler)
CREATE POLICY "Anyone can read league_admins" ON public.league_admins
    FOR SELECT USING (true);

-- Política de acesso para inserção/atualização/exclusão (apenas proprietários da liga podem gerenciar)
CREATE POLICY "League owners can manage admins" ON public.league_admins
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.leagues l
            WHERE l.id = league_id
            AND l.owner_id = auth.uid()
        )
    );

-- Criar tabela para as etapas do campeonato
CREATE TABLE IF NOT EXISTS public.races (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    championship_id UUID NOT NULL REFERENCES public.championships(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    date TIMESTAMP WITH TIME ZONE,
    location VARCHAR(255),
    track_layout VARCHAR(255),
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Permissões para a tabela races
ALTER TABLE public.races ENABLE ROW LEVEL SECURITY;

-- Política de acesso para leitura de races (qualquer um pode ler)
CREATE POLICY "Anyone can read races" ON public.races
    FOR SELECT USING (true);

-- Política de acesso para inserção de races (apenas proprietários da liga podem inserir)
CREATE POLICY "League owners can insert races" ON public.races
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.championships c
            JOIN public.leagues l ON c.league_id = l.id
            WHERE c.id = championship_id
            AND (l.owner_id = auth.uid() OR EXISTS (
                SELECT 1 FROM public.league_admins la
                WHERE la.league_id = l.id AND la.user_id = auth.uid()
            ))
        )
    );

-- Política de acesso para atualização de races (apenas proprietários da liga podem atualizar)
CREATE POLICY "League owners can update races" ON public.races
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.championships c
            JOIN public.leagues l ON c.league_id = l.id
            WHERE c.id = championship_id
            AND (l.owner_id = auth.uid() OR EXISTS (
                SELECT 1 FROM public.league_admins la
                WHERE la.league_id = l.id AND la.user_id = auth.uid()
            ))
        )
    );

-- Política de acesso para exclusão de races (apenas proprietários da liga podem excluir)
CREATE POLICY "League owners can delete races" ON public.races
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.championships c
            JOIN public.leagues l ON c.league_id = l.id
            WHERE c.id = championship_id
            AND (l.owner_id = auth.uid() OR EXISTS (
                SELECT 1 FROM public.league_admins la
                WHERE la.league_id = l.id AND la.user_id = auth.uid()
            ))
        )
    );

-- Trigger para atualizar o campo updated_at
CREATE TRIGGER set_updated_at_races
BEFORE UPDATE ON public.races
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Criar tabela para os resultados das etapas
CREATE TABLE IF NOT EXISTS public.race_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    race_id UUID NOT NULL REFERENCES public.races(id) ON DELETE CASCADE,
    pilot_id UUID NOT NULL REFERENCES public.pilot_profiles(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    position INTEGER,
    qualification_position INTEGER,
    fastest_lap BOOLEAN DEFAULT false,
    dnf BOOLEAN DEFAULT false,
    dq BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(race_id, pilot_id) -- Um piloto só pode ter um resultado por etapa
);

-- Permissões para a tabela race_results
ALTER TABLE public.race_results ENABLE ROW LEVEL SECURITY;

-- Política de acesso para leitura de race_results (qualquer um pode ler)
CREATE POLICY "Anyone can read race results" ON public.race_results
    FOR SELECT USING (true);

-- Política de acesso para inserção/atualização/exclusão (apenas proprietários ou admins da liga)
CREATE POLICY "League owners can manage race results" ON public.race_results
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.races r
            JOIN public.championships c ON r.championship_id = c.id
            JOIN public.leagues l ON c.league_id = l.id
            WHERE r.id = race_id
            AND (l.owner_id = auth.uid() OR EXISTS (
                SELECT 1 FROM public.league_admins la
                WHERE la.league_id = l.id AND la.user_id = auth.uid()
            ))
        )
    );

-- Trigger para atualizar o campo updated_at
CREATE TRIGGER set_updated_at_race_results
BEFORE UPDATE ON public.race_results
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column(); 