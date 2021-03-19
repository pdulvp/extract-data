$foo = (Get-Content 'package.json' | Out-String | ConvertFrom-Json)

$tests = $foo.directories.test + "/*"
$files = Get-ChildItem -Path $tests -Include "*.test.js" | where {! $_.PSIsContainer}

foreach ($file in $files)
{
    $text = "[INIT] ####### {0} #######" -f $file.Name;
    Write-Host -ForegroundColor Cyan $text
    $testFile = $foo.directories.test + "/" + $file.Name
    node $testFile
    Write-Host ""
}