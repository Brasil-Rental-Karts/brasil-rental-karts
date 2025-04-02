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

-- Trigger para atualizar o campo updated_at continua o mesmo 