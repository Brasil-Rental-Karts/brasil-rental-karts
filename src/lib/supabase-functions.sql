-- Function to check if an email belongs to a registered user and create a pilot profile
CREATE OR REPLACE FUNCTION public.check_email_and_create_pilot(
  p_email TEXT,
  p_name TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_pilot_id UUID;
BEGIN
  -- Verificar se o e-mail pertence a um usuário cadastrado
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email;
  
  -- Se o usuário existir, verificar se já possui um perfil de piloto
  IF v_user_id IS NOT NULL THEN
    -- Verificar se já existe um perfil para este usuário
    SELECT id INTO v_pilot_id
    FROM pilot_profiles
    WHERE id = v_user_id;
    
    -- Se não tiver perfil, criar um
    IF v_pilot_id IS NULL THEN
      INSERT INTO pilot_profiles (id, name, email)
      VALUES (v_user_id, p_name, p_email)
      RETURNING id INTO v_pilot_id;
    END IF;
    
    RETURN v_pilot_id;
  ELSE
    -- Se não for um usuário registrado, criar um novo piloto com UUID gerado
    v_pilot_id := uuid_generate_v4();
    
    INSERT INTO pilot_profiles (id, name, email)
    VALUES (v_pilot_id, p_name, p_email)
    RETURNING id INTO v_pilot_id;
    
    RETURN v_pilot_id;
  END IF;
END;
$$; 