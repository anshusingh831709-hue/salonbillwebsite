# Salon Billing Deployment Guide (Frontend + Backend)

This setup deploys both frontend and backend together on one service.

## 1) Prepare backend environment variable
In your hosting panel, add:

- `MONGO_URI` = your MongoDB Atlas connection string

Example format:

`mongodb+srv://<username>:<password>@<cluster>.mongodb.net/`

## 2) Deploy on Render (recommended)

### Create Web Service
- Connect your GitHub repo to Render
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`
- Environment Variable:
  - `MONGO_URI` = your Atlas URI

### Why this works
- Backend serves API routes (`/api/...`)
- Backend also serves frontend files (`index.html`, `script.js`, `styles.css`) from project root
- Frontend automatically calls backend on same domain in production

## 3) MongoDB Atlas checklist (important)
- In Atlas, go to **Network Access**
- Add IP access: `0.0.0.0/0` (or your hosting provider IP)
- In Atlas, create DB user with read/write permissions
- Use that user in `MONGO_URI`

## 4) Verify after deploy
Open these URLs from your deployed domain:

- `/health`
- `/api/stats`
- `/`

Expected:
- `/health` returns backend running status
- `/api/stats` returns JSON stats
- `/` opens billing frontend

## 5) Local development
Run backend only:

```bash
cd backend
npm install
npm start
```

Then open:

- `http://localhost:5000`

(Frontend is served by backend in this setup.)

## 6) If deployment fails
Check logs for:
- `MongoDB Connection Error`
- Missing `MONGO_URI`
- Atlas network access blocked

Fix these and redeploy.
