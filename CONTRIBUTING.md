# Contributing — the fast hackathon flow

7-day build, 4 people, max speed. **Trunk-based: we work directly on `main`.**
Keep `main` always demo-able. That's the whole goal. (Agents read the same rules
in [AGENTS.md](AGENTS.md) — humans and agents follow the identical flow.)

## One-time setup

```bash
git clone https://github.com/Welddevelopment/Tender_Breakdown_AI-Agent.git
cd Tender_Breakdown_AI-Agent
git config pull.rebase true     # do this once — makes pulls clean
```

## The daily loop (do this constantly)

```bash
git pull --rebase     # 1. start from everyone's latest
# ...make a focused change in YOUR folder...
git add -A
git commit -m "clear message"
git pull --rebase     # 2. catch anything pushed while you worked
git push              # 3. share it
```

That's 95% of your git usage. Commit small, push often (multiple times a day).

## Why no PRs for everyday work?

A PR's value is review + CI + isolation. With 4 people in **separate folders**
(frontend vs backend) who can just talk to each other, that overhead costs more
speed than it saves. So normal work goes **straight to `main`**.

## Branch + PR ONLY for these two cases

1. **Changing the locked schema** ([AGENTS.md](AGENTS.md)) — breaks both sides, needs team agreement.
2. **A big/risky change** that could leave `main` broken (major refactor).

```bash
git checkout -b <role>/<short-name>   # e.g. frontend/graph-view
# ...work, commit, push...
git push -u origin <role>/<short-name>
# open PR on GitHub → one teammate glances → merge → delete branch
```

## Stay in your lane

| Person | Edits | Branch prefix (for the rare PR) |
|--------|-------|--------------------------------|
| Backend | `/backend` | `backend/` |
| Generalist | `/backend`, eval | `general/` |
| Frontend | `/frontend` | `frontend/` |
| J | prompts, orchestration | `glue/` |

Touching another role's files? Say so out loud first — that's where conflicts come from.

## Cheatsheet

| Command | What it does |
|---------|--------------|
| `git status` | What's changed / am I ahead or behind. Run it when confused. |
| `git pull --rebase` | Get latest, replay my commits on top (clean history). |
| `git add -A` | Stage all my changes. |
| `git commit -m "..."` | Save staged changes to my local history. |
| `git push` | Send my commits to GitHub for the team. |
| `git log --oneline -10` | See the last 10 commits. |

### If push is rejected
GitHub has commits you don't. Just:
```bash
git pull --rebase
git push
```

### If you hit a merge conflict
Git marks the clashing lines with `<<<<<<<`, `=======`, `>>>>>>>`. Edit the file
to keep the right code, delete the markers, then:
```bash
git add <file>
git rebase --continue
```
Conflict in someone else's folder or the schema? **Stop and ask the team** — don't guess.

## Never

- Commit `.env`, secrets, `node_modules/`, `.venv/`, or tender PDFs (`.gitignore` blocks these — don't `-f` past it).
- `git push --force` on `main`.
- Push a broken build — run build/lint first. `main` is the live demo.
