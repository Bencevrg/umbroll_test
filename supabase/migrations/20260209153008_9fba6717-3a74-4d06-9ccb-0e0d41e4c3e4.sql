
-- Fix: Replace the overly permissive "Anyone can check invitation by token" policy
-- with a function-based lookup that only matches by token
DROP POLICY IF EXISTS "Anyone can check invitation by token" ON public.user_invitations;

CREATE POLICY "Anyone can check invitation by token"
ON public.user_invitations
FOR SELECT
USING (true);
-- NOTE: This remains permissive for SELECT, but the actual security is enforced
-- by only querying with .eq('token', token) in the edge function.
-- A tighter approach uses a DB function instead:

-- Actually, let's replace with a proper restrictive approach using an RPC function
DROP POLICY IF EXISTS "Anyone can check invitation by token" ON public.user_invitations;

-- Create a security definer function to look up invitations by token
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(_token text)
RETURNS TABLE (
  id uuid,
  email text,
  role app_role,
  expires_at timestamptz,
  used boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.id, i.email, i.role, i.expires_at, i.used
  FROM public.user_invitations i
  WHERE i.token = _token
    AND i.used = false
    AND i.expires_at > now()
  LIMIT 1;
$$;
