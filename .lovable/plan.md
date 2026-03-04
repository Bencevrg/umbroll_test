
## Update Supabase Environment Secrets Only

Update the two Lovable secrets so the published site connects to the correct Supabase project:

- `VITE_SUPABASE_URL` → `https://cmyofethvzjbcldzikyi.supabase.co`
- `VITE_SUPABASE_ANON_KEY` → `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNteW9mZXRodnpqYmNsZHppa3lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzODczNDQsImV4cCI6MjA4NTk2MzM0NH0.t7sRiUCyUMH93eVWp5VjzwR8yeVQkBPRwWqkVEguoGo`

No code files will be changed. The `send-mfa-code/index.ts` nodemailer import is left untouched.
