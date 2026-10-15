Add-Type -AssemblyName System.Drawing

$srcPath = "C:\IT\App\monitoringkotakp3k\assets\images\logo-cba.png"
$publicDir = "C:\IT\App\map-cba\public"

# Copy original as logo.png and logo-512.png
Copy-Item $srcPath (Join-Path $publicDir "logo.png") -Force
Copy-Item $srcPath (Join-Path $publicDir "logo-512.png") -Force

# Resize function
function Resize-Image($sourcePath, $targetPath, $width, $height) {
    $src = [System.Drawing.Image]::FromFile($sourcePath)
    $dest = New-Object System.Drawing.Bitmap($width, $height)
    $g = [System.Drawing.Graphics]::FromImage($dest)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.DrawImage($src, 0, 0, $width, $height)
    $dest.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $dest.Dispose()
    $src.Dispose()
}

Resize-Image $srcPath (Join-Path $publicDir "logo-192.png") 192 192
Resize-Image $srcPath (Join-Path $publicDir "logo-144.png") 144 144
Resize-Image $srcPath (Join-Path $publicDir "logo-96.png") 96 96
Resize-Image $srcPath (Join-Path $publicDir "logo-48.png") 48 48
Resize-Image $srcPath (Join-Path $publicDir "favicon.png") 64 64

Write-Output "Successfully generated PWA and app logos!"
