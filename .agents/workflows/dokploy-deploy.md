---
description: How to wait for Dokploy deployments after pushing code to GitHub
---

# Dokploy Deployment Workflow

After pushing code to GitHub that triggers a Dokploy rebuild:

1. Commit and push your changes to GitHub.
// turbo
2. Wait 3 minutes for the Dokploy build to complete. Do NOT ask the user for confirmation — just proceed after the wait.
// turbo
3. Continue with the next task immediately after the 3-minute wait.

> **Important**: The user has explicitly requested that we do NOT ask them to confirm Dokploy deployments. Just wait 3 minutes and move on.
