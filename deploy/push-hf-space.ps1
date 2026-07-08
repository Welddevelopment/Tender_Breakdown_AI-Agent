# One-shot deploy: stage the HF Space build and push it to the Space.
# Run from the repo root ON THE MACHINE WITH THE BAKED DEMO DATA (tender.db + uploads):
#   powershell -ExecutionPolicy Bypass -File deploy\push-hf-space.ps1
# Token: pass -Token hf_xxx, or set $env:HF_TOKEN, or you'll be prompted (needs WRITE access).
#
# What it does, in order:
#   1. Runs stage-hf-space.ps1 (fails fast if the baked demo data is missing)
#   2. AUTH_SECRET: already set on the Space (2026-07-07); pass -RotateAuthSecret to regenerate
#      (rotating invalidates any logged-in sessions - fine before the shoot, not during)
#   3. Clones the Space into %TEMP%, copies the build in, commits, pushes
#   4. Prints the health URL to verify + the Vercel env var to set

param([string]$Token = $env:HF_TOKEN, [switch]$RotateAuthSecret)

$ErrorActionPreference = "Stop"
$SPACE_OWNER = "yonnie-tsenta"
$SPACE_NAME  = "bidframe-api"
$SPACE_ID    = "$SPACE_OWNER/$SPACE_NAME"

$repo = Split-Path $PSScriptRoot -Parent

if (-not $Token) {
  $Token = Read-Host "Hugging Face WRITE token (hf_...)"
}
if (-not $Token.StartsWith("hf_")) { throw "That doesn't look like an HF token (should start with hf_)." }

# --- 1. stage ---------------------------------------------------------------
Write-Host "`n[1/4] Staging build..." -ForegroundColor Cyan
& (Join-Path $PSScriptRoot "stage-hf-space.ps1")   # throws if baked data missing

# --- 2. AUTH_SECRET ----------------------------------------------------------
if ($RotateAuthSecret) {
  Write-Host "[2/4] Rotating AUTH_SECRET on the Space..." -ForegroundColor Cyan
  $bytes = New-Object byte[] 32
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  $secret = ($bytes | ForEach-Object { $_.ToString("x2") }) -join ""
  $body = @{ key = "AUTH_SECRET"; value = $secret } | ConvertTo-Json
  Invoke-RestMethod -Method Post -Uri "https://huggingface.co/api/spaces/$SPACE_ID/secrets" `
    -Headers @{ Authorization = "Bearer $Token" } -ContentType "application/json" -Body $body | Out-Null
  Write-Host "        AUTH_SECRET rotated (random, server-side only - you don't need to save it)."
} else {
  Write-Host "[2/4] AUTH_SECRET already set on the Space - skipping (use -RotateAuthSecret to regenerate)." -ForegroundColor Cyan
}

# --- 3. push (Git LFS for the binary demo data) -----------------------------
Write-Host "[3/4] Pushing build to the Space..." -ForegroundColor Cyan
$work = Join-Path $env:TEMP "bidframe-space"
$remote = "https://${SPACE_OWNER}:${Token}@huggingface.co/spaces/$SPACE_ID"
# Always fresh-clone. HF's pre-receive hook REJECTS binary files that aren't
# LFS-tracked (tender.db, the PDF/Word/Excel source files), so a stale non-LFS
# commit from a prior run would keep getting rejected — a clean clone + lfs track
# is the reliable path.
if (Test-Path $work) { Remove-Item -Recurse -Force $work }
git clone --quiet $remote $work
git -C $work lfs install --local | Out-Null
# Track the demo pack's binaries via LFS BEFORE they're added, so they commit as
# pointers (csv/txt/py stay plain text).
git -C $work lfs track "*.db" "*.pdf" "*.docx" "*.xlsx" | Out-Null
git -C $work add .gitattributes
Copy-Item (Join-Path $PSScriptRoot "hf-build\*") $work -Recurse -Force
git -C $work add -A
$pending = git -C $work status --porcelain
if ($pending) {
  git -C $work commit --quiet -m "bidframe backend + baked demo data"
  git -C $work push
  Write-Host "        Pushed (LFS). Verify the remote landed on the Space page below."
} else {
  Write-Host "        Nothing changed since last push."
}

# --- 4. next ----------------------------------------------------------------
Write-Host "[4/4] Done. Now:" -ForegroundColor Green
Write-Host "  - Watch the build:  https://huggingface.co/spaces/$SPACE_ID  (Building -> Running, a few min)"
Write-Host "  - Then verify:      https://$SPACE_OWNER-$SPACE_NAME.hf.space/health"
Write-Host "  - Optional: add OPENAI_API_KEY in Space Settings -> Variables and secrets (live drafting only)"
Write-Host "  - Vercel: set NEXT_PUBLIC_API_BASE_URL = https://$SPACE_OWNER-$SPACE_NAME.hf.space  (no trailing slash) and REDEPLOY"
