# LumiPath Subdirectory Deployment Guide

## Overview
This guide explains how to deploy your React app to `luminaricro.com/lumipath` using Vercel hosting with a reverse proxy from your main domain.

## Architecture
```
luminaricro.com (Main site - DreamHost)
    └── /lumipath (React App - Vercel)
```

---

## Part 1: Vercel Configuration (COMPLETED ✓)

### Files Modified:
1. **`package.json`** - Added `"homepage": "/lumipath"`
2. **`src/App.js`** - Added `basename="/lumipath"` to Router
3. **`vercel.json`** - Created with routing rules

### What These Changes Do:
- **homepage field**: Tells Create React App to build assets with `/lumipath` prefix
- **basename prop**: Tells React Router that all routes start from `/lumipath`
- **vercel.json**: Configures Vercel's routing to handle the subdirectory properly

### Deploy to Vercel:
```bash
# Commit the changes
git add .
git commit -m "Configure app for /lumipath subdirectory deployment"
git push

# Vercel will auto-deploy if connected to your repo
# Or manually deploy:
vercel --prod
```

After deployment, your app will be available at:
- `https://your-vercel-url.vercel.app/lumipath`

---

## Part 2: DreamHost Reverse Proxy Setup

### Step 1: Access Your DreamHost Account
1. Log into DreamHost Panel: https://panel.dreamhost.com
2. Navigate to **Domains** → **Manage Domains**
3. Find `luminaricro.com` and click **Edit** or **Manage**

### Step 2: Access Your Website Files

**Option A: Using DreamHost File Manager (Easier)**
1. In DreamHost Panel, go to **Files** → **File Manager**
2. Navigate to your website's root directory (usually `/home/username/luminaricro.com/`)

**Option B: Using FTP/SFTP (Recommended)**
1. In DreamHost Panel, go to **Users** → **Manage Users**
2. Find your SFTP credentials (hostname, username, password)
3. Connect using FileZilla, Cyberduck, or similar FTP client
4. Navigate to your website root directory

**Option C: Using SSH (Advanced)**
1. In DreamHost Panel, ensure SSH access is enabled for your user
2. Connect via terminal:
   ```bash
   ssh username@luminaricro.com
   cd ~/luminaricro.com
   ```

### Step 3: Configure Apache Reverse Proxy

DreamHost uses Apache web server. You'll need to create/edit the `.htaccess` file.

**Create or Edit `.htaccess` in your website root directory:**

```apache
# Enable Rewrite Engine
RewriteEngine On

# Handle /lumipath requests - redirect to Vercel
RewriteCond %{REQUEST_URI} ^/lumipath(/.*)?$ [NC]
RewriteRule ^lumipath(/.*)?$ https://YOUR-VERCEL-URL.vercel.app/lumipath$1 [P,L]

# Preserve headers when proxying
<IfModule mod_headers.c>
    RequestHeader set X-Forwarded-Proto "https"
    RequestHeader set X-Forwarded-Host "luminaricro.com"
</IfModule>

# Optional: Handle trailing slash
RewriteRule ^lumipath$ /lumipath/ [R=301,L]
```

**IMPORTANT:** Replace `YOUR-VERCEL-URL.vercel.app` with your actual Vercel deployment URL.

### Step 4: Verify Proxy Modules (May Require Support)

DreamHost needs these Apache modules enabled:
- `mod_proxy`
- `mod_proxy_http`
- `mod_headers`
- `mod_rewrite` (usually enabled by default)

**Check if proxy is working:**
1. Save your `.htaccess` file
2. Visit `http://luminaricro.com/lumipath` in your browser

**If you get a 500 error or proxy doesn't work:**
- Contact DreamHost support and request them to enable `mod_proxy` and `mod_proxy_http` for your domain
- Reference support article: https://help.dreamhost.com/hc/en-us/articles/216456227-htaccess-overview

---

## Part 3: Alternative Approaches (If Proxy Doesn't Work)

### Option 1: Use Vercel's Built-in Domain Management
Instead of proxying through DreamHost:

1. In Vercel dashboard, go to your project → **Settings** → **Domains**
2. Add custom domain: `lumipath.luminaricro.com` (subdomain)
3. Vercel will provide DNS records
4. In DreamHost, add these DNS records for the subdomain
5. Users access via `lumipath.luminaricro.com` instead of `luminaricro.com/lumipath`

### Option 2: Use an Iframe (Not Recommended)
Create a page at `luminaricro.com/lumipath/index.html`:
```html
<!DOCTYPE html>
<html>
<head>
    <title>LumiPath</title>
    <style>
        body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; }
        iframe { border: 0; width: 100%; height: 100%; }
    </style>
</head>
<body>
    <iframe src="https://YOUR-VERCEL-URL.vercel.app/lumipath"></iframe>
</body>
</html>
```

**Downsides:** SEO issues, URL doesn't change, authentication issues

---

## Part 4: Testing Your Deployment

### Local Testing (Before Deployment):
```bash
# Build the app
npm run build

# Test the build locally with subdirectory
npx serve -s build -l 3000
# Visit: http://localhost:3000/lumipath
```

### After Deployment Checklist:
- [ ] Visit `luminaricro.com/lumipath` - does it load?
- [ ] Test navigation - do all routes work?
- [ ] Check browser console for errors
- [ ] Test login/authentication
- [ ] Verify images and assets load correctly
- [ ] Test on mobile devices
- [ ] Check HTTPS certificate

---

## Troubleshooting

### Issue: Assets (CSS/JS) not loading
**Symptom:** White screen, console shows 404 for CSS/JS files

**Fix:** Verify `homepage` in `package.json`:
```json
"homepage": "/lumipath"
```
Rebuild and redeploy.

### Issue: Routes return 404
**Symptom:** Direct URL access like `/lumipath/protocol` gives 404

**Fix:** Check `vercel.json` rewrites are correct. Ensure DreamHost `.htaccess` proxies all `/lumipath/*` paths.

### Issue: Proxy returns 403/500 error
**Contact DreamHost support to enable:**
- `mod_proxy`
- `mod_proxy_http`

### Issue: Authentication doesn't work
**Check:**
1. API endpoint URLs in your app still point to correct backend
2. CORS settings on backend allow requests from `luminaricro.com`
3. Cookie settings if using cookie-based auth

---

## Backend API Considerations

Your app currently uses:
```json
"proxy": "http://localhost:4000"
```

**For production, ensure:**
1. Environment variables set correctly:
   ```javascript
   const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';
   ```

2. Backend CORS allows `luminaricro.com`:
   ```javascript
   // In your backend
   cors({
       origin: ['https://luminaricro.com', 'https://YOUR-VERCEL-URL.vercel.app']
   })
   ```

3. Update any hardcoded API URLs in your components

---

## Summary

### What You've Done:
✓ Configured React app for subdirectory deployment
✓ Created Vercel routing configuration
✓ Set up React Router basename

### What You Need To Do:
1. Commit and push changes to trigger Vercel deployment
2. Get your Vercel deployment URL
3. Access your DreamHost account
4. Create/edit `.htaccess` file with reverse proxy rules
5. Contact DreamHost support if proxy modules aren't enabled
6. Test the deployment thoroughly

### Key URLs:
- Main site: `https://luminaricro.com`
- React app: `https://luminaricro.com/lumipath`
- Vercel direct: `https://YOUR-VERCEL-URL.vercel.app/lumipath`

---

## Need Help?

### DreamHost Resources:
- Support: https://panel.dreamhost.com/index.cgi?tree=support.msg
- Proxy documentation: https://help.dreamhost.com/hc/en-us/articles/216456227
- SSH access: https://help.dreamhost.com/hc/en-us/articles/216385837

### Vercel Resources:
- Dashboard: https://vercel.com/dashboard
- Documentation: https://vercel.com/docs
- Custom domains: https://vercel.com/docs/concepts/projects/domains

---

**Questions to answer before proceeding:**
1. What is your Vercel deployment URL?
2. Do you have FTP/SSH access to your DreamHost account?
3. Is your main site (luminaricro.com) static HTML, WordPress, or a custom app?
4. Where is your backend API hosted?
