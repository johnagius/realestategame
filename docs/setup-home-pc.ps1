# ============================================================================
# Property Empire — one-shot home PC setup
# Installs everything needed to run the Kimi Code agent on this project and
# pull the updated repo: Git, Node.js, Python, Kimi Code CLI, project deps,
# Playwright Chromium, then verifies with the engine tests.
#
# Run (either):
#   1) Save this file, then in PowerShell:
#        powershell -ExecutionPolicy Bypass -File .\setup-home-pc.ps1
#   2) Or straight from the web (after this file is on main):
#        irm https://raw.githubusercontent.com/johnagius/realestategame/main/docs/setup-home-pc.ps1 | iex
# No admin required (winget may prompt for agreements only). ~5-10 min.
# ============================================================================
#requires -Version 5.1
$ErrorActionPreference = 'Stop'
$ProjectDir = "$env:USERPROFILE\Projects\realestategame"   # <- change if you want it elsewhere
$RepoUrl    = 'https://github.com/johnagius/realestategame.git'

function Refresh-Path {
    # Make freshly installed tools visible in THIS session without restarting.
    $machine = [System.Environment]::GetEnvironmentVariable('Path', 'Machine')
    $user    = [System.Environment]::GetEnvironmentVariable('Path', 'User')
    $env:Path = "$machine;$user"
}
function Have($cmd) { return [bool](Get-Command $cmd -ErrorAction SilentlyContinue) }

Write-Host '== Property Empire home PC setup ==' -ForegroundColor Cyan

# --- 1. Git for Windows (REQUIRED first: Kimi Code uses its bundled Git Bash) --
if (Have git) { Write-Host 'Git: already installed' }
else {
    Write-Host 'Installing Git for Windows...'
    winget install --id Git.Git -e --source winget --accept-package-agreements --accept-source-agreements
    Refresh-Path
}

# --- 2. Node.js LTS (game tooling; >= 22.19 also enables the npm CLI install) --
if (Have node) { Write-Host "Node: $(node --version)" }
else {
    Write-Host 'Installing Node.js LTS...'
    winget install --id OpenJS.NodeJS.LTS -e --source winget --accept-package-agreements --accept-source-agreements
    Refresh-Path
}
$nodeVer = [Version]((node --version) -replace '[^\d.].*$', '')
if ($nodeVer -lt [Version]'22.19.0') { Write-Host "WARNING: Node $nodeVer is old; Kimi Code npm install needs >= 22.19.0. The official installer script brings its own runtime." -ForegroundColor Yellow }

# --- 3. Python 3 (local test server: python -m http.server 8790) --------------
if (Have python) { Write-Host "Python: $((python --version) 2>&1)" }
else {
    Write-Host 'Installing Python 3.12...'
    winget install --id Python.Python.3.12 -e --source winget --accept-package-agreements --accept-source-agreements
    Refresh-Path
}

# --- 4. Kimi Code CLI ---------------------------------------------------------
# Official installer (recommended; downloads its own verified runtime). If it
# fails, fall back to npm: npm install -g @moonshot-ai/kimi-code (needs Node >= 22.19).
if (Have kimi) { Write-Host 'Kimi Code: already installed' }
else {
    Write-Host 'Installing Kimi Code CLI...'
    try {
        irm https://code.kimi.com/kimi-code/install.ps1 | iex
        Refresh-Path
    } catch {
        Write-Host 'Official installer failed; falling back to npm...' -ForegroundColor Yellow
        npm install -g @moonshot-ai/kimi-code
        Refresh-Path
    }
}
if (Have kimi) { kimi --version } else { Write-Host 'NOTE: kimi not on PATH yet — open a new terminal after this script finishes.' -ForegroundColor Yellow }

# --- 5. Clone or pull the project ---------------------------------------------
if (Test-Path "$ProjectDir\.git") {
    Write-Host "Pulling latest into $ProjectDir ..."
    git -C $ProjectDir pull
} else {
    Write-Host "Cloning $RepoUrl -> $ProjectDir ..."
    New-Item -ItemType Directory -Force (Split-Path $ProjectDir) | Out-Null
    git clone $RepoUrl $ProjectDir
}
Set-Location $ProjectDir

# --- 6. Node dependencies (playwright, axe-core, @capacitor/*) ----------------
Write-Host 'npm install ...'
npm install

# --- 7. Playwright Chromium ---------------------------------------------------
Write-Host 'Installing Playwright Chromium...'
npx playwright install chromium

# --- 8. Verify -----------------------------------------------------------------
Write-Host ''
Write-Host 'Running engine tests...' -ForegroundColor Cyan
node js/sim/tests.js
Write-Host ''
Write-Host 'Running quick balance table (full table: node js/sim/balance.js)...' -ForegroundColor Cyan
node js/sim/balance.js 20 5

# --- 9. Done -------------------------------------------------------------------
Write-Host ''
Write-Host '== Done ==' -ForegroundColor Green
Write-Host @'

Next steps:
  1.  kimi                     (start the agent; first launch: /login — OAuth or API key)
  2.  Read docs/HANDOVER.md, then docs/HANDOVER-P6.md for the current mission
      (top priority: the 3D city upgrade brief in HANDOVER-P6.md).
  3.  Play:  python -m http.server 8790 --bind 127.0.0.1
      then open http://127.0.0.1:8790/index.html?seed=42
  4.  Verify changes with: node js/sim/tests.js, node js/sim/balance.js,
      node tools/playwright/perf.js, node tools/playwright/play.js (server on).

Note: agent sessions are per-machine ( ~/.kimi-code ) — on this PC the work
starts from a fresh session; this handover is the bridge.
'@
