# 2FA Feature Troubleshooting Guide

## Issue
The 2FA feature isn't visible in the application. This is likely due to Node.js dependencies not being installed, causing TypeScript compilation errors.

## Root Cause
- Node.js and npm are not properly installed/configured on your system
- `npm install` hasn't been run to install required dependencies (speakeasy, qrcode)
- TypeScript compilation errors prevent the application from rendering correctly

## Solution 1: Install Node.js (Recommended)

### Step 1: Download Node.js
1. Go to https://nodejs.org/
2. Download the LTS (Long Term Support) version for your operating system
3. Run the installer and follow the prompts

### Step 2: Verify Installation
After installation, open a new terminal and run:
```bash
node -v
npm -v
```

You should see version numbers for both.

### Step 3: Install Dependencies
Navigate to your project directory and run:
```bash
cd /holly929/RMS_SYSTEM
npm install
```

### Step 4: Build the Application
```bash
npm run build
```

### Step 5: Run the Development Server
```bash
npm run dev
```

You should now see the 2FA feature in the Settings > Security tab.

## Solution 2: Manual Verification of Files

### Check if all required files exist:

1. **src/components/twoFactorSettings.tsx** - ✅ Exists
2. **src/lib/twoFactorAuth.ts** - ✅ Exists  
3. **src/app/(main)/settings/page.tsx** - ✅ Exists and includes security tab
4. **package.json** - ✅ Includes speakeasy and qrcode dependencies

### Verify 2FA files are properly integrated:

**Settings Page (src/app/(main)/settings/page.tsx):**
- Line 43: Imports `TwoFactorSettings`
- Line 410: Has security tab in TabsList
- Lines 807-819: Renders the Security tab content

**Settings Component (src/components/twoFactorSettings.tsx):**
- Properly exported as `export function TwoFactorSettings`
- Accepts `user` prop of type `User`
- Handles enable/disable/verify flow

**Auth Context (src/context/AuthContext.tsx):**
- Handles 2FA verification and login flow

## Solution 3: Check Browser Console Errors

If you've already installed Node.js but still don't see the 2FA feature:

1. Open the application in your browser
2. Press F12 to open developer tools
3. Check the **Console** tab for errors
4. Look for:
   - Module not found errors
   - TypeScript compilation errors
   - Import/export errors

Common errors might include:
```javascript
Module not found: Can't resolve 'speakeasy'
Module not found: Can't resolve 'qrcode'
Property 'twoFactorEnabled' does not exist on type 'User'
```

If you see these, run `npm install` to fix the module issues.

## Solution 4: Reset Application Data

If you've previously used the application, try clearing the local storage:

1. Open browser developer tools (F12)
2. Go to **Application** > **Local Storage** > `http://localhost:3000`
3. Delete the `rateease.user` and `rateease.store` items
4. Refresh the page

## Expected Behavior

After successful installation, you should see:

1. **Security tab in Settings** - Click Settings > Security
2. **2FA Settings card** - Shows Two-Factor Authentication status
3. **Enable/Disable button** - Toggle 2FA on/off
4. **QR code for setup** - When enabling 2FA
5. **Recovery codes** - Generated during 2FA setup

## Note for Production Deployment

If you're deploying this application to a server, ensure Node.js and npm are properly configured on the server and that you run `npm install && npm run build` before deploying.
