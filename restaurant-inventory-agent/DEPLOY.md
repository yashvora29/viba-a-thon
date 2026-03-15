Deployment steps — Frontend (Vercel) + Backend (Render)

This file explains exactly how to deploy the frontend to Vercel and the backend to Render (recommended), and how to wire them together using `VITE_API_URL`.

1) Deploy backend to Render (recommended)

- Create a new Web Service on Render and connect your GitHub repo.
- Set the "Root" or "Service Directory" to `restaurant-inventory-agent`.
- Start command: `npm start`
  - We added `"start": "node server.js"` to `restaurant-inventory-agent/package.json`.
- (Optional) If you prefer a single-service deploy that also builds the frontend during deploy, set the Build Command to:
  ```
  npm --prefix frontend install && npm --prefix frontend run build
  ```
  and leave Start Command as `npm start`.
- Make sure Render's service uses Node 18 or Node 20.
- Deploy — note the service URL (e.g. `https://my-agent.onrender.com`).
- Quick check (from your machine):
  ```bash
  curl -i https://<your-render-url>/health
  # Expected: 200 OK and JSON { ok: true, time: ... }
  ```

2) Deploy frontend to Vercel

- In Vercel, create/import a new project and select the repository.
- Set the Project Root to `restaurant-inventory-agent/frontend`.
- Framework Preset: Vite (if available).
- Build Command: `npm run build`
- Output Directory: `dist`

3) Configure environment variable in Vercel

- In the Vercel project settings -> Environment Variables, add:
  - Key: `VITE_API_URL`
  - Value: `https://<your-backend-url>` (the Render URL from step 1). Do NOT include a trailing slash.
- Add the variable for the environments you want (Preview, Production).
- IMPORTANT: Vite reads env vars at build time. After adding this environment variable you MUST trigger a new deployment (re-deploy) so the built frontend contains the correct API URL.

4) Trigger a redeploy of the frontend

- Redeploy from Vercel dashboard or push an empty commit to the branch to trigger a build:
  ```bash
  git commit --allow-empty -m "chore: trigger Vercel redeploy with VITE_API_URL"
  git push
  ```
- After deploy, open the site and use browser DevTools -> Network to confirm requests are going to `https://<your-backend-url>/api/...` and that they return 200.

5) Troubleshooting

- If requests still go to `/api` on the Vercel domain:
  - Confirm `VITE_API_URL` is set for the Production environment and the deployment completed after setting it.
  - Check Vercel build logs for the env var presence.
- If you see mixed-content errors (frontend is https but backend is http): ensure the backend uses https or host it behind a TLS-enabled provider.
- If you see CORS errors: the backend uses `app.use(cors())` which allows all origins. If you restrict origins, add the Vercel origin to allowed list.

6) Quick local simulation (optional)

To simulate production locally (build-time env var):

```bash
# from frontend folder
VITE_API_URL=https://<your-backend-url> npm run build
# serve the built files
npx serve dist
```

This helps verify that the built frontend makes requests to the correct API URL.

---

If you'd like, I can also:
- Add a `Procfile` for Heroku style deploys.
- Add a one-click Render `render.yaml` if you want to define the service in code.
- Check your Vercel build logs if you paste them here.

