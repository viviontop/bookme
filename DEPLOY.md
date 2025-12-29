# How to Publish to GitHub

## Prerequisites

1. **Install Git** (if not already installed):
   - Download from: https://git-scm.com/download/win
   - Follow the installation wizard
   - Restart your terminal after installation

2. **GitHub Account**: Make sure you're logged into GitHub at https://github.com

## Method 1: Using Git Command Line

### Step 1: Open Terminal in Project Directory

Navigate to your project folder:
```bash
cd C:\Users\vvoli\Desktop\demoscript\curve
```

### Step 2: Initialize Git (if not already done)

```bash
git init
```

### Step 3: Add Remote Repository

```bash
git remote add origin https://github.com/viviontop/bookme.git
```

If you get an error that the remote already exists, use:
```bash
git remote set-url origin https://github.com/viviontop/bookme.git
```

### Step 4: Stage All Files

```bash
git add .
```

### Step 5: Create Initial Commit

```bash
git commit -m "Initial commit: BookMe platform with messaging, admin dashboard, and map features"
```

### Step 6: Push to GitHub

```bash
git branch -M main
git push -u origin main
```

You'll be prompted for your GitHub username and password (or personal access token).

## Method 2: Using GitHub Desktop (Easier)

1. **Download GitHub Desktop**: https://desktop.github.com/
2. **Install and sign in** with your GitHub account
3. **Add the repository**:
   - Click "File" > "Add Local Repository"
   - Browse to: `C:\Users\vvoli\Desktop\demoscript\curve`
   - Click "Add repository"
4. **Publish to GitHub**:
   - Click "Publish repository" button
   - Name: `bookme`
   - Owner: `viviontop`
   - Make sure "Keep this code private" is unchecked (unless you want it private)
   - Click "Publish repository"

## Method 3: Using VS Code (If you use VS Code)

1. Open VS Code in your project folder
2. Click the Source Control icon in the sidebar (or press `Ctrl+Shift+G`)
3. Click "Initialize Repository"
4. Stage all files (click the "+" next to "Changes")
5. Enter commit message: "Initial commit"
6. Click "Commit"
7. Click "..." menu > "Remote" > "Add Remote"
8. Enter: `https://github.com/viviontop/bookme.git`
9. Click "Publish Branch"

## After Publishing

Once your code is on GitHub, you can:

1. **Deploy to Vercel** (Recommended for Next.js):
   - Go to https://vercel.com
   - Sign in with GitHub
   - Click "New Project"
   - Import your `viviontop/bookme` repository
   - Click "Deploy"

2. **Deploy to Netlify**:
   - Go to https://netlify.com
   - Sign in with GitHub
   - Click "Add new site" > "Import an existing project"
   - Select your repository
   - Build command: `npm run build`
   - Publish directory: `.next`

## Troubleshooting

- **"Git is not recognized"**: Install Git from https://git-scm.com/download/win
- **"Authentication failed"**: Use a Personal Access Token instead of password:
  - Go to GitHub Settings > Developer settings > Personal access tokens
  - Generate a new token with `repo` permissions
  - Use the token as your password
- **"Repository not found"**: Make sure the repository exists at https://github.com/viviontop/bookme
