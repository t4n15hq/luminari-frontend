# DreamHost Reverse Proxy Setup - Detailed Step-by-Step Guide

## Prerequisites

Before starting, gather this information:
- [ ] Your DreamHost panel login credentials
- [ ] Your Vercel deployment URL (e.g., `luminari-frontend.vercel.app`)
- [ ] Your domain name: `luminaricro.com`

---

## Method 1: Using DreamHost File Manager (Easiest - No Software Needed)

### Step 1: Log into DreamHost Panel

1. Open your browser and go to: **https://panel.dreamhost.com**
2. Enter your DreamHost username and password
3. Click "Sign In"

![DreamHost Login](https://help.dreamhost.com/hc/article_attachments/360071693451/01_Panel_login.png)

---

### Step 2: Access File Manager

1. Once logged in, look at the left sidebar menu
2. Click on **"Files"** (it has a folder icon)
3. From the submenu, click **"File Manager"**

Or directly visit: https://panel.dreamhost.com/index.cgi?tree=files.fileman

![File Manager Location](https://help.dreamhost.com/hc/article_attachments/4402989943828/file_manager_panel_link.png)

---

### Step 3: Navigate to Your Website Directory

1. In the File Manager, you'll see a list of directories
2. Look for your domain folder - it should be named:
   - `luminaricro.com` OR
   - Something like `/home/your-username/luminaricro.com`

3. **Click on the folder name** to open it
4. You should now see the contents of your website

**What you might see:**
- `index.html` or `index.php` (your homepage)
- Folders like `css/`, `js/`, `images/`
- A `.htaccess` file (it might be hidden)

---

### Step 4: Show Hidden Files (Important!)

`.htaccess` files are hidden by default. To see them:

1. Look for a **"Settings"** or **"View Options"** button (usually top-right)
2. Find and check the option: **"Show hidden files"** or **"Show dot files"**
3. Click "Apply" or "Save"

Now you should see files starting with a dot (`.htaccess`, `.htpasswd`, etc.)

---

### Step 5: Check if .htaccess Exists

**If `.htaccess` EXISTS:**
1. Click on the `.htaccess` file to select it
2. Click the **"Edit"** button (or right-click → Edit)
3. The file will open in an editor
4. **IMPORTANT:** Copy the existing content to a text file on your computer as a backup!
5. Skip to **Step 6**

**If `.htaccess` DOES NOT exist:**
1. Click the **"New File"** or **"Create File"** button
2. Name it exactly: `.htaccess` (with the dot at the beginning)
3. Click "Create" or "Save"
4. Now click on the newly created `.htaccess` file
5. Click **"Edit"** button
6. Continue to **Step 6**

---

### Step 6: Add Reverse Proxy Configuration

Now you'll add the configuration. **You need your Vercel URL first!**

#### 6.1: Get Your Vercel URL

1. Open a new browser tab
2. Go to: **https://vercel.com/dashboard**
3. Click on your `luminari-frontend` project
4. Look for the **"Domains"** section
5. Copy the Vercel URL - it looks like: `luminari-frontend-abc123.vercel.app`

**Screenshot example:**
```
Domains
├─ luminari-frontend-abc123.vercel.app (Vercel URL)
└─ (your custom domains if any)
```

#### 6.2: Copy the Configuration

Copy this code and paste it into your `.htaccess` file:

```apache
# ==========================================
# LumiPath Reverse Proxy Configuration
# ==========================================

# Enable Rewrite Engine
RewriteEngine On

# Redirect /lumipath (without trailing slash) to /lumipath/
RewriteRule ^lumipath$ /lumipath/ [R=301,L]

# Proxy all /lumipath/* requests to Vercel
RewriteCond %{REQUEST_URI} ^/lumipath(/.*)?$ [NC]
RewriteRule ^lumipath(/.*)?$ https://YOUR-VERCEL-URL.vercel.app/lumipath$1 [P,L]

# Set proper headers for proxied requests
<IfModule mod_headers.c>
    # Preserve the original protocol
    RequestHeader set X-Forwarded-Proto "https"

    # Tell Vercel what domain the request came from
    RequestHeader set X-Forwarded-Host "luminaricro.com"

    # Allow Vercel to set response headers
    Header set Access-Control-Allow-Origin "*"
</IfModule>

# Error handling - show friendly error if proxy fails
ErrorDocument 502 "LumiPath is temporarily unavailable. Please try again later."
ErrorDocument 503 "LumiPath is temporarily unavailable. Please try again later."

# ==========================================
# End LumiPath Configuration
# ==========================================
```

#### 6.3: Replace YOUR-VERCEL-URL

**CRITICAL STEP:**
1. Find this line in the code you just pasted:
   ```
   RewriteRule ^lumipath(/.*)?$ https://YOUR-VERCEL-URL.vercel.app/lumipath$1 [P,L]
   ```

2. Replace `YOUR-VERCEL-URL` with your actual Vercel URL from step 6.1

**Example - BEFORE:**
```apache
RewriteRule ^lumipath(/.*)?$ https://YOUR-VERCEL-URL.vercel.app/lumipath$1 [P,L]
```

**Example - AFTER:**
```apache
RewriteRule ^lumipath(/.*)?$ https://luminari-frontend-abc123.vercel.app/lumipath$1 [P,L]
```

#### 6.4: Preserve Existing Rules (If Any)

**If your `.htaccess` already had content:**
- Add the LumiPath configuration **at the end** of the file
- Keep all existing rules above it
- Make sure there's only ONE `RewriteEngine On` statement at the top

---

### Step 7: Save the File

1. Click the **"Save"** or **"Save Changes"** button
2. If prompted, confirm you want to save
3. Close the editor

---

### Step 8: Test Your Configuration

1. Open a new browser tab
2. Go to: **https://luminaricro.com/lumipath**
3. You should see your React app loading!

**What to check:**
- ✅ Page loads without errors
- ✅ You can navigate to different pages
- ✅ URL shows `luminaricro.com/lumipath` (not the Vercel URL)
- ✅ Images and styles load correctly

---

## Method 2: Using SFTP (FileZilla) - More Control

### Step 1: Get Your SFTP Credentials

1. Log into DreamHost Panel: https://panel.dreamhost.com
2. Click **"Users"** → **"Manage Users"** in the left sidebar
3. Find your user (usually listed with your domain)
4. Write down these details:

```
SFTP Server: sftp://YOUR-DOMAIN.dreamhost.com (or sftp://luminaricro.com)
Username: your_dreamhost_username
Password: your_password
Port: 22
```

**If you don't remember the password:**
- Click "Edit" next to your user
- Set a new password
- Save

---

### Step 2: Download and Install FileZilla

1. Go to: **https://filezilla-project.org/download.php?type=client**
2. Download FileZilla Client (Free)
3. Install it on your computer

---

### Step 3: Connect to DreamHost via SFTP

1. Open FileZilla
2. At the top of the screen, fill in these fields:

```
Host: sftp://luminaricro.com
Username: [your DreamHost username]
Password: [your password]
Port: 22
```

3. Click **"Quickconnect"**

**First-time connection:**
- You'll see a certificate warning popup
- Check "Always trust this host"
- Click "OK"

---

### Step 4: Navigate to Your Website Directory

1. In the **"Remote site"** panel (right side of FileZilla):
   - You'll see a directory listing
   - Navigate to your website folder:
     ```
     /home/your-username/luminaricro.com/
     ```

2. You should see your website files here

---

### Step 5: Show Hidden Files

1. In FileZilla, click **"Server"** menu
2. Select **"Force showing hidden files"**
3. Now you'll see `.htaccess` if it exists

---

### Step 6: Edit .htaccess

**Option A: Edit directly in FileZilla (Recommended)**

1. Right-click on `.htaccess` (or create it if it doesn't exist)
2. Select **"View/Edit"**
3. FileZilla will download and open it in your default text editor
4. Make your changes (paste the configuration from Method 1, Step 6.2)
5. **Save the file** in your text editor (Ctrl+S / Cmd+S)
6. FileZilla will detect the change and ask to re-upload
7. Click **"Yes"** to upload the modified file

**Option B: Edit locally and upload**

1. Create a new file on your computer called `.htaccess`
2. Open it in a text editor (Notepad++, VSCode, TextEdit, etc.)
3. Paste the configuration from Method 1, Step 6.2
4. Replace `YOUR-VERCEL-URL` with your actual URL
5. Save the file
6. In FileZilla, drag the `.htaccess` from your local computer to the remote site
7. Confirm overwrite if asked

---

### Step 7: Verify Upload

1. In FileZilla's **"Remote site"** panel, you should see `.htaccess`
2. Check the "Last Modified" date - it should be recent
3. Right-click → View to verify your changes were saved

---

### Step 8: Test (Same as Method 1, Step 8)

Visit: **https://luminaricro.com/lumipath**

---

## Method 3: Using SSH (Most Advanced)

### Step 1: Enable SSH Access

1. Log into DreamHost Panel
2. Go to **"Users"** → **"Manage Users"**
3. Click **"Edit"** next to your user
4. Under "User Type", select **"Shell User - Bash"**
5. If prompted for shell type, choose **"/bin/bash"**
6. Save changes
7. Wait 5-10 minutes for changes to take effect

---

### Step 2: Connect via SSH

**On Mac/Linux:**
```bash
ssh your-username@luminaricro.com
# Enter password when prompted
```

**On Windows:**
Use PowerShell or install Git Bash:
```bash
ssh your-username@luminaricro.com
```

---

### Step 3: Navigate to Website Directory

```bash
cd ~/luminaricro.com
```

Check if you're in the right place:
```bash
pwd
# Should output: /home/your-username/luminaricro.com
```

List files (including hidden):
```bash
ls -la
```

---

### Step 4: Backup Existing .htaccess (If It Exists)

```bash
# Check if .htaccess exists
ls -la | grep .htaccess

# If it exists, create a backup
cp .htaccess .htaccess.backup

# Verify backup was created
ls -la | grep .htaccess
```

---

### Step 5: Edit .htaccess with nano

```bash
nano .htaccess
```

This opens the nano text editor.

**If file is new (empty):**
- Just start typing/pasting

**If file has content:**
- Use arrow keys to navigate to the end
- Add the new configuration

---

### Step 6: Paste Configuration

1. Copy the configuration from Method 1, Step 6.2 to your clipboard
2. In the SSH terminal, **right-click** to paste (or Shift+Insert on Windows)
3. Replace `YOUR-VERCEL-URL` with your actual Vercel URL

**Nano keyboard shortcuts:**
- **Ctrl + O** = Save (Write Out)
- **Enter** = Confirm filename
- **Ctrl + X** = Exit nano

---

### Step 7: Verify File Contents

```bash
cat .htaccess
```

This displays the file contents. Verify your configuration is there.

---

### Step 8: Check File Permissions

```bash
chmod 644 .htaccess
```

This ensures proper permissions.

---

### Step 9: Test Configuration

```bash
# Check Apache configuration syntax (if available)
apachectl configtest

# Or just view the file again
cat .htaccess
```

Visit: **https://luminaricro.com/lumipath**

---

## Common Issues & Solutions

### ❌ Issue 1: "500 Internal Server Error"

**Cause:** Proxy modules not enabled on your DreamHost account

**Solution:**
1. Contact DreamHost support: https://panel.dreamhost.com/index.cgi?tree=support.msg
2. Use this message template:

```
Subject: Enable mod_proxy for Reverse Proxy

Hi DreamHost Support,

I need to set up a reverse proxy on my domain luminaricro.com
to forward requests from /lumipath to an external application.

Could you please enable the following Apache modules for my domain:
- mod_proxy
- mod_proxy_http
- mod_headers

Domain: luminaricro.com
User: [your username]

Thank you!
```

---

### ❌ Issue 2: ".htaccess file not working"

**Check these:**

1. **Is mod_rewrite enabled?**
   - Add this to your .htaccess as the FIRST line:
     ```apache
     # Test if mod_rewrite is working
     RewriteEngine On
     ```

2. **File permissions correct?**
   ```bash
   chmod 644 .htaccess
   ```

3. **Hidden characters?**
   - Make sure you saved as plain text (not Rich Text)
   - On Mac: TextEdit → Format → Make Plain Text

---

### ❌ Issue 3: "Page loads but URLs are wrong"

**Check:**
1. Did you add `basename="/lumipath"` in your React app? ✓ (We did this)
2. Did you add `"homepage": "/lumipath"` in package.json? ✓ (We did this)
3. Did you rebuild and redeploy to Vercel after making changes?

```bash
npm run build
git add .
git commit -m "Update for subdirectory"
git push
```

---

### ❌ Issue 4: "Assets (CSS/JS) not loading"

**Check Developer Console:**
1. Right-click on page → "Inspect" → "Console" tab
2. Look for 404 errors

**Fix:**
- Rebuild app: `npm run build`
- Clear browser cache
- Check that `homepage` in package.json is correct

---

### ❌ Issue 5: "Redirect loop" or "Too many redirects"

**Cause:** Conflicting rewrite rules

**Fix:**
1. Open `.htaccess`
2. Make sure LumiPath rules come AFTER existing rules
3. Check for duplicate `RewriteEngine On` statements (should only have ONE)

---

### ❌ Issue 6: "Cannot connect via SFTP/SSH"

**Check:**
1. **Correct hostname?** Use `luminaricro.com` or `YOUR-USER.dreamhosters.com`
2. **Port 22?** SFTP/SSH uses port 22, not port 21 (FTP)
3. **Shell access enabled?** Go to Users → Manage Users → Edit → Set to "Shell User"
4. **Waited 5-10 minutes?** Changes take time to propagate

---

## Testing Checklist

After setup, test these:

- [ ] https://luminaricro.com/lumipath - Homepage loads
- [ ] https://luminaricro.com/lumipath/protocol - Subpage loads
- [ ] https://luminaricro.com/lumipath/login - Login page works
- [ ] Browser URL bar shows `luminaricro.com` (not Vercel URL)
- [ ] No console errors (F12 → Console tab)
- [ ] Images and CSS load correctly
- [ ] Login/authentication works
- [ ] Navigation between pages works
- [ ] Refresh page works (doesn't show 404)

---

## Need More Help?

### DreamHost Support Options:

1. **Live Chat:** https://panel.dreamhost.com/index.cgi?tree=support.msg
   - Click "Contact Support" → "Live Chat"
   - Available 24/7

2. **Submit Ticket:** https://panel.dreamhost.com/index.cgi?tree=support.msg
   - Choose "Submit a Request"
   - Usually response within 24 hours

3. **Knowledge Base:** https://help.dreamhost.com/
   - Search for specific topics
   - Step-by-step guides with screenshots

### Useful DreamHost Articles:

- .htaccess overview: https://help.dreamhost.com/hc/en-us/articles/216456227
- SFTP guide: https://help.dreamhost.com/hc/en-us/articles/115000675027
- SSH access: https://help.dreamhost.com/hc/en-us/articles/216385837

---

## Quick Reference: Complete .htaccess File

Here's the complete configuration ready to copy/paste:

```apache
# ==========================================
# LumiPath Reverse Proxy Configuration
# ==========================================

# Enable Rewrite Engine
RewriteEngine On

# Redirect /lumipath (without trailing slash) to /lumipath/
RewriteRule ^lumipath$ /lumipath/ [R=301,L]

# Proxy all /lumipath/* requests to Vercel
RewriteCond %{REQUEST_URI} ^/lumipath(/.*)?$ [NC]
RewriteRule ^lumipath(/.*)?$ https://YOUR-VERCEL-URL.vercel.app/lumipath$1 [P,L]

# Set proper headers for proxied requests
<IfModule mod_headers.c>
    RequestHeader set X-Forwarded-Proto "https"
    RequestHeader set X-Forwarded-Host "luminaricro.com"
    Header set Access-Control-Allow-Origin "*"
</IfModule>

# Error handling
ErrorDocument 502 "LumiPath is temporarily unavailable. Please try again later."
ErrorDocument 503 "LumiPath is temporarily unavailable. Please try again later."

# ==========================================
# End LumiPath Configuration
# ==========================================
```

**Remember to replace:** `YOUR-VERCEL-URL` with your actual Vercel deployment URL!

---

## What This Configuration Does

Let me explain what each part does:

```apache
RewriteEngine On
```
↪ Turns on URL rewriting capability

```apache
RewriteRule ^lumipath$ /lumipath/ [R=301,L]
```
↪ If someone visits `/lumipath`, redirect them to `/lumipath/` (with trailing slash)

```apache
RewriteCond %{REQUEST_URI} ^/lumipath(/.*)?$ [NC]
RewriteRule ^lumipath(/.*)?$ https://YOUR-VERCEL-URL.vercel.app/lumipath$1 [P,L]
```
↪ Any request to `/lumipath/*` gets proxied (forwarded) to your Vercel app
↪ `[P]` = Proxy flag (forward the request)
↪ `[L]` = Last rule (stop processing after this)

```apache
RequestHeader set X-Forwarded-Host "luminaricro.com"
```
↪ Tells Vercel the request came from luminaricro.com (important for URLs)

```apache
ErrorDocument 502 "..."
```
↪ Shows friendly message if Vercel is down

---

## Success! What's Next?

Once everything works:

1. **Monitor for a few days** - Check that everything works smoothly
2. **Set up analytics** - Track usage on your subdirectory
3. **Update any documentation** - Internal docs, README, etc.
4. **Consider SSL** - DreamHost usually auto-configures this
5. **Backup .htaccess** - Download a copy for safekeeping

---

**You're all set! Your React app should now be accessible at luminaricro.com/lumipath** 🎉
