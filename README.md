# KingSports

KingSports uses React, Vite, KingAuth, Cloudflare Workers, D1, Backblaze B2, Pulumi, GitHub Pages, and GitHub Actions. Teams, players, and music assignments sync to the authenticated account. Google Cloud Run processes music imports with yt-dlp and FFmpeg, queued through Cloud Tasks and stored privately in B2. Legacy media-library API routes remain available.

## Team and player data

The Team menu opens `TeamView` at `#/team`, with the saved team details and roster. The yellow Edit Team button opens `TeamEdit` at `#/team/edit`. Save Team returns to the view only after a successful save; immediate jersey-number saves stay in the editor. Player controls on TeamView play/stop assigned walk-up audio. Team Playlist plays separately selected full team songs in their saved order. All editing stays on TeamEdit. The top music drawer searches, imports, previews, and assigns account music; assignment changes save immediately. Player clip start/duration controls are deferred.

- Each KingAuth account owns one team, matching the current single-team screen. Ownership comes from the verified session, never from a request field.
- `teams` stores the team ID, owner, name, version, timestamps, a B2 logo file key, and a mutation identifier used for safe concurrent saves. Logos are resized in the browser (up to 384 pixels), compressed, and uploaded by the authenticated Worker to private B2 storage; original uploads are not stored. PNG, JPG, and WebP uploads up to 20 MB are supported. The optional upload field `logoDataUrl` is capped at 180,000 characters; `null` removes the logo and omitting the field preserves it. Responses provide a signed `logoUrl` valid for one hour instead of embedding the image.
- `players` stores stable player IDs, team IDs, names, and zero-based roster order. There are no music fields.
- `GET /api/team` returns `{ "team": null }` for a new account, otherwise the saved team and ordered players.
- `PUT /api/team` accepts `{ "name": "Sluggers", "version": 0, "players": [{ "id": "<UUID>", "name": "Alex" }] }`. Use version `0` to create, or the returned version to update. The complete roster is saved atomically, including player removal and reordering. IDs are preserved across saves.
- Team names allow 1–48 characters and player names 1–55. Each roster requires 1–100 players; duplicate IDs or normalized names are rejected. Stale saves return `409` without changing the roster.
- Existing IndexedDB rosters load as drafts only when the account has no server team. Save Team uploads names and roster order, excluding music. A failed server load blocks saving until Retry succeeds, preventing accidental replacement of existing data.

The optional team `division` field uses the shared choices in `shared/divisions.ts`: T-Ball, coach/machine pitch, 6U–18U, league and school levels, college levels, adult leagues, and professional categories. The Team screen uses a snapping wheel beneath the team name. Use Save Team to persist the selection; `null` clears it, while omitted fields preserve the saved division for older clients.

TeamEdit provides a primary-color swatch beneath the team name, left of Division. `primaryColor` accepts a six-digit hex color (default `#041c36`) and saves with the team. TeamView derives dark surfaces and lighter accents from that choice for the team card, jerseys, division badge, and playback accents. KingSports's navigation and branding retain the app theme. No colors are extracted from uploaded logos.

The API workflow applies pending migrations, including `0006_b2_team_logos.sql`, before deploying the API. Deploy the API successfully before using the new frontend.

### Enabling B2 logo uploads

After pushing these changes, run **Provision infrastructure** once, then run **Web**. Provisioning automatically creates and installs `B2_LOGO_KEY_ID` and `B2_LOGO_APPLICATION_KEY` as Worker secrets using the existing bootstrap credentials. These separate credentials permit reading, writing, and deleting files only within the KingSports bucket's `team-logos/` prefix; the media-library key remains read-only. No new GitHub secrets need manual entry. Routine API deployments retain the installed Worker secrets.

Existing D1 logos stay readable and migrate on their next successful team save. A failed upload never replaces the saved logo; a failed or conflicting D1 save attempts to remove only its own newly uploaded object. Previously successful objects are retained so existing signed URLs continue working. Old versions and any orphaned uploads whose cleanup failed can be retired separately after verifying the active references; selecting Remove logo clears the team reference without deleting its historical objects.

## Create a project

1. Select **Use this template** on GitHub and create a repository.
2. Create Cloudflare, Backblaze, and Pulumi accounts.
3. Add the repository secrets listed below.
5. Run the **Provision infrastructure** workflow.
6. The Web workflow discovers the KingSports Worker URL from Cloudflare automatically. Set the optional repository variable `VITE_API_URL` only to override it (for example, for a custom API domain).
7. Enable GitHub Pages with **GitHub Actions** as its source and run the **Web** workflow.

## Repository secrets

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `B2_BOOTSTRAP_KEY_ID`
- `B2_BOOTSTRAP_APPLICATION_KEY`
- `PULUMI_ACCESS_TOKEN`

The infrastructure workflow derives resource names from the GitHub owner and repository, provisions a private encrypted B2 bucket and restricted playback key, creates D1 through Pulumi, runs migrations, deploys the Worker, and installs runtime secrets. No generated credentials are committed.

## Deployment setup

Upload the five infrastructure secrets from your ignored local `.env` without entering them individually:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\bootstrap-secrets.ps1 -Repo jacobuid/king-sports -File .env
```

KingAuth uses shared accounts at https://kingauth.app. No client secrets or publishable keys are required. Install dependencies with Node.js 24+ using `npm ci`; the SDK comes from `github:jacobuid/king-auth#sdk` and the lockfile pins its commit.

In GitHub Settings > Pages, select GitHub Actions as the build source. Commit and push the deployment fixes, then run **Provision infrastructure** before running **Web**. API and provisioning workflows share a concurrency group so they cannot update the Worker simultaneously.

KingSports uses Pulumi project `king-sports`, stack `prod`; Worker `king-sports-api`; D1 database `king-sports-prod`; and bucket `king-sports`. Do not point this project at the Videos Pulumi stack. Existing Backblaze runtime keys are retained during provisioning to avoid interrupting a running Worker if a later step fails; retire obsolete KingSports keys after verifying the new deployment.

If the repo is private, confirm your GitHub plan supports Pages for private repositories. After deployment, open `https://jacobuid.github.io/king-sports/`, sign in with KingAuth, create a team with players, save, and reload to confirm that the roster persists.

## Development

Copy the example environment files, run `npm ci`, then use `npm run dev:api` and `npm run dev:web`. Run `npm run check` before committing.

## Repository rename

Rename the GitHub repository to `king-sports` under Settings > General, then update the local remote:

```powershell
git remote set-url origin https://github.com/jacobuid/king-sports.git
```

The workflows derive the Worker, bucket, and Pages path from the repository name. After pushing, run **Provision infrastructure** and then **Web** to create the new KingSports resources. If `VITE_API_URL` is set as a repository variable, remove it to use automatic discovery or update it to the new Worker URL. Authentication uses the shared KingAuth service.
## Music importer

Google Cloud Run + yt-dlp + FFmpeg setup and deployment:
[services/music/README.md](services/music/README.md).

## Authentication

Embedded KingAuth forms provide sign-in, signup, and password recovery. The profile menu provides account settings and sign-out. Browser credentials are sent as bearer tokens to the Worker, which verifies each protected request against KingAuth using the configured `WEB_ORIGIN` (the exact frontend origin, without a path). Local development supports HTTP loopback origins. Identity service failures deny access.

Existing records still belong to their original Clerk user IDs. KingAuth UUIDs do not automatically inherit them. Before production cutover, prepare an explicit, verified old-ID to new-ID mapping for all account-owned records; do not reassign records from browser input or assume email addresses establish ownership. No existing data is rewritten by this change. Deploy the API and frontend together because Clerk sessions will no longer authenticate.

Migration `0012_kingauth_owner.sql` transfers the verified existing owner to their KingAuth UUID, preserving all record and storage IDs. Other accounts require their own verified mappings.
