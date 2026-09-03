---
title: "Beyond Git Push: The Advanced Git Commands Every Intermediate Developer Must Master"
tags: ["git","programming","devops","tutorial"]
description: "Move past basic git commit and push. Discover powerful Git commands for history rewriting, debugging, and recovering lost code like a pro."
date_generated: "2026-09-03"
cover_image: "https://images.pexels.com/photos/11035539/pexels-photo-11035539.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
---

Almost every developer starts their journey learning the foundational quartet: `git init`, `git add`, `git commit`, and `git push`. While these commands are enough to get your code onto GitHub, they only scratch the surface of Git's true power.

As an intermediate developer, you eventually run into more complex situations: merging conflicts, accidentally deleting a branch, needing to cherry-pick a specific hotfix, or hunting down a bug introduced ten commits ago.

In this guide, we will dive deep into the essential, advanced Git commands that will save your time, your code, and your sanity.

---

## 1. The Ultimate Safety Net: `git reflog`
Have you ever run a destructive command like `git reset --hard` or deleted a local branch, only to realize you lost crucial work? Before you panic, meet `git reflog`.

Git keeps a log of every single action you perform locally—every commit, checkout, reset, and merge. This log is called the **Reference Log**. Even if a commit is no longer referenced by any branch, it still lives in the reflog for a limited time (usually 30 days).

### How to use it:
Run the command:
```bash
git reflog
```

You'll see an output resembling this:
```text
7b3f9d1 HEAD@{0}: reset: moving to HEAD~1
a12b3c4 HEAD@{1}: commit: Add user authentication
f45e6d7 HEAD@{2}: checkout: moving from main to feature/auth
```

If you accidentally reset past `a12b3c4` (your auth commit), you can easily rescue it:
```bash
git checkout a12b3c4
# Or restore it directly to a new branch:
git checkout -b rescue-branch a12b3c4
```

---

## 2. Surgical Code Retrieval: `git cherry-pick`
Imagine you are working on a long-running feature branch `feature-x`, and you implement a brilliant helper function. Suddenly, production goes down, and you need to apply *only* that helper function to the `main` branch immediately without merging the rest of your unfinished feature.

This is where `git cherry-pick` shines. It allows you to grab a specific commit from any branch and apply it directly onto your current branch.

### How to use it:
1. Find the commit hash of the commit you want to copy (e.g., using `git log`).
2. Switch to your target branch:
   ```bash
   git checkout main
   ```
3. Cherry-pick the commit:
   ```bash
   git cherry-pick <commit-hash>
   ```

If you run into conflicts, Git will pause and let you resolve them exactly like a standard merge conflict. Once resolved, run `git cherry-pick --continue`.

---

## 3. Curating History: `git rebase -i`
A clean commit history is a gift to your future self and your code reviewers. Instead of pushing five WIP commits like "fixed typo", "trying again", and "now it works", you can rewrite local history using **Interactive Rebasing**.

`git rebase -i` allows you to reorder, edit, rename, or combine (squash) commits.

### How to use it:
To edit the last 4 commits:
```bash
git rebase -i HEAD~4
```

Your default terminal editor will open with a list of commits looking like this:
```text
pick d1a2b3c Fix typo in landing page
pick e4f5g6h Add payment gateway API
pick a9b8c7d Update CSS styling
pick f1e2d3c Fix payment gateway bug
```

At the bottom of this file, Git lists instructions. You can replace the word `pick` with other commands:
*   `reword` (or `r`): Use the commit, but edit the commit message.
*   `squash` (or `s`): Meld the commit into the previous commit.
*   `fixup` (or `f`): Like `squash`, but discard this commit's log message entirely.

For instance, to combine the "Fix payment gateway bug" into "Add payment gateway API", rearrange and change the actions:
```text
pick e4f5g6h Add payment gateway API
fixup f1e2d3c Fix payment gateway bug
pick d1a2b3c Fix typo in landing page
pick a9b8c7d Update CSS styling
```
Save and close the file. Git will execute these instructions sequentially, presenting you with a clean history.

> **Rule of Thumb:** Never rebase commits that have already been pushed to a shared remote repository. It rewrites commit hashes and will cause headaches for your team.

---

## 4. Binary Search for Bugs: `git bisect`
You pull down the latest changes from `main`, run your application, and discover a subtle bug. It worked yesterday, but there are 50 new commits since then. How do you find the exact commit that introduced the bug without manually checking out dozens of commits?

You use `git bisect`. It uses a binary search algorithm to narrow down the faulty commit with logarithmic speed.

### How to use it:
1. Start the bisect process:
   ```bash
   git bisect start
   ```
2. Mark the current commit as broken (bad):
   ```bash
   git bisect bad
   ```
3. Find a commit hash in the past where you *know* the code was working fine, and mark it as good:
   ```bash
   git bisect good <known-good-commit-hash>
   ```

Git will automatically check out a commit right in the middle of those two points. Run your tests or check the application, then tell Git the result:
*   If the bug is present: `git bisect bad`
*   If the bug is absent: `git bisect good`

Git will repeat this process, narrowing down the possibilities until it outputs:
```text
a12b3c4d5e6f7g8h is the first bad commit
```
Once you're done, reset your repository back to its original state:
```bash
git bisect reset
```

---

## 5. Professional Context-Switching: `git stash`
You are deep in the zone, writing code for a feature, but your files are in a messy, semi-working state. Suddenly, a high-priority bug report comes in, and you must switch branches immediately. You can't commit your half-baked code.

This is where `git stash` comes in. It temporarily shelves your local changes, returning you to a clean working directory.

### Best Practices for Stashing:
Instead of a plain `git stash`, give your stash a descriptive name so you don't forget what it contains:
```bash
git stash push -m "WIP: dashboard layout adjustments"
```

To view your stashes:
```bash
git stash list
```

To apply the most recent stash and remove it from the list:
```bash
git stash pop
```

If you want to apply a specific stash from your list without deleting it:
```bash
git stash apply stash@{1}
```

To clear all saved stashes:
```bash
git stash clear
```

---

## 6. Visualization & Inspection
The default `git log` can be overwhelming and difficult to read. Let's make it beautiful and useful.

### A Beautiful, Readable Graph
You can visualize branch topology, merges, and commit relationships directly in your terminal:
```bash
git log --oneline --graph --all --decorate
```
Since this is tedious to type, create an alias for it:
```bash
git config --global alias.adog "log --all --decorate --oneline --graph"
```
Now, running `git adog` gives you a clean, color-coded ascii graph of your repository history.

### Tracking Down Code Ownership: `git blame` and `git show`
If you want to know who modified a specific line in a file and why, use `git blame`:
```bash
git blame path/to/file.js
```
Once you find the commit hash responsible for that line, inspect the entire commit payload with:
```bash
git show <commit-hash>
```

---

## 7. Workspace Cleanup
Over time, local workspaces get cluttered with untracked files, old branches, and orphaned remote tracking references. Keep your environment clean with these commands.

### Prune Stale Remote Branches
When team members delete branches on GitHub/GitLab after merging PRs, those branches still linger in your local tracking references. Clean them up:
```bash
git fetch --prune
```

### Forcefully Clean Untracked Files
If you have generated build files, logs, or miscellaneous assets that aren't tracked by Git and you want to wipe them completely:
```bash
# Dry-run first to see what will be deleted:
git clean -fdn

# Actually delete the files and directories:
git clean -fd
```
*(Note: Use `git clean` with caution as this operation cannot be undone).*

---

## Conclusion
Mastering Git is not about memorizing commands; it's about understanding how Git structures history and learning to use the tools it provides to manipulate that history safely. By adding `reflog`, `bisect`, `interactive rebase`, and structured `stashes` to your toolkit, you transition from a developer who just "uses" Git to one who commands it.
