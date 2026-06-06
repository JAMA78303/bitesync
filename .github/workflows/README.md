# GitHub Actions

## Macro recompute (`macro-recompute.yml`)

Manual workflow to run `npm run recompute:macros` in CI.

### Required repository secrets

Add under **Settings → Secrets and variables → Actions**:

| Secret | Value |
|--------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (never commit) |

### Run

1. **Actions** → **Macro recompute** → **Run workflow**
2. Leave **Dry run** checked for a report-only pass
3. Uncheck **Dry run** to apply writes

Without secrets, use the admin UI: [bitesync.io/admin/macro-recompute](https://bitesync.io/admin/macro-recompute) (requires `ADMIN_USER_ID`).

### Local alternative

```bash
npm run recompute:macros -- --dry-run
npm run recompute:macros
```

Requires `.env.local` with the same Supabase variables.
