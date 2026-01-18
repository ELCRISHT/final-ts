# 🚀 Deployment Guide for TRACKSMART

## Overview
- **Frontend**: Deployed on Vercel
- **Backend**: Deployed on Render (or Railway/Heroku)
- **Database**: MongoDB Atlas (already configured)

---

## 📦 Step 1: Deploy Backend to Render

### 1.1 Prepare Backend
Your backend is already ready, but create a start script:

### 1.2 Deploy to Render
1. Go to [render.com](https://render.com) and sign up/login
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository (`ELCRISHT/final-ts`)
4. Configure:
   - **Name**: `tracksmart-backend`
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

### 1.3 Add Environment Variables in Render
Click **"Environment"** and add:
```
PORT=5001
MONGO_URI=mongodb+srv://03221518_db_user:sTYnFrq8gZhLwJP1@cluster0.xucclkq.mongodb.net/db-ft?appName=Cluster0
STEAM_API_KEY=ybpn37vxw5m7
STEAM_API_SECRET=qmx3qhvmr596f3s6h77vapj7hpqaf6b2jhrrncx3uadrttbhgy26vv8dqk4vxdvm
JWT_SECRET_KEY=strong-key-23261208
NODE_ENV=production
```

### 1.4 Copy Your Backend URL
After deployment, Render will give you a URL like:
`https://tracksmart-backend.onrender.com`

**⚠️ IMPORTANT**: Update `backend/src/server.js` CORS to allow your frontend:
```javascript
cors({
  origin: ["https://your-frontend.vercel.app"],
  credentials: true, 
})
```

---

## 🌐 Step 2: Deploy Frontend to Vercel

### 2.1 Update Frontend API URLs
Open `frontend/.env.production` and update:
```env
VITE_STREAM_API_KEY=ybpn37vxw5m7
VITE_API_URL=https://tracksmart-backend.onrender.com
```

### 2.2 Update axios.js
Edit `frontend/src/lib/axios.js`:
```javascript
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
```

### 2.3 Update socket.js
Edit `frontend/src/lib/socket.js`:
```javascript
const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || "http://localhost:5001";
```

### 2.4 Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) and sign up/login with GitHub
2. Click **"Add New Project"**
3. Import your `ELCRISHT/final-ts` repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 2.5 Add Environment Variables in Vercel
In Vercel dashboard → Settings → Environment Variables:
```
VITE_STREAM_API_KEY=ybpn37vxw5m7
VITE_API_URL=https://tracksmart-backend.onrender.com
```

### 2.6 Deploy
Click **"Deploy"** and wait for build to complete.

---

## 🔄 Step 3: Update CORS in Backend

After getting your Vercel URL (e.g., `https://tracksmart.vercel.app`):

1. Edit `backend/src/server.js`:
```javascript
app.use(
  cors({
    origin: ["https://tracksmart.vercel.app"], // Your Vercel URL
    credentials: true, 
  })
);
```

2. Push changes to GitHub
3. Render will auto-redeploy

---

## ✅ Step 4: Verify Deployment

### Test Backend
```bash
curl https://tracksmart-backend.onrender.com/api/auth/me
```

### Test Frontend
1. Visit `https://tracksmart.vercel.app`
2. Sign up / Login
3. Test video call
4. Test monitoring features

---

## 🐛 Troubleshooting

### CORS Errors
- Make sure backend CORS includes your Vercel URL
- Check credentials: true is set

### Socket.IO Not Connecting
- Verify VITE_API_URL is correct in Vercel env vars
- Check Render logs for errors

### Video Call Not Working
- Verify Stream API keys are correct in both environments
- Check browser console for errors

### 502 Bad Gateway on Render
- Render free tier sleeps after inactivity
- First request may take 30-60 seconds to wake up

---

## 💰 Cost Breakdown

- **Vercel**: Free (Hobby Plan)
- **Render**: Free (with 750 hours/month)
- **MongoDB Atlas**: Free (512MB storage)
- **Stream API**: Check your plan limits

---

## 🔐 Security Checklist

- ✅ Change JWT_SECRET_KEY to strong random string
- ✅ Use production MongoDB database
- ✅ Enable HTTPS (automatic on Vercel/Render)
- ✅ Set NODE_ENV=production
- ✅ Never commit .env files

---

## 📊 Monitoring

- **Vercel**: Analytics in dashboard
- **Render**: Logs in dashboard
- **MongoDB**: Monitor in Atlas dashboard

---

## 🚀 Quick Deploy Commands

**Push to deploy:**
```bash
git add .
git commit -m "Update deployment config"
git push origin main
```

Both Vercel and Render will auto-deploy on push!
