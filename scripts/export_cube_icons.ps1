Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\SERVER-NEW\.gemini\antigravity\brain\df36a83d-df72-41f6-8ec8-ddb16df89939\network_topology_icon_1792068942653.jpg"
$publicDir = "C:\IT\App\map-cba\public"

$src = [System.Drawing.Image]::FromFile($srcPath)

# Centered squircle crop (776 x 776 at 124, 124)
$cropRect = New-Object System.Drawing.Rectangle(124, 124, 776, 776)

function Export-Icon($targetSize, $targetFileName) {
    $dest = New-Object System.Drawing.Bitmap($targetSize, $targetSize)
    $g = [System.Drawing.Graphics]::FromImage($dest)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    $destRect = New-Object System.Drawing.Rectangle(0, 0, $targetSize, $targetSize)
    $g.DrawImage($src, $destRect, $cropRect, [System.Drawing.GraphicsUnit]::Pixel)
    
    $outPath = Join-Path $publicDir $targetFileName
    $dest.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $dest.Dispose()
    Write-Output "Exported: $targetFileName ($targetSize x $targetSize)"
}

Export-Icon 512 "logo-512.png"
Export-Icon 512 "logo.png"
Export-Icon 192 "logo-192.png"
Export-Icon 144 "logo-144.png"
Export-Icon 96  "logo-96.png"
Export-Icon 48  "logo-48.png"
Export-Icon 64  "favicon.png"

$src.Dispose()
Write-Output "All 3D modular network cube icons exported successfully!"
