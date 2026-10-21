# Sideline Planner

A drag-and-drop planner for NFL and college sideline setups. You can place Dragon Seat benches, heaters, cooling equipment, gas banks and team equipment, then draw gas hose, cord and water runs between them with notes. Nothing can be placed past either 25-yard line. You can export any layout as an image.

## What's in this folder

| File | What it does |
| --- | --- |
| `index.html` | The whole planner: field, library, editing and image export. |
| `functions/api/layouts/index.js` | `GET /api/layouts` lists saved layouts. |
| `functions/api/layouts/[id].js` | `GET`, `PUT` and `DELETE /api/layouts/:id` open, save and delete one layout. |

The `functions` folder runs on Cloudflare Pages Functions and stores layouts in Cloudflare KV, so everyone using the site sees the same saved layouts. If KV isn't connected, or you open `index.html` straight from your computer, the planner still works but keeps saved layouts in that one browser only.

## Put it on GitHub

1. On github.com, create a new **private** repository, for example `sideline-planner`. Don't add a README; this folder already has one.
2. In a terminal, from this folder:

   ```bash
   git init
   git add .
   git commit -m "Sideline Planner"
   git branch -M main
   git remote add origin https://github.com/<your-account>/sideline-planner.git
   git push -u origin main
   ```

   Or use GitHub Desktop: **File → Add local repository**, choose this folder, then **Publish repository** and keep it private.

## Host it on Cloudflare Pages

1. In the Cloudflare dashboard, go to **Workers & Pages → Create → Pages → Connect to Git**.
2. Authorize GitHub if asked, pick the `sideline-planner` repo, and click **Begin setup**.
3. Build settings: set **Framework preset** to **None**, leave **Build command** empty, and set **Build output directory** to `/`. Click **Save and Deploy**.
4. Create the storage: go to **Storage & Databases → KV → Create a namespace** and name it `sideline-layouts`.
5. Connect the storage: open the Pages project, then go to **Settings → Bindings → Add → KV namespace**. Set **Variable name** to exactly `LAYOUTS` and pick the `sideline-layouts` namespace. Save.
6. Redeploy so the binding takes effect: go to **Deployments**, open the latest one, and click **Retry deployment** (or push any new commit).
7. Open the `*.pages.dev` address. In **Layouts**, the note "kept in this browser only" should be gone. Save a layout to confirm.

From now on, every push to `main` redeploys the site automatically.

### Optional: your own address

In the Pages project, go to **Custom domains → Set up a domain** and enter something like `sideline.dragonseats.com`. This is quickest when the domain's DNS is already on Cloudflare.

### Recommended: limit access to your team

As set up, anyone with the link can open the site and change or delete saved layouts. To limit it to company email addresses:

1. Go to **Zero Trust → Access → Applications → Add an application → Self-hosted**. The free plan covers up to 50 users.
2. Add the site's address (both the `*.pages.dev` address and any custom domain).
3. Add a policy: **Action** Allow, **Include → Emails ending in** `@dragonseats.com`.
4. Save. Visitors now get a one-time code by email before the planner opens.

Clients won't be able to open the site once it's locked. Send them exported images instead.

## Making changes later

Edit `index.html` and push to GitHub, and Cloudflare redeploys within a minute or two. Saved layouts live in KV, not in the repo, so deploys don't touch them.

To back up layouts, open **Storage & Databases → KV → sideline-layouts**. Each layout is stored under a key starting with `layout:`.
