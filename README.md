# THREAD

Website for *THREAD*, a research program on HIV, culture and care in Malaysia, seen through batik.

Built with Next.js and hosted on Vercel. Admins sign in with Google and edit the whole site from the key icon in the header. Every publish becomes a commit to this repository, and Vercel redeploys the site in about a minute.

## How it fits together

| Part | Where |
| --- | --- |
| Page design and behaviour (source) | `design/thread.html` |
| Generated page files | `app/markup.ts`, `app/site.css`, `public/site.js` (run `python3 design/build_next.py`) |
| Content: every page, list and setting the admin edits | `public/site-data.json` |
| Google sign-in | `lib/auth.ts`, `app/api/auth` |
| Admin publishing and photo uploads | `app/api/content`, `app/api/upload`, `lib/github.ts` |
| Private research resources | `app/api/resources`, stored in `resources/` of this (private) repository |
| Who can edit (Admins and Editors) | `app/api/access`, `lib/access.ts`, stored in `config/access.json` |
| Uploaded photos and logos | `public/uploads/` |
| Background removal for team photos | `public/bg-worker.js` (runs in the admin's browser) |

## Deploy on Vercel (one time)

1. **Push this folder to a new private GitHub repository.**
2. **Import it in Vercel.** vercel.com → Add New → Project → Import the repository. Keep the defaults (Framework: Next.js) and deploy once.
3. **Create a Google sign-in client.** Google Cloud Console → APIs & Services → Credentials → Create credentials → OAuth client ID → Web application.
   - Authorized JavaScript origin: `https://YOUR-DOMAIN`
   - Authorized redirect URI: `https://YOUR-DOMAIN/api/auth/callback/google`
   - If asked to set up the consent screen first, choose External and add your email as a test user, or publish the app.
4. **Create a GitHub token** so admin publishing can commit. GitHub → Settings → Developer settings → Fine-grained tokens → Generate. Repository access: only this repository. Permissions: Contents → Read and write.
5. **Keep the repository private.** Research resources (`resources/`) and the access list (`config/access.json`, which holds email addresses) live in it. Vercel skips redeploying for commits that only change those folders (see `vercel.json`).
6. **Add environment variables** in Vercel → Project → Settings → Environment Variables (see `.env.example`):
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
   - `NEXTAUTH_SECRET`: a long random string (`openssl rand -base64 32`)
   - `NEXTAUTH_URL`: `https://YOUR-DOMAIN`
   - `ADMIN_EMAILS`: the site owners' Google accounts, comma separated. Owners can always sign in, and add everyone else from Admin → Access
   - `GITHUB_TOKEN`, `GITHUB_REPO` (`owner/name`), `GITHUB_BRANCH` (`main`)
7. **Redeploy** (Deployments → ⋯ → Redeploy) so the variables take effect.

Then open the site, click the key icon, sign in with Google, and edit.

## Access

- **Owners** are the Google accounts in `ADMIN_EMAILS`. They can always sign in and can't be removed from the console.
- In **Admin → Access**, owners and Admins add people by Google email as:
  - **Admin**: edits and publishes everything, uses research resources, and manages access.
  - **Editor**: edits and publishes the site and uses research resources, but can't change access.
- Changes apply within about 30 seconds, with no redeploy. Anyone can press Sign in with Google, but only people on the list get into the console.

## Editing

- Admin has a tab for everything: navigation and pages, page text, batik stages, research themes and projects, team, alumni, collaborators, partner logos, blog posts, publications, Get involved roles and research resources.
- Every list item has a **Shown / Hidden** switch, so you can keep drafts or old items without deleting them.
- **Edit page text** lets you type straight onto the pages.
- Changes stay as a draft on your device until you press **Publish to site**. You see the change straight away; everyone else sees it after Vercel redeploys, usually within a minute.
- Team photos have their background removed automatically and turn black and white. Photos and logos upload to `public/uploads/` and appear for visitors after the next deploy. PNG, JPEG, WebP or GIF, up to 4 MB.
- **Research resources** are private files, links and notes for the team, stored in `resources/`. Only signed-in admins can list or open them. Don't store participant data or anything that identifies a person.

## Background removal

`public/bg-worker.js` loads the cutout model (about 44 MB, cached by the browser after the first time) and the ONNX runtime from the jsDelivr CDN. To host them yourself, copy the files listed in the worker into `public/` and change `ORT_BASE` and `MODEL_BASE`.

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in the values; NEXTAUTH_URL=http://localhost:3000
npm run dev
```

## Changing the design

Edit `design/thread.html`, then run `python3 design/build_next.py` from the repo root to regenerate `app/markup.ts`, `app/site.css` and `public/site.js`. It never touches `public/site-data.json`. The same file also runs on its own as a static page, which is handy for previewing.
