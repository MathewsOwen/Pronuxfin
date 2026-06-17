# Sobe o frontend local (libera a porta 3000 se estiver em uso).
$ErrorActionPreference = "Stop"
$port = 3000
$root = Split-Path $PSScriptRoot -Parent
$web = Join-Path $root "web"

Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
  ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
  }

Write-Host ""
Write-Host "PRONUXFIN — frontend em http://127.0.0.1:$port/pt-BR/login" -ForegroundColor Green
Write-Host "Pasta: $web" -ForegroundColor DarkGray
Write-Host ""

Set-Location $web
npm run dev
