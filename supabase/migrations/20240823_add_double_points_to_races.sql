-- Adicionar campo double_points na tabela races
ALTER TABLE races ADD COLUMN double_points BOOLEAN DEFAULT false;

-- Adicionar comentário descritivo
COMMENT ON COLUMN races.double_points IS 'Indica se a etapa deve ter pontuação em dobro'; 