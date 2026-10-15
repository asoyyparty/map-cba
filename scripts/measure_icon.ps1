Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\SERVER-NEW\.gemini\antigravity\brain\df36a83d-df72-41f6-8ec8-ddb16df89939\network_map_app_icon_1792067982562.jpg"
$bmp = New-Object System.Drawing.Bitmap($srcPath)

# Sample along the center horizontal line (Y = 512) to find left and right edges
$midY = 512
$left = 0
$right = 1023

for ($x = 50; $x -lt 512; $x++) {
    $c = $bmp.GetPixel($x, $midY)
    # Background is very dark (~20-30), icon border has cyan glow (> 60)
    if ($c.B -gt 60 -or $c.G -gt 55) {
        $left = $x
        break
    }
}

for ($x = 974; $x -gt 512; $x--) {
    $c = $bmp.GetPixel($x, $midY)
    if ($c.B -gt 60 -or $c.G -gt 55) {
        $right = $x
        break
    }
}

# Sample along vertical center (X = 512)
$top = 0
$bottom = 1023
for ($y = 50; $y -lt 512; $y++) {
    $c = $bmp.GetPixel(512, $y)
    if ($c.B -gt 60 -or $c.G -gt 55) {
        $top = $y
        break
    }
}

for ($y = 974; $y -gt 512; $y--) {
    $c = $bmp.GetPixel(512, $y)
    if ($c.B -gt 60 -or $c.G -gt 55) {
        $bottom = $y
        break
    }
}

Write-Output "Found squircle boundaries: Left=$left, Right=$right, Top=$top, Bottom=$bottom"
$bmp.Dispose()
