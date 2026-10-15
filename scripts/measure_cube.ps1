Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\SERVER-NEW\.gemini\antigravity\brain\df36a83d-df72-41f6-8ec8-ddb16df89939\network_topology_icon_1792068942653.jpg"
$bmp = New-Object System.Drawing.Bitmap($srcPath)

$midY = 512
$left = 0
$right = 1023

for ($x = 50; $x -lt 512; $x++) {
    $c = $bmp.GetPixel($x, $midY)
    if ($c.B -gt 45 -or $c.G -gt 40) {
        $left = $x
        break
    }
}

for ($x = 974; $x -gt 512; $x--) {
    $c = $bmp.GetPixel($x, $midY)
    if ($c.B -gt 45 -or $c.G -gt 40) {
        $right = $x
        break
    }
}

$top = 0
$bottom = 1023
for ($y = 50; $y -lt 512; $y++) {
    $c = $bmp.GetPixel(512, $y)
    if ($c.B -gt 45 -or $c.G -gt 40) {
        $top = $y
        break
    }
}

for ($y = 974; $y -gt 512; $y--) {
    $c = $bmp.GetPixel(512, $y)
    if ($c.B -gt 45 -or $c.G -gt 40) {
        $bottom = $y
        break
    }
}

Write-Output "Found boundaries: Left=$left, Right=$right, Top=$top, Bottom=$bottom"
$bmp.Dispose()
