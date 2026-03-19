# Fix 404 on https://causeartist-directory.vercel.app/

If the deployment is **green** in Vercel but **causeartist-directory.vercel.app** returns **404 NOT_FOUND**, the domain is usually not linked to the project that has the successful deployment.

## 1. Use the deployment URL from the dashboard

- In Vercel, open your project and go to **Deployments**.
- Open the **latest successful (green)** deployment.
- Use the deployment URL shown there (e.g. `causeartist-directory-xxxxx-trahants-projects.vercel.app` or `causeartist-xxxxx-trahants-projects.vercel.app`).
- If that URL loads the app, the build is fine and the issue is only domain assignment.

## 2. Assign the production domain to this project

- In the **same** project that has the green deployment, go to **Settings** → **Domains**.
- Under **Domains**, add: `causeartist-directory.vercel.app`.
- Save. Vercel will assign it to the **Production** deployment of this project.
- Wait for DNS to propagate (usually a few minutes), then open https://causeartist-directory.vercel.app/ again.

## 3. If the project name is different

- If the project is named e.g. **causeartist**, the default Vercel URL is `causeartist.vercel.app` (or `causeartist-*-*.vercel.app`).
- Then `causeartist-directory.vercel.app` might belong to a **different**, empty project.
- Either:
  - Use the default URL of the project that has the green deployment, or
  - Add **causeartist-directory.vercel.app** as a domain to that project (step 2), or
  - Rename the project to **causeartist-directory** in **Settings** → **General** so the default `*.vercel.app` domain becomes `causeartist-directory.vercel.app`.

## 4. Confirm production branch

- **Settings** → **Git** → **Production Branch**.
- Set it to **main** (or the branch you deploy from) so the production domain serves the latest deployment from that branch.

## 5. If the deployment URL also returns 404 (root path)

If **both** the deployment URL (e.g. `causeartist-directory-xxxxx-trahants-projects.vercel.app`) and the production domain return **404 NOT_FOUND** for `/`:

1. **Check that the app is running**  
   Open:  
   `https://<your-deployment-url>/api/health`  
   You should see `{"ok":true,"ts":"..."}`. If this works but `/` does not, the 404 is coming from the root page/layout (e.g. a runtime error during render).

2. **Check runtime logs**  
   In Vercel: **Deployments** → open the deployment → **Functions** or **Logs**. Visit `/` and look for errors (e.g. from `getLocale`, `getMessages`, Prisma, or env). Fix any missing env vars or code that throws.

3. **Check build settings**  
   **Settings** → **Build & Development** → **Output Directory**. For Next.js it should be **empty** (default). If it’s set to something else, clear it so Vercel uses the Next.js output.

4. **Redeploy**  
   After changing env or settings, trigger a new deployment (e.g. push a commit or **Redeploy** in the deployment menu).
