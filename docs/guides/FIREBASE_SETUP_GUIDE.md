# Firebase Setup Guide for Google Authentication

## 🚀 Quick Setup (Required for Google Login)

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name: `kamioi-app` (or your preferred name)
4. Enable Google Analytics (optional)
5. Click "Create project"

### Step 2: Enable Authentication
1. In your Firebase project, go to "Authentication" in the left sidebar
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Click on "Google" provider
5. Toggle "Enable"
6. Add your project support email
7. Click "Save"

### Step 3: Get Firebase Configuration
1. In Firebase Console, go to "Project settings" (gear icon)
2. Scroll down to "Your apps" section
3. Click "Add app" → Web app (</>) icon
4. Enter app nickname: `kamioi-web`
5. Check "Also set up Firebase Hosting" (optional)
6. Click "Register app"
7. Copy the Firebase configuration object

### Step 4: Set Environment Variables
Create a `.env` file in the `frontend` directory with your Firebase config:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

### Step 5: Update Firebase Config
Replace the placeholder values in `frontend/src/firebase/config.js` with your actual Firebase configuration.

## 🔧 Alternative: Use Firebase Emulator (Development Only)

If you want to test without setting up a real Firebase project, you can use the Firebase emulator:

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Initialize Firebase in your project: `firebase init`
3. Start the emulator: `firebase emulators:start`
4. Update the config to use emulator URLs

## 🚨 Current Issue

The error `auth/api-key-not-valid` occurs because:
- Environment variables are not set
- Firebase is using demo/placeholder API key
- Google authentication requires valid Firebase credentials

## ✅ Solution

1. **Set up Firebase project** (follow steps above)
2. **Add environment variables** to `.env` file
3. **Restart the development server** after adding environment variables

## 🔍 Verification

After setup, you should see:
- ✅ Firebase initialized successfully
- ✅ Google Auth Service initialized
- ✅ Google login button works without API key errors

## 📝 Notes

- Never commit `.env` files to version control
- Add `.env` to `.gitignore`
- Use different Firebase projects for development/production
- Google authentication requires HTTPS in production
