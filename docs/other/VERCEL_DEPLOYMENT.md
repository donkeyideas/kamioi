# Vercel Deployment (Frontend)

This project uses a Vite frontend in `frontend/` and a Flask backend hosted on Render.

## Vercel Project Settings
- **Root Directory:** `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

## Environment Variables (Vercel)
Set these in the Vercel dashboard:
- `VITE_API_BASE_URL` = `https://kamioi-backend.onrender.com`

If you use Firebase or other services, add any additional `VITE_*` variables required by the app.

