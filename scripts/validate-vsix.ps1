# Validate VSIX Content
param(
    [string]$ProjectRoot = (Get-Location).Path
)

Write-Host "🔍 Validando conteúdo do arquivo VSIX..." -ForegroundColor Cyan
Write-Host ""

try {
    # Encontrar arquivo VSIX mais recente
    $vsixFiles = Get-ChildItem -Path $ProjectRoot -Filter "*.vsix" | Sort-Object LastWriteTime -Descending

    if ($vsixFiles.Count -eq 0) {
        Write-Host "❌ Nenhum arquivo VSIX encontrado!" -ForegroundColor Red
        exit 1
    }

    $latestVsix = $vsixFiles[0]
    Write-Host "📦 Validando: $($latestVsix.Name)" -ForegroundColor Green
    Write-Host ""

    # Carregar assemblies necessários
    Add-Type -AssemblyName System.IO.Compression.FileSystem

    # Abrir e listar conteúdo do VSIX
    $zip = [System.IO.Compression.ZipFile]::OpenRead($latestVsix.FullName)
    $htmlEntries = $zip.Entries | Where-Object { $_.FullName -match "\.html$" }

    Write-Host "📄 Arquivos HTML no VSIX:" -ForegroundColor Yellow
    if ($htmlEntries.Count -eq 0) {
        Write-Host "❌ Nenhum arquivo HTML encontrado no VSIX!" -ForegroundColor Red
        $zip.Dispose()
        exit 1
    }

    foreach ($entry in $htmlEntries) {
        $sizeKB = [math]::Round($entry.Length / 1024, 1)
        Write-Host "   ✅ $($entry.FullName) ($sizeKB KB)" -ForegroundColor Green
    }

    # Verificar caminhos esperados
    $expectedPaths = @(
        "extension/dist/public/index.html",
        "extension/dist/public/extension.html"
    )

    $actualPaths = $htmlEntries | ForEach-Object { $_.FullName }
    $missingPaths = $expectedPaths | Where-Object { $_ -notin $actualPaths }
    $unexpectedPaths = $actualPaths | Where-Object { $_ -notin $expectedPaths }

    $zip.Dispose()

    if ($missingPaths.Count -gt 0) {
        Write-Host "❌ Arquivos HTML obrigatórios ausentes: $($missingPaths -join ', ')" -ForegroundColor Red
    }

    if ($unexpectedPaths.Count -gt 0) {
        Write-Host "⚠️  Arquivos HTML inesperados encontrados: $($unexpectedPaths -join ', ')" -ForegroundColor Yellow
        Write-Host "   Estes podem causar erros 404 se referenciados no manifest." -ForegroundColor Yellow
    }

    if ($missingPaths.Count -gt 0) {
        exit 1
    }

    Write-Host ""
    Write-Host "✅ VSIX validado com sucesso!" -ForegroundColor Green
    Write-Host "📊 Total de arquivos HTML: $($htmlEntries.Count)" -ForegroundColor Cyan
    Write-Host "📝 Arquivo: $($latestVsix.Name)" -ForegroundColor Cyan
    Write-Host ""

}
catch {
    Write-Host "❌ Erro durante validação do VSIX: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}