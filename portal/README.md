# TSU LAB Client Portal

Static client portal for TSU sellers. Single file (`index.html`), no build step.
Auth via Supabase magic link; data via Supabase (RLS-scoped); bot via the `assist` Edge Function.

## Deploy on Render (separate Static Site from the landing page, same repo)
- New > Static Site > connect this repo
- Branch: main
- Root Directory: `portal`
- Build Command: (empty)
- Publish Directory: `.`
- Env var: `SKIP_INSTALL_DEPS=true`
- Custom domain: portal.tradesecretsunlocked.com

## After deploy
In Supabase > Authentication > URL Configuration, add the portal URL(s) to Site URL + Redirect URLs.
Config (Supabase URL + publishable key) is already baked into index.html — nothing else to set.
