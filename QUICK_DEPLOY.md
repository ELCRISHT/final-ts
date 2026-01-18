# Quick Deployment Steps for Vercel

## 🚀 Deploy in 15 Minutes

### Step 1: Deploy Backend (5 min)
1. Go to [render.com](https://render.com) → Sign up with GitHub
2. **New +** → **Web Service** → Connect `ELCRISHT/final-ts`
3. Settings:
   - Root Directory: `backend`
   - Build: `npm install`
   - Start: `npm start`
4. Add Environment Variables (copy from backend/.env)
5. Click **Create Web Service**
6. Copy your backend URL (e.g., `https://tracksmart-xxx.onrender.com`)

### Step 2: Deploy Frontend (5 min)
1. Go to [vercel.com](https://vercel.com) → Sign up with GitHub
2. **New Project** → Import `ELCRISHT/final-ts`
3. Settings:
   - Framework: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Add Environment Variables:
   ```
   VITE_STREAM_API_KEY=ybpn37vxw5m7
   VITE_API_URL=https://YOUR-BACKEND-URL.onrender.com
   ```
5. Click **Deploy**

### Step 3: Update CORS (5 min)
1. Get your Vercel URL (e.g., `https://tracksmart.vercel.app`)
2. Update `backend/src/server.js`:
   ```javascript
   cors({
     origin: ["https://YOUR-APP.vercel.app"],
     credentials: true,
   })
   ```
3. Push to GitHub:
   ```bash
   git add .
   git commit -m "Update CORS for production"
   git push origin main
   ```

### Done! 🎉
Visit your Vercel URL and test the app!

---

## Troubleshooting
- **CORS error**: Make sure backend CORS has your Vercel URL
- **502 error**: Render free tier sleeps - wait 30-60s for first request
- **Can't connect**: Check environment variables in both Vercel and Render

## See DEPLOYMENT.md for detailed guide
