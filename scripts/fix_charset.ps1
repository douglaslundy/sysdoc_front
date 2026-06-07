$ErrorActionPreference = 'Stop'

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$cp1252 = [System.Text.Encoding]::GetEncoding(1252)

$files = @(
    'C:\Users\dougl\workspace\sysdoc_front\src\components\routes\index.js',
    'C:\Users\dougl\workspace\sysdoc_front\src\components\queue\index.js',
    'C:\Users\dougl\workspace\sysdoc_front\src\components\vehicles\index.js',
    'C:\Users\dougl\workspace\sysdoc_front\src\components\modal\routes\index.js',
    'C:\Users\dougl\workspace\sysdoc_front\src\components\modal\queue\index.js',
    'C:\Users\dougl\workspace\sysdoc_front\src\components\modal\vehicles\index.js',
    'C:\Users\dougl\workspace\sysdoc_front\src\components\attendance\queue\index.js'
)

foreach ($file in $files) {
    if (-not (Test-Path -LiteralPath $file)) {
        continue
    }

    $text = [System.IO.File]::ReadAllText($file)
    $fixed = [System.Text.Encoding]::UTF8.GetString($cp1252.GetBytes($text))
    [System.IO.File]::WriteAllText($file, $fixed, $utf8NoBom)
}

Write-Output 'charset-fixed'
