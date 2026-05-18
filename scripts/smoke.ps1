# Delegates to cross-platform runner (Node 20+)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
node (Join-Path $scriptDir "smoke.mjs") @args
exit $LASTEXITCODE
