---
description: How to push code changes and deploy to production
---

# Push & Deploy Workflow

**This workflow MUST be followed every time code changes are pushed to GitHub.** No exceptions.

## Pre-Push Checklist (MANDATORY)

Before running `git push`, you MUST complete ALL of the following:

### 1. Update the Changelog

Open `src/lib/changelog.ts` and:

- **If today's date already has an entry**: Add new items to that entry's `changes` array.
- **If today is a new day**: Create a new entry at the TOP of the array with:
  - `version`: Increment the PATCH number (e.g., `0.1.5` → `0.1.6`)
  - `date`: Today's date in French format (e.g., `'25 mars 2026'`)
  - `changes`: Array of strings describing what changed, in French.

**Rules:**
- Each day with at least one deploy gets ONE version entry.
- If multiple deploys happen the same day, add items to that day's existing entry (do NOT create duplicate entries).
- Most recent version first.
- Changes should be user-facing descriptions in French.

### 2. Stage & Commit

// turbo
```
git add -A
git commit -m "<type>: <short description>"
```

Commit types: `fix`, `feat`, `refactor`, `chore`, `style`, `docs`

### 3. Push

// turbo
```
git push origin main
```

### 4. Wait for Dokploy

// turbo
Wait 3 minutes for the Dokploy build to complete. Do NOT ask the user for confirmation — just proceed after the wait.

> **CRITICAL**: Never skip the changelog update. If you realize you forgot after pushing, immediately amend and force-push, or create a follow-up commit with the changelog update.
