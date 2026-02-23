-- Bezárjuk a kiskaput: A felhasználók többé NEM olvashatják közvetlenül a user_mfa_settings táblát.
-- Mivel a frontend már az RPC-t ('get_my_mfa_info') használja, ez nem fogja elrontani az oldalt.

DROP POLICY IF EXISTS "Users can view own MFA settings" ON public.user_mfa_settings;

-- Biztosítjuk, hogy NE legyen semmilyen SELECT policy a felhasználóknak ezen a táblán.
-- (A Service Role továbbra is eléri majd az Edge Functionökből)