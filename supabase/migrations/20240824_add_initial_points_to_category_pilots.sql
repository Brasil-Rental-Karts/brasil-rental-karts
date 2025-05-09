-- Adicionar campo initial_points na tabela category_pilots
ALTER TABLE category_pilots ADD COLUMN initial_points DECIMAL(10,2) DEFAULT 0;

-- Adicionar comentário descritivo
COMMENT ON COLUMN category_pilots.initial_points IS 'Pontuação inicial do piloto na categoria (quando o campeonato já começou)'; 