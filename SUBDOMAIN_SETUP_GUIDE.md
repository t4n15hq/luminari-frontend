# LumiPath Subdomain Setup Guide (Recommended Method)

## Overview

Instead of using `luminaricro.com/lumipath`, you'll use a subdomain:
**`lumipath.luminaricro.com`**

### Why This Method is Better:
✅ No reverse proxy needed (simpler)
✅ No Apache modules required
✅ Better performance (direct connection to Vercel)
✅ SSL certificate automatically handled by Vercel
✅ Easier to maintain and troubleshoot
✅ Works with all DreamHost plans

---

## Architecture

```
luminaricro.com → Your main website (DreamHost)
lumipath.luminaricro.com → React App (Vercel)
```

Users will access your app at: **https://lumipath.luminaricro.com**

---

## Step-by-Step Setup

### Part 1: Deploy to Vercel (First Time Setup)

#### Step 1.1: Ensure Your Code is Ready

Your app configuration has been updated to work at the root domain level (no subdirectory).

**Verify the changes:**
```bash
cd /Users/tanishqpadwal/Desktop/Luminari/luminari\ fe/skin-disease-frontend

# Check that these are correct:
grep -A 2 '"name"' package.json  # Should NOT have "homepage" field
grep 'Router' src/App.js  # Should be: <Router> (no basename)
```

#### Step 1.2: Commit and Push Changes

```bash
git add .
git commit -m "Configure app for subdomain deployment (lumipath.luminaricro.com)"
git push
```

Vercel will automatically deploy if your repo is connected.

---

### Part 2: Add Custom Domain in Vercel

#### Step 2.1: Access Vercel Dashboard

1. Go to: **https://vercel.com/dashboard**
2. Log in with your Vercel account
3. Click on your **`luminari-frontend`** project

#### Step 2.2: Navigate to Domains Settings

1. Click on **"Settings"** tab (top navigation)
2. In the left sidebar, click **"Domains"**
3. You'll see a section titled "Domains"

![Vercel Domains Section](https://assets.vercel.com/image/upload/v1/domains-settings.png)

#### Step 2.3: Add Your Subdomain

1. Find the input field that says "Enter domain or subdomain"
2. Type: **`lumipath.luminaricro.com`**
3. Click **"Add"** button

![Add Domain](https://assets.vercel.com/image/upload/v1/add-domain.png)

#### Step 2.4: Get DNS Configuration

After clicking "Add", Vercel will show you DNS records that need to be added.

**You'll see one of these configurations:**

**Option A: CNAME Record (Most Common)**
```
Type: CNAME
Name: lumipath
Value: cname.vercel-dns.com
```

**Option B: A Record (Less Common)**
```
Type: A
Name: lumipath
Value: 76.76.21.21
```

**IMPORTANT:** Take a screenshot or write down these values! You'll need them for DreamHost.

---

### Part 3: Configure DNS in DreamHost

#### Step 3.1: Log into DreamHost Panel

1. Go to: **https://panel.dreamhost.com**
2. Enter your credentials
3. Click "Sign In"

#### Step 3.2: Navigate to DNS Settings

1. In the left sidebar, click **"Domains"**
2. Click **"Manage Domains"**
3. Find `luminaricro.com` in the list
4. Click **"DNS"** link next to your domain

Or go directly to: https://panel.dreamhost.com/index.cgi?tree=domain.dashboard

![DreamHost DNS](https://help.dreamhost.com/hc/article_attachments/4402989943828/dns_menu.png)

#### Step 3.3: Add Custom DNS Record

1. Scroll down to the **"Add a custom DNS record to luminaricro.com"** section
2. You'll see a form with these fields:

```
┌─────────────────────────────────────────┐
│ Name:  [          ]                     │
│ Type:  [Dropdown ▼]                     │
│ Value: [          ]                     │
│ Comment: [       ] (optional)           │
│                                         │
│        [Add Record Now!] button         │
└─────────────────────────────────────────┘
```

#### Step 3.4: Fill in the DNS Record

**If Vercel gave you a CNAME record (most common):**

```
Name: lumipath
Type: CNAME
Value: cname.vercel-dns.com
Comment: Vercel subdomain for LumiPath
```

**If Vercel gave you an A record:**

```
Name: lumipath
Type: A
Value: 76.76.21.21
Comment: Vercel subdomain for LumiPath
```

**Screenshot of filled form:**
```
┌─────────────────────────────────────────┐
│ Name:  lumipath                         │
│ Type:  CNAME              ▼             │
│ Value: cname.vercel-dns.com             │
│ Comment: Vercel subdomain               │
│                                         │
│        [Add Record Now!]                │
└─────────────────────────────────────────┘
```

#### Step 3.5: Save the Record

1. Double-check all values match what Vercel provided
2. Click **"Add Record Now!"** button
3. You'll see a success message
4. The record will appear in the "Custom DNS Records" list below

---

### Part 4: Verify DNS Configuration in DreamHost

After adding the record, you should see it in the list:

```
Custom DNS records for luminaricro.com
┌─────────────────────────────────────────────────────────┐
│ Name              Type    Value                  Actions │
│ lumipath          CNAME   cname.vercel-dns.com   Delete  │
└─────────────────────────────────────────────────────────┘
```

**Important Notes:**
- DNS changes can take 5 minutes to 48 hours to propagate (usually 5-30 minutes)
- Don't delete or modify the record once added
- If you made a mistake, click "Delete" and add a new record

---

### Part 5: Verify Domain in Vercel

#### Step 5.1: Return to Vercel Dashboard

1. Go back to your Vercel project: https://vercel.com/dashboard
2. Click on **Settings** → **Domains**
3. Find `lumipath.luminaricro.com` in the list

#### Step 5.2: Check Domain Status

You'll see one of these statuses:

**🟡 "Pending Verification"**
- DNS records haven't propagated yet
- Wait 5-30 minutes
- Refresh the page periodically

**✅ "Valid Configuration"**
- DNS is configured correctly!
- SSL certificate is being provisioned
- Your site will be live soon

**❌ "Invalid Configuration"**
- DNS records are incorrect
- Click on the domain for details
- Fix the DNS records in DreamHost

#### Step 5.3: Wait for SSL Certificate

Once DNS is verified, Vercel automatically provisions an SSL certificate.

This usually takes 1-5 minutes. You'll see:
```
✅ lumipath.luminaricro.com
   SSL Certificate: Active
```

---

### Part 6: Test Your Deployment

#### Step 6.1: Test the Subdomain

Open your browser and visit:
**https://lumipath.luminaricro.com**

**What you should see:**
- ✅ Your React app loads
- ✅ URL shows `lumipath.luminaricro.com`
- ✅ Green lock icon (SSL)
- ✅ No certificate warnings

#### Step 6.2: Test All Routes

Test these URLs directly:
```
https://lumipath.luminaricro.com/
https://lumipath.luminaricro.com/login
https://lumipath.luminaricro.com/protocol
https://lumipath.luminaricro.com/diagnosis
https://lumipath.luminaricro.com/profile
```

All should work without 404 errors.

#### Step 6.3: Test Navigation

1. Click through your app navigation
2. Use browser back/forward buttons
3. Refresh pages (F5)
4. Check that images/styles load

#### Step 6.4: Open Developer Console

Press F12 (or Cmd+Option+I on Mac) and check:
- **Console tab:** No red errors
- **Network tab:** All requests successful (green)
- **Application tab:** Service workers (if any) working

---

## Complete Setup Checklist

Use this to track your progress:

### Vercel Setup
- [ ] Removed subdirectory configuration from app
- [ ] Committed and pushed changes to Git
- [ ] Vercel deployed the latest version
- [ ] Added `lumipath.luminaricro.com` in Vercel Domains
- [ ] Copied DNS records from Vercel

### DreamHost Setup
- [ ] Logged into DreamHost panel
- [ ] Navigated to DNS settings for luminaricro.com
- [ ] Added CNAME/A record for `lumipath` subdomain
- [ ] Verified record appears in DNS list

### Verification
- [ ] Waited 15-30 minutes for DNS propagation
- [ ] Vercel shows "Valid Configuration"
- [ ] SSL certificate is active
- [ ] Site loads at https://lumipath.luminaricro.com
- [ ] All routes work correctly
- [ ] No console errors
- [ ] Images and styles load
- [ ] Login/authentication works
- [ ] Tested on mobile device

---

## Checking DNS Propagation

Want to check if DNS has propagated? Use these tools:

### Online Tools (Easiest)

1. **DNS Checker:** https://dnschecker.org/
   - Enter: `lumipath.luminaricro.com`
   - Type: CNAME (or A)
   - Click "Search"
   - See propagation worldwide

2. **What's My DNS:** https://www.whatsmydns.net/
   - Enter: `lumipath.luminaricro.com`
   - Select: CNAME
   - Shows real-time propagation

3. **MX Toolbox:** https://mxtoolbox.com/DNSLookup.aspx
   - Enter: `lumipath.luminaricro.com`
   - Check results

### Command Line (Advanced)

**Check CNAME Record:**
```bash
# Mac/Linux
dig lumipath.luminaricro.com CNAME +short

# Expected output: cname.vercel-dns.com
```

```bash
# Windows PowerShell
nslookup lumipath.luminaricro.com

# Should show: cname.vercel-dns.com
```

**Check if it resolves to an IP:**
```bash
ping lumipath.luminaricro.com

# Should get responses (means DNS works)
```

---

## Troubleshooting

### ❌ Issue 1: "Domain is not verified after 1 hour"

**Possible causes:**
1. DNS record not added correctly
2. Typo in the subdomain name
3. DNS cache on your side

**Solutions:**

1. **Verify DNS Record in DreamHost:**
   - Go to Domains → DNS
   - Confirm `lumipath` CNAME exists
   - Value should be exactly what Vercel provided

2. **Re-check Vercel Requirements:**
   - Go to Vercel Domains settings
   - Click on `lumipath.luminaricro.com`
   - Compare DNS values with what's in DreamHost

3. **Try DNS Checker:**
   - Use https://dnschecker.org/
   - If it shows the correct record globally, just wait longer

4. **Contact DreamHost:**
   - Sometimes DNS updates are delayed
   - Chat: https://panel.dreamhost.com/index.cgi?tree=support.msg

---

### ❌ Issue 2: "DNS record conflicts with existing subdomain"

**Error message:** "lumipath is already used for another service"

**Cause:** You already have `lumipath.luminaricro.com` configured as:
- A subdomain hosting in DreamHost
- Email subdomain
- Another DNS record

**Solution:**
1. In DreamHost, go to **Domains** → **Manage Domains**
2. Check if `lumipath.luminaricro.com` is listed
3. If it exists as a hosted subdomain:
   - Click "Remove" or "Delete"
   - Confirm deletion
   - Wait 5 minutes
4. Then add the CNAME record as instructed

---

### ❌ Issue 3: "SSL Certificate not provisioning"

**Status stuck on:** "Pending SSL Certificate"

**Causes:**
- DNS not fully propagated
- CAA records blocking certificate
- Rate limiting from Let's Encrypt

**Solutions:**

1. **Wait Longer:** SSL can take up to 24 hours in rare cases

2. **Check CAA Records:**
   ```bash
   dig luminaricro.com CAA
   ```
   If you have CAA records, ensure they allow Let's Encrypt:
   ```
   luminaricro.com. CAA 0 issue "letsencrypt.org"
   ```

3. **Remove and Re-add Domain:**
   - In Vercel, click "Remove" on the domain
   - Wait 5 minutes
   - Add it again

---

### ❌ Issue 4: "Site loads but shows Vercel deployment URL"

**Example:** Site works at `luminari-frontend-abc123.vercel.app` but not at subdomain

**Cause:** DNS not configured or not propagated

**Solution:**
1. Check DNS with: https://dnschecker.org/
2. If it doesn't show your CNAME record, re-check DreamHost settings
3. Clear your browser cache (Ctrl+Shift+Delete)
4. Try incognito/private browsing mode

---

### ❌ Issue 5: "API requests failing after switching to subdomain"

**Symptom:** Login doesn't work, data doesn't load

**Cause:** Your backend API CORS settings don't allow the new subdomain

**Solution:**

Update your backend CORS configuration to allow:
```javascript
// Example for Node.js/Express backend
const cors = require('cors');

app.use(cors({
  origin: [
    'https://lumipath.luminaricro.com',
    'https://luminaricro.com',
    'http://localhost:3000' // for development
  ],
  credentials: true
}));
```

**Environment Variables:**
If your frontend has API URL configured:
```bash
# Check your .env file or Vercel environment variables
REACT_APP_API_URL=https://your-backend-api.com
```

Make sure it points to the correct backend.

---

### ❌ Issue 6: "404 on page refresh"

**Symptom:** Direct URLs work, but refreshing gives 404

**Cause:** Vercel needs SPA routing configuration

**Solution:**

Create `vercel.json` in your project root:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Commit and push:
```bash
git add vercel.json
git commit -m "Add SPA routing for Vercel"
git push
```

---

## Updating Your Backend API CORS

Your app likely connects to a backend API. Update CORS to allow the new subdomain:

### Node.js/Express Example:

```javascript
// backend/server.js or app.js
const cors = require('cors');

app.use(cors({
  origin: [
    'https://lumipath.luminaricro.com',  // Production subdomain
    'http://localhost:3000'               // Development
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Python/Flask Example:

```python
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=[
    "https://lumipath.luminaricro.com",
    "http://localhost:3000"
])
```

### Django Example:

```python
# settings.py
CORS_ALLOWED_ORIGINS = [
    "https://lumipath.luminaricro.com",
    "http://localhost:3000",
]

CORS_ALLOW_CREDENTIALS = True
```

---

## Setting Environment Variables in Vercel

If your app uses environment variables:

### Step 1: Access Environment Variables

1. Go to Vercel Dashboard → Your Project
2. Click **Settings** → **Environment Variables**

### Step 2: Add Variables

Common variables you might need:

```
REACT_APP_API_URL = https://your-backend-api.com
REACT_APP_ENV = production
```

### Step 3: Redeploy

After adding variables:
1. Go to **Deployments** tab
2. Find the latest deployment
3. Click the three dots (⋯) → "Redeploy"
4. Select "Use existing Build Cache: No"
5. Click "Redeploy"

---

## Redirecting Old URL (Optional)

If you had content at `luminaricro.com/lumipath` before, redirect it:

### Create .htaccess in DreamHost

In your `luminaricro.com` root directory:

```apache
# Redirect /lumipath to subdomain
RewriteEngine On
RewriteRule ^lumipath(/.*)?$ https://lumipath.luminaricro.com$1 [R=301,L]
```

This redirects:
- `luminaricro.com/lumipath` → `lumipath.luminaricro.com`
- `luminaricro.com/lumipath/protocol` → `lumipath.luminaricro.com/protocol`

---

## Performance & Monitoring

### Enable Vercel Analytics (Optional)

1. Go to your Vercel project
2. Click **Analytics** tab
3. Enable Vercel Analytics
4. Get insights on:
   - Page load times
   - User traffic
   - Core Web Vitals

### Monitor Uptime

Use free monitoring services:
- **UptimeRobot:** https://uptimerobot.com/
- **Pingdom:** https://www.pingdom.com/
- **StatusCake:** https://www.statuscake.com/

---

## Comparison: Subdomain vs. Subdirectory

| Feature | Subdomain (lumipath.luminaricro.com) | Subdirectory (luminaricro.com/lumipath) |
|---------|--------------------------------------|------------------------------------------|
| Setup Complexity | ⭐⭐ Easy | ⭐⭐⭐⭐ Complex |
| Requires Proxy | ❌ No | ✅ Yes |
| SSL Setup | 🤖 Automatic | 🤖 Automatic (if main site has SSL) |
| Performance | ⚡ Direct to Vercel | 🐌 Extra hop through proxy |
| DreamHost Requirements | DNS access only | Proxy modules needed |
| Maintenance | ✅ Low | ⚠️ Higher |
| SEO Impact | Treated as separate site | Part of main site |
| Cookie Sharing | ✅ Can share (same root domain) | ✅ Can share |
| Best For | Separate apps, microservices | Unified site experience |

**Recommendation:** Use subdomain (current approach) ✅

---

## Success Checklist

Once everything is set up:

### Technical Verification
- [ ] https://lumipath.luminaricro.com loads correctly
- [ ] SSL certificate is valid (green padlock)
- [ ] All routes work (test 5+ pages)
- [ ] Login/authentication functions
- [ ] API calls succeed
- [ ] Images and assets load
- [ ] No console errors
- [ ] Mobile responsive

### Documentation
- [ ] Update internal documentation with new URL
- [ ] Update bookmarks
- [ ] Notify team members
- [ ] Update README if applicable

### Monitoring
- [ ] Set up uptime monitoring
- [ ] Configure Vercel Analytics (optional)
- [ ] Test from different devices/browsers
- [ ] Verify from different locations (VPN/proxy)

---

## Getting Help

### Vercel Support
- Documentation: https://vercel.com/docs
- Support: https://vercel.com/support
- Community: https://github.com/vercel/vercel/discussions

### DreamHost Support
- Live Chat: https://panel.dreamhost.com/index.cgi?tree=support.msg (24/7)
- Knowledge Base: https://help.dreamhost.com/
- DNS Help: https://help.dreamhost.com/hc/en-us/articles/360035516812

### Common Support Questions

**To Vercel Support:**
> "I'm trying to add custom domain lumipath.luminaricro.com but it's not verifying. I've added the DNS records in DreamHost. Can you help?"

**To DreamHost Support:**
> "I need to add a CNAME record for subdomain 'lumipath' pointing to 'cname.vercel-dns.com'. I'm following the custom DNS steps but need confirmation it's set up correctly."

---

## Summary

You've set up:
- ✅ Removed subdirectory configuration
- ✅ Configured for root-level deployment
- ✅ Instructions to add custom domain in Vercel
- ✅ Instructions to configure DNS in DreamHost
- ✅ Testing and verification steps

### Final URL Structure:
```
Main Site:    https://luminaricro.com
LumiPath App: https://lumipath.luminaricro.com
```

**Next Steps:**
1. Commit and push the code changes
2. Add domain in Vercel
3. Configure DNS in DreamHost
4. Wait for DNS propagation (15-30 min)
5. Test thoroughly
6. Update backend CORS if needed

---

**You're all set! The subdomain approach is much cleaner than reverse proxy.** 🎉

Need help with any specific step? Let me know!
