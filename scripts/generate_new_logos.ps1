Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\SERVER-NEW\.gemini\antigravity\brain\df36a83d-df72-41f6-8ec8-ddb16df89939\network_map_app_icon_1792067982562.jpg"
$publicDir = "C:\IT\App\map-cba\public"

$src = [System.Drawing.Image]::FromFile($srcPath)

# 1. Save uncropped master as logo-full.png
$fullBmp = New-Object System.Drawing.Bitmap(512, 512)
$gFull = [System.Drawing.Graphics]::FromImage($fullBmp)
$gFull.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gFull.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$gFull.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$gFull.DrawImage($src, 0, 0, 512, 512)
$fullBmp.Save((Join-Path $publicDir "logo-full.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$gFull.Dispose()
$fullBmp.Dispose()

# 2. Crop to the squircle icon (centered 632x632 at 196, 196 with 4px padding: 192, 192, 640, 640)
$cropRect = New-Object System.Drawing.Rectangle(192, 192, 640, 640)

function Export-Cropped-Icon($targetSize, $targetFileName) {
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
    Write-Output "Generated $targetFileName ($targetSize x $targetSize)"
}

Export-Cropped-Icon 512 "logo-512.png"
Export-Cropped-Icon 512 "logo.png"
Export-Cropped-Icon 192 "logo-192.png"
Export-Cropped-Icon 144 "logo-144.png"
Export-Cropped-Icon 96  "logo-96.png"
Export-Cropped-Icon 48  "logo-48.png"
Export-Cropped-Icon 64  "favicon.png"

$src.Dispose()
Write-Output "All new logos generated successfully!"
