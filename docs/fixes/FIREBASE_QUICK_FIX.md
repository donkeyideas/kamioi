# 🔥 Firebase Quick Fix for Google Authentication

## Current Issue
Firebase is using demo/placeholder API key, causing Google authentication to fail.

## ⚡ Quick Solution (5 minutes)

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name: `kamioi-app` (or your choice)
4. Enable Google Analytics (optional)
5. Click "Create project"

### Step 2: Enable Google Authentication
1. In Firebase Console, click "Authentication" in left sidebar
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Click on "Google" provider
5. Toggle "Enable"
6. Add your project support email
7. Click "Save"

### Step 3: Get Firebase Configuration
1. In Firebase Console, click gear icon (Project settings)
2. Scroll down to "Your apps" section
3. Click "Add app" → Web app icon
4. Enter app nickname: `kamioi-web`
5. Click "Register app"
6. **COPY the Firebase configuration object**

### Step 4: Update .env file
1. Open `frontend/.env` file in your text editor
2. Replace placeholder values with your Firebase config:

```env
VITE_FIREBASE_API_KEY=AIzaSyC...your-actual-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_MEASUREMENT_ID=G-ABC123456
```

### Step 5: Restart Development Server
1. Stop current server (Ctrl+C)
2. Start again: `npm run dev`
3. Go to login page
4. Click "Continue with Google"
5. Google authentication should work!

## ✅ Verification
After restart, you should see:
- ✅ `Firebase initialized successfully` (no warnings)
- ✅ `Google Auth Service initialized`
- ✅ Google login button works without API key errors
- ✅ Successful Google authentication popup

## 🚨 Troubleshooting
If you still get API key errors:
1. Check that .env file has real Firebase values (not placeholders)
2. Make sure you restarted the development server
3. Check browser console for any error messages
4. Verify Firebase project has Google authentication enabled

## 🎉 Success!
Once configured, Google authentication will work perfectly!
Users can sign in with their Google accounts seamlessly.
