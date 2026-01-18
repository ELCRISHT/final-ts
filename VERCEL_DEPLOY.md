# 🚀 Deploy Frontend to Vercel

Your backend is already deployed: **https://final-ts.onrender.com**

## Step 1: Go to Vercel
1. Visit [vercel.com](https://vercel.com)
2. Click **"Sign Up"** or **"Login"** with GitHub

## Step 2: Import Your Project
1. Click **"Add New..."** → **"Project"**
2. Find and select your repository: **ELCRISHT/final-ts**
3. Click **"Import"**

## Step 3: Configure Build Settings
- **Framework Preset**: Vite
- **Root Directory**: `frontend` (Click "Edit" and type `frontend`)
- **Build Command**: `npm run build` (should be auto-detected)
- **Output Directory**: `dist` (should be auto-detected)
- **Install Command**: `npm install` (should be auto-detected)

## Step 4: Add Environment Variables
Click **"Environment Variables"** and add:

| Name | Value |
|------|-------|
| `VITE_STREAM_API_KEY` | `ybpn37vxw5m7` |
| `VITE_API_URL` | `https://final-ts.onrender.com` |

Make sure to add them for **All environments** (Production, Preview, Development)

## Step 5: Deploy
1. Click **"Deploy"**
2. Wait 2-3 minutes for build to complete
3. You'll get a URL like: `https://final-ts.vercel.app` or `https://your-project-name.vercel.app`

## Step 6: Update Backend CORS
After deployment, copy your Vercel URL and:

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your **final-ts** backend service
3. Go to **"Environment"** tab
4. Add new variable:
   - **Key**: `FRONTEND_URL`
   - **Value**: `https://your-app.vercel.app` (your actual Vercel URL)
5. Click **"Save Changes"**
6. Backend will auto-redeploy

## Step 7: Test Your App! 🎉
1. Visit your Vercel URL
2. Sign up / Login
3. Test video calls
4. Test all features

---

## ✅ Checklist
- [ ] Deployed frontend to Vercel
- [ ] Added environment variables (VITE_STREAM_API_KEY, VITE_API_URL)
- [ ] Got Vercel URL
- [ ] Added FRONTEND_URL to Render backend
- [ ] Tested the app

---

## 🐛 If Something Goes Wrong

### "Network Error" or "Failed to fetch"
- Check environment variables in Vercel dashboard
- Make sure `VITE_API_URL` is `https://final-ts.onrender.com`
- Check Render backend is running (visit https://final-ts.onrender.com)

### CORS Error
- Add your Vercel URL to `FRONTEND_URL` in Render
- Wait for backend to redeploy (2-3 minutes)

### Video Call Not Working
- Check Stream API key is correct
- Check browser console for errors
- Verify camera/mic permissions

### Backend 502 Error
- Render free tier sleeps after inactivity
- First request may take 30-60 seconds to wake up
- Just refresh the page

---

## 📱 Your Live URLs
- **Backend**: https://final-ts.onrender.com
- **Frontend**: (Will be provided after Vercel deployment)

Congratulations! Your app is now live! 🚀
