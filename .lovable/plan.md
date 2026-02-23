

## Create MFA Save Function Migration

### What will be done
A new database migration file will be created that:

1. Ensures the `user_id` column in `user_mfa_settings` has a UNIQUE constraint (dropping any existing one first to avoid conflicts).
2. Creates (or replaces) a `save_mfa_settings` PostgreSQL function that safely inserts or updates MFA settings for the current authenticated user using `ON CONFLICT (user_id)`.

### Technical Details

**New file:** `supabase/migrations/20260223190000_add_mfa_save_function.sql`

Contains the exact SQL provided:
- `ALTER TABLE` to add a unique constraint on `user_id`
- `CREATE OR REPLACE FUNCTION public.save_mfa_settings(...)` as a `SECURITY DEFINER` function using `auth.uid()` to identify the caller

No changes to any React/TypeScript files are needed -- this is a standalone database migration.

