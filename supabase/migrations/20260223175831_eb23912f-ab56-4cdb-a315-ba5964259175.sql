
ALTER TABLE public.user_mfa_settings DROP CONSTRAINT IF EXISTS user_mfa_settings_user_id_key;

ALTER TABLE public.user_mfa_settings ADD CONSTRAINT user_mfa_settings_user_id_key UNIQUE (user_id);

CREATE OR REPLACE FUNCTION public.save_mfa_settings(
  p_mfa_type text,
  p_totp_secret text,
  p_is_verified boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_mfa_settings (user_id, mfa_type, totp_secret, is_verified, updated_at)
  VALUES (auth.uid(), p_mfa_type, p_totp_secret, p_is_verified, now())
  ON CONFLICT (user_id)
  DO UPDATE SET
    mfa_type = EXCLUDED.mfa_type,
    totp_secret = EXCLUDED.totp_secret,
    is_verified = EXCLUDED.is_verified,
    updated_at = now();
END;
$$;
