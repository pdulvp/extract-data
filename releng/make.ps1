#Requires -Modules @{ ModuleName="Microsoft.PowerShell.Archive"; ModuleVersion="1.2.5" }

$foo = (Get-Content 'manifest.json' | Out-String | ConvertFrom-Json)

Write-Host -ForegroundColor Cyan "Creation of" $foo.version
$name = $foo.version+".zip"
if (!(Test-Path $name -PathType leaf))
{
    & "C:\Program Files\7-Zip\7z.exe" -tzip a $name manifest.json background.js _locales content_scripts icons ui 
} else {
    Write-Host -ForegroundColor Red "[ERROR]" $foo.version exists
}