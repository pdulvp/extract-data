#Requires -Modules @{ ModuleName="Microsoft.PowerShell.Archive"; ModuleVersion="1.2.5" }

$foo = (Get-Content 'manifest.json' | Out-String | ConvertFrom-Json)

Write-Host -ForegroundColor Cyan "Creation of" $foo.version
$name = $foo.version+"-"+$args[0]+".zip"

if ( (Test-Path $name -PathType leaf) -And ($args[0] -eq "release-unsigned")) {
    Write-Host -ForegroundColor Red "[ERROR]" $name already exists

} elseif ( (Test-Path $name -PathType leaf) -And ($args[0] -eq "debug")) {
    & "C:\Program Files\7-Zip\7z.exe" -tzip a $name manifest.json background.js _locales content_scripts icons ui 
    Write-Host -ForegroundColor Yellow "[WARN]" $name already exists
    
} else {
    & "C:\Program Files\7-Zip\7z.exe" -tzip a $name manifest.json background.js _locales content_scripts icons ui 
    Write-Host -ForegroundColor Green "[OK]" $name created
    
}
