# Fix 404 on https://causeartist-directory.vercel.app/

If the deployment is **green** in Vercel but **causeartist-directory.vercel.app** returns **404 NOT_FOUND**, the domain is usually not linked to the project that has the successful deployment.

## 1. Use the deployment URL from the dashboard

- In Vercel, open your project and go to **Deployments**.
- Open the **latest successful (green)** deployment.
- Use the deployment URL shown there (e.g. `causeartist-directory-xxxxx-trahants-projects.vercel.app` or `dirstarter-xxxxx-trahants-projects.vercel.app`).
- If that URL loads the app, the build is fine and the issue is only domain assignment.

## 2. Assign the production domain to this project

- In the **same** project that has the green deployment, go to **Settings** → **Domains**.
- Under **Domains**, add: `causeartist-directory.vercel.app`.
- Save. Vercel will assign it to the **Production** deployment of this project.
- Wait for DNS to propagate (usually a few minutes), then open https://causeartist-directory.vercel.app/ again.

## 3. If the project name is different

- If the project is named e.g. **dirstarter**, the default Vercel URL is `dirstarter.vercel.app` (or `dirstarter-*-*.vercel.app`).
- Then `causeartist-directory.vercel.app` might belong to a **different**, empty project.
- Either:
  - Use the default URL of the project that has the green deployment, or
  - Add **causeartist-directory.vercel.app** as a domain to that project (step 2), or
  - Rename the project to **causeartist-directory** in **Settings** → **General** so the default `*.vercel.app` domain becomes `causeartist-directory.vercel.app`.

## 4. Confirm production branch

- **Settings** → **Git** → **Production Branch**.
- Set it to **main** (or the branch you deploy from) so the production domain serves the latest deployment from that branch.
