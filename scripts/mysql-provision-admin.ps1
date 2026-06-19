# Daily Taaza — MySQL provisioning (run PowerShell AS ADMINISTRATOR)
# Creates daily_taaza user + database on MySQL 9.7 (port 3306).
#
# Usage:
#   Right-click PowerShell → Run as administrator
#   cd d:\dev-projects\daily-taaza
#   .\scripts\mysql-provision-admin.ps1

param(
  [string]$ServiceName = "MySQL97",
  [string]$MySqlBin = "C:\Program Files\MySQL\MySQL Server 9.7\bin",
  [string]$AppUser = "daily_taaza",
  [string]$AppPassword = "Dailytaaza@123",
  [string]$Database = "daily_taaza"
)

$ErrorActionPreference = "Stop"

function Test-Admin {
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($identity)
  return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-Admin)) {
  Write-Error @"
This script must run as Administrator (it stops/starts the MySQL97 service).

Steps:
  1. Right-click PowerShell → Run as administrator
  2. cd d:\dev-projects\daily-taaza
  3. .\scripts\mysql-provision-admin.ps1
"@
}

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyScriptInvocation.MyCommand.Path)
$InitFile = Join-Path $ProjectRoot "scripts\.mysql-provision-init.sql"
$Mysqld = Join-Path $MySqlBin "mysqld.exe"
$MyIni = "C:\ProgramData\MySQL\MySQL Server 9.7\my.ini"

if (-not (Test-Path $Mysqld)) {
  Write-Error "mysqld.exe not found at $Mysqld"
}

Write-Host "Creating init file at $InitFile ..."
$sql = @"
ALTER USER 'root'@'localhost' IDENTIFIED BY '$AppPassword';
ALTER USER 'root'@'127.0.0.1' IDENTIFIED BY '$AppPassword';
CREATE DATABASE IF NOT EXISTS ``$Database`` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$AppUser'@'localhost' IDENTIFIED BY '$AppPassword';
CREATE USER IF NOT EXISTS '$AppUser'@'127.0.0.1' IDENTIFIED BY '$AppPassword';
GRANT ALL PRIVILEGES ON ``$Database``.* TO '$AppUser'@'localhost';
GRANT ALL PRIVILEGES ON ``$Database``.* TO '$AppUser'@'127.0.0.1';
FLUSH PRIVILEGES;
"@
Set-Content -Path $InitFile -Value $sql -Encoding UTF8

Write-Host "Stopping service $ServiceName ..."
Stop-Service -Name $ServiceName -Force

Write-Host "Running one-time init via mysqld --init-file ..."
$proc = Start-Process -FilePath $Mysqld -ArgumentList @(
  "--defaults-file=$MyIni",
  "--init-file=$InitFile",
  "--console"
) -PassThru -NoNewWindow

Start-Sleep -Seconds 12
if (-not $proc.HasExited) {
  Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
}

Remove-Item -Path $InitFile -Force -ErrorAction SilentlyContinue

Write-Host "Starting service $ServiceName ..."
Start-Service -Name $ServiceName
Start-Sleep -Seconds 4

Write-Host ""
Write-Host "MySQL provisioned successfully."
Write-Host "  DB_HOST=127.0.0.1"
Write-Host "  DB_PORT=3306"
Write-Host "  DB_USER=$AppUser"
Write-Host "  DB_PASSWORD=$AppPassword"
Write-Host "  DB_NAME=$Database"
Write-Host ""
Write-Host "Next: npm run db:seed && npm start"
