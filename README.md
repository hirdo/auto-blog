# auto-blog

Automatically post tech/IT articles to [dev.to](https://dev.to) every week using GitHub Actions. Completely free.

## How it works

1. **Generate**: Trigger the "Generate Draft Article" workflow — AI (Gemini) writes a draft and saves it to `posts/drafts/`
2. **Review**: View and edit the draft directly on GitHub (click the file, then the pencil icon)
3. **Auto-post**: Every Monday at 9:00 AM (Vietnam time), the workflow picks the oldest article from `posts/ready/`, posts it as a **draft** on dev.to, and moves it to `posts/published/`
4. **Publish**: Go to your dev.to dashboard, review the draft, and click Publish

## Setup (one-time)

### 1. Get API Keys

- **dev.to**: Go to [dev.to/settings/extensions](https://dev.to/settings/extensions) → "DEV Community API Keys" → generate a key
- **Gemini**: Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey) → create an API key (free)

### 2. Add Secrets to GitHub

Go to your repo → **Settings** → **Secrets and variables** → **Actions** → add:

| Secret name | Value |
|---|---|
| `DEVTO_API_KEY` | Your dev.to API key |
| `GEMINI_API_KEY` | Your Google Gemini API key |

## Usage

### Generate a draft

1. Go to the **Actions** tab in your repo
2. Select **"Generate Draft Article"**
3. Click **"Run workflow"**
4. Enter a topic (e.g., "Getting started with Docker") and optional tags
5. The AI-generated draft will appear in `posts/drafts/`

### Review and approve

All done on GitHub — no need to pull code locally:

1. Navigate to `posts/drafts/` in your repo and click the draft file to read it
2. Click the **pencil icon** to edit directly on GitHub if needed, then commit
3. Go to the **Actions** tab → select **"Approve Draft"** → click **"Run workflow"**
4. Enter the filename (e.g., `2026-08-30-getting-started-with-docker.md`) and run
5. The file is moved to `posts/ready/` automatically

### Auto-posting

The weekly workflow runs automatically every Monday at 9:00 AM Vietnam time (02:00 UTC). You can also trigger it manually from the Actions tab.

## Article format

Articles use markdown with YAML frontmatter:

```markdown
---
title: "Your Article Title"
tags: ["javascript", "webdev", "tutorial"]
description: "A short description of your article"
---

Your article content here...
```

## Cost

| Component | Cost |
|---|---|
| GitHub Actions (public repo) | Free |
| Gemini API (free tier) | Free |
| dev.to | Free |
| **Total** | **$0/month** |
