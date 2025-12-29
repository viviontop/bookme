# Quick Start - Publish to GitHub

## Option 1: Run the Automated Script (Easiest)

1. **Install Git** (if not installed):
   - Download: https://git-scm.com/download/win
   - Install with default settings
   - **Restart your computer** after installation

2. **Double-click** `publish-to-github.bat` in your project folder

3. Follow the prompts - you'll need to enter your GitHub username and password/token

## Option 2: Manual Steps

If the script doesn't work, follow these steps in your terminal:

```bash
# 1. Install Git first from https://git-scm.com/download/win

# 2. Navigate to project
cd C:\Users\vvoli\Desktop\demoscript\curve

# 3. Initialize and push
git init
git remote add origin https://github.com/viviontop/bookme.git
git add .
git commit -m "Initial commit"
git branch -M main
git push -u origin main
```

## Authentication

If you have 2FA enabled on GitHub, you'll need a **Personal Access Token**:

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token" > "Generate new token (classic)"
3. Give it a name like "BookMe Project"
4. Select scope: `repo` (full control of private repositories)
5. Click "Generate token"
6. **Copy the token** (you won't see it again!)
7. Use this token as your password when pushing

## After Publishing

Your code will be at: https://github.com/viviontop/bookme

Then deploy for free at:
- **Vercel**: https://vercel.com (best for Next.js)
- **Netlify**: https://netlify.com

