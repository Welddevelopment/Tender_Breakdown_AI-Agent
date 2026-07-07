# Assemble a push-ready Hugging Face Space from the current repo + baked demo data.
# Run from the repo root:  powershell -ExecutionPolicy Bypass -File deploy\stage-hf-space.ps1
# Output: deploy\hf-build\  (backend + engine + baked tender.db/uploads/capability +
# Dockerfile + README.md) — commit + push THAT folder to your HF Space git remote.

$ErrorActionPreference = "Stop"
$repo  = Split-Path $PSScriptRoot -Parent
$build = Join-Path $PSScriptRoot "hf-build"

Write-Host "Staging HF Space build at $build"
if (Test-Path $build) { Remove-Item -Recurse -Force $build }
New-Item -ItemType Directory -Force -Path $build | Out-Null

# backend/ — exclude the virtualenv, caches, and orphan upload dirs (keep the live tender only)
$LIVE_TENDER = "tnd-9da46fbf"
robocopy (Join-Path $repo "backend") (Join-Path $build "backend") /E `
  /XD ".venv" "__pycache__" ".pytest_cache" `
  /XF "*.pyc" ".env" | Out-Null
# engine/
robocopy (Join-Path $repo "engine") (Join-Path $build "engine") /E /XD "__pycache__" | Out-Null

# prune orphan upload dirs (throwaway test tenders) so only the demo tender ships
$uploads = Join-Path $build "backend\data\uploads"
if (Test-Path $uploads) {
  Get-ChildItem $uploads -Directory | Where-Object { $_.Name -ne $LIVE_TENDER } | Remove-Item -Recurse -Force
}
$caps = Join-Path $build "backend\data\capability"
if (Test-Path $caps) {
  Get-ChildItem $caps -Directory | Where-Object { $_.Name -ne $LIVE_TENDER } | Remove-Item -Recurse -Force
}

# Dockerfile + README at the Space root
Copy-Item (Join-Path $PSScriptRoot "hfspace.Dockerfile") (Join-Path $build "Dockerfile") -Force
Copy-Item (Join-Path $PSScriptRoot "hfspace.README.md")  (Join-Path $build "README.md")  -Force

# sanity checks — the baked data MUST be present or the deploy serves an empty app
$checks = @(
  "backend\tender.db",
  "backend\data\uploads\$LIVE_TENDER",
  "backend\data\capability\$LIVE_TENDER",
  "Dockerfile", "README.md"
)
$ok = $true
foreach ($c in $checks) {
  $p = Join-Path $build $c
  if (Test-Path $p) { Write-Host "  OK   $c" } else { Write-Host "  MISSING  $c" -ForegroundColor Red; $ok = $false }
}
if (-not $ok) { throw "Staging incomplete - baked data missing. Is the local backend seeded?" }

$size = "{0:N0} MB" -f ((Get-ChildItem $build -Recurse | Measure-Object Length -Sum).Sum / 1MB)
Write-Host "`nStaged OK ($size). Next:"
Write-Host "  1. Create a Docker Space at https://huggingface.co/new-space (SDK: Docker)"
Write-Host "  2. git clone the Space, copy the CONTENTS of deploy\hf-build\ into it"
Write-Host "  3. In the Space: Settings -> Variables and secrets -> add AUTH_SECRET and OPENAI_API_KEY"
Write-Host "  4. git add -A; git commit -m 'bidframe backend'; git push  (HF builds + deploys)"
