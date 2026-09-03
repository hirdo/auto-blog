---
title: "Git Power User: 15+ Advanced Commands You Actually Need to Know"
tags: ["git","webdev","productivity","tutorial"]
description: "Move beyond standard commits and pushes. Learn how to rescue lost commits, clean up dirty history, and debug codebases faster using intermediate Git commands."
date_generated: "2026-09-03"
---

We all know the standard Git loop: `git add .`, `git commit -m "fix stuff"`, and `git push origin main`. It works perfectly when everything is going smoothly. But what happens when you commit to the wrong branch? Or when a bug creeps into your codebase and you have no idea which of the last 50 commits caused it? Or when your pull request review comes back with a request to "clean up your commit history"?

This is where intermediate developers separate themselves from beginners. Git is not just a backup tool; it is a powerful time-traveling, debugging, and history-crafting machine. 

In this guide, we will bypass the absolute basics and dive deep into the essential Git commands every professional developer should have in their toolkit.

---

## 1. Undoing Mistakes (Without Panicking)

We've all been there: you committed too early, wrote a typo in your commit message, or accidentally destroyed a file. Before you clone the repository to a new directory and start over, try these commands.

### Amending Your Last Commit
If you just committed but realized you made a typo in the commit message or forgot to stage a minor change, do not create a new "fix typo" commit. Use `--amend`:

```bash
# Add the forgotten file
git add forgotten-file.js

# Amend the last commit without changing its message
git commit --amend --no-edit

# Or, amend the commit and change the message
git commit --amend -m "The correct and elegant commit message"
```
*Note: Only amend commits that have not been pushed to a shared remote repository yet, as amending rewrites commit history.*

### The Safety Net: `git reflog`
Think of `git reflog` as your ultimate safety net. While `git log` shows you the commit history of your current branch, `git reflog` keeps track of *every single action* you take locally—including switching branches, resetting, and rebasing.

If you accidentally force-deleted a branch or did a hard reset that wiped out some commits, run:

```bash
git reflog
```

You'll see a list that looks like this:
```text
7b3e1a2 HEAD@{0}: reset: moving to HEAD~1
a5c8d21 HEAD@{1}: commit: Add user authentication
9f2d110 HEAD@{2}: checkout: moving from feature-branch to main
```
To restore your repository to the state it was in right before that accidental reset, simply run:
```bash
git reset --hard a5c8d21
```

### The Three Flavors of `git reset`
Understanding the difference between the three modes of `git reset` is crucial for managing your working directory and staging area.

*   `--soft`: Moves HEAD to a different commit but leaves your staging area and working directory untouched. Great for squashing multiple local commits into one.
*   `--mixed` (Default): Moves HEAD and unstages your changes, but keeps your working directory files.
*   `--hard`: Moves HEAD, unstages changes, and overwrites your working directory files. **Warning:** Any uncommitted changes will be permanently lost.

```bash
# Uncommit the last 3 commits, but keep your changes staged
git reset --soft HEAD~3

# Reset back to a specific commit, completely wiping local changes
git reset --hard e4f5a6b
```

---

## 2. Crafting a Clean Commit History

When working on complex feature branches, your commit history can quickly become messy with messages like "temp", "fixed typo", and "test". Before opening a pull request, use these tools to clean up.

### Interactive Rebase: `git rebase -i`
Interactive rebasing is arguably the most powerful tool for maintaining a clean commit history. It allows you to reorder, edit, delete, or combine (squash) commits.

To modify the last 5 commits on your current branch:
```bash
git rebase -i HEAD~5
```

Your default text editor will open with a list of your commits, prefixed by the command `pick`:
```text
pick 1a2b3c4 Implement API endpoint
pick 5f6g7h8 Add unit tests
pick 9j0k1l2 Fix minor typo in tests
pick 3m4n5o6 Optimize DB query
```

You can change the commands next to each commit:
*   `pick`: Keep the commit as-is.
*   `reword`: Keep the commit, but edit the commit message.
*   `squash`: Combine this commit with the previous one.
*   `drop`: Delete the commit entirely.

Save and close the file, and Git will step through your instructions, rewriting history cleanly.

### Cherry-Picking Commits
Sometimes you want to pull a single specific commit from another branch into your current branch without merging the entire history. This is where `git cherry-pick` shines.

```bash
# Switch to your target branch
git checkout main

# Cherry-pick a specific commit by its hash
git cherry-pick 7a1b2c3
```

---

## 3. High-Performance Debugging and Inspection

Git isn't just for tracking changes; it's an incredible investigative tool.

### Visualizing History with Pretty Logs
Standard `git log` outputs a wall of text that can be hard to read. Customize it with a clean, graphical representation:

```bash
git log --oneline --graph --decorate --all
```

To save your fingers from typing this every time, set up a global alias:
```bash
git config --global alias.adog "log --all --decorate --oneline --graph"
```
Now, typing `git adog` gives you a beautiful, color-coded terminal graph of your branches and commits.

### Finding Bugs with `git bisect`
If you know a feature worked two weeks ago, but it is broken now, and you have dozens of commits to sift through, `git bisect` is your best friend. It uses binary search to quickly pinpoint the exact commit that introduced the bug.

```bash
# Start the bisect process
git bisect start

# Mark the current commit as bad
git bisect bad

# Mark a known working commit from the past (by tag or hash)
git bisect good v1.2.0
```

Git will automatically checkout a commit in the middle. You test your application, and tell Git if it's good or bad:
```bash
# If it works:
git bisect good

# If it's broken:
git bisect bad
```
Git will narrow down the commits exponentially. Once found, it outputs the exact offending commit. To exit bisect mode:
```bash
git bisect reset
```

---

## 4. Work-in-Progress and Cleanup

We often need to switch contexts abruptly. These commands help you clean up or temporarily store work.

### Advanced Stashing
Everyone knows `git stash`, but did you know you can stash *untracked* files, or create a named stash?

```bash
# Stash changes, including untracked files (-u)
git stash -u -m "WIP: user authentication logic"

# List your stashes
git stash list

# Apply and remove the specific stash by index
git stash pop stash@{0}
```

### Safely Cleaning Untracked Files
If your local directory is cluttered with build artifacts, log files, or temporary files that aren't ignored, `git clean` can sweep them away.

```bash
# Perform a "dry run" to see what would be deleted
git clean -nd

# Actually delete the untracked files and directories
git clean -fd
```

---

## 5. Collaboration and Housekeeping

When working with large teams, keeping your local repository in sync with the remote server prevents merge conflicts and unexpected behavior.

### Pruning Dead Remote Branches
When colleagues delete branches on GitHub/GitLab after merging pull requests, those branches still linger in your local tracking references. Clean them up with:

```bash
# Fetch and remove local references to deleted remote branches
git fetch --prune
```
You can also configure Git to do this automatically every time you fetch:
```bash
git config --global fetch.prune true
```

---

## Wrapping Up

Mastering these commands takes you from a developer who just uses Git to a developer who *controls* their codebase's history. Start integrating these into your daily routine—especially interactive rebasing and the reflog. Your future self (and your team) will thank you.

Do you have a favorite Git alias or command that saves you hours of work? Let us know in the comments below!
