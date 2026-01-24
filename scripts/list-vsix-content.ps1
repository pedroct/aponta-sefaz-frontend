Add-Type -AssemblyName System.IO.Compression.FileSystem

$vsix = Get-ChildItem -Filter "*.vsix" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
Write-Host "Conteudo do VSIX:" $vsix.Name

$zip = [System.IO.Compression.ZipFile]::OpenRead($vsix.FullName)
$entries = $zip.Entries | Sort-Object FullName

foreach ($entry in $entries) {
    Write-Host $entry.FullName
}

$zip.Dispose()