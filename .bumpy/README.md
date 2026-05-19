# 🐸 Bumpy

This directory is used by [bumpy](https://bumpy.varlock.dev) to manage versioning and changelogs.

Bump files (`*.md` other than this README) accumulate on `main` and are consumed when Bumpy opens a version PR. Each bump file declares which packages bump and by how much, plus the changelog body.

## Creating a bump file

```bash
yarn bumpy add
```

Non-interactive (one bump per PR):

```bash
yarn bumpy add --packages "valimock:patch" --message "Description of changes" --name "my-change"
```

For PRs that don't need a release (docs, CI):

```bash
yarn bumpy add --empty --name "docs-update"
```

📖 Full documentation: https://bumpy.varlock.dev
