

## Changes to AdminUsers.tsx

### 1. Filter deleted invitations in fetchData

Add `.eq('deleted', false)` to the `user_invitations` query so only non-deleted invitations are fetched.

### 2. Show delete button on all invitations

Currently the delete button in the Meghivok (Invitations) section only appears when `!inv.used`. Change this so the Trash icon is visible on **every** invitation row, regardless of status.

### Technical Details

**File: `src/pages/AdminUsers.tsx`**

- In `fetchData`, the query chain for `user_invitations` will get an additional `.eq('deleted', false)` filter before `.order(...)`.
- In the invitations table JSX, remove the `{!inv.used && ...}` conditional wrapper around the delete button so it always renders.

Both changes are small, localized edits -- no new files or dependencies needed.

