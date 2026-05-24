---
name: smart-commit
description: Analyze changes and create organized commits
---

# Analyze the uncommitted changes in the repository.

## Tasks:

1. Read recent commit history:

   ```bash
   git log --oneline --decorate -n 20
   ```

2. Inspect changes:

```bash
git status
git diff --stat
git diff
```

3. Infer the repository commit style:

- prefixes
- wording
- formatting
- scope usage
- body conventions

4. Group changed files into logical atomic commits:

- features
- fixes
- refactors
- tests
- docs
- infrastructure

5. Stage related files selectively.

6. Create commits:

- titles under 80 chars
- descriptive bodies when needed
- match existing repository style

7. Never combine unrelated changes.

8. Prefer multiple small commits over one large commit.

9. Avoid generated files unless repository convention requires them.

## Before each commit:

```bash
git diff --staged
```

## After each commit:

```bash
git status
```
