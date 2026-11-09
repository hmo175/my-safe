Add-Type -AssemblyName System.Drawing

$bmp = New-Object System.Drawing.Bitmap 64, 64
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.Clear([System.Drawing.Color]::Transparent)

# Draw Emerald Shield Background
$shieldPoints = @(
    (New-Object System.Drawing.Point 32, 6),
    (New-Object System.Drawing.Point 54, 14),
    (New-Object System.Drawing.Point 54, 34),
    (New-Object System.Drawing.Point 32, 58),
    (New-Object System.Drawing.Point 10, 34),
    (New-Object System.Drawing.Point 10, 14)
)

$brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 16, 185, 129))
$g.FillPolygon($brush, $shieldPoints)

# Draw Inner Checkmark
$pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 255, 255, 255)), 4
$checkPoints = @(
    (New-Object System.Drawing.Point 22, 32),
    (New-Object System.Drawing.Point 30, 40),
    (New-Object System.Drawing.Point 44, 22)
)
$g.DrawLines($pen, $checkPoints)

$g.Dispose()

New-Item -ItemType Directory -Force -Path 'resources' | Out-Null
New-Item -ItemType Directory -Force -Path 'dist-electron' | Out-Null
$bmp.Save('resources/tray.png', [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Save('dist-electron/tray.png', [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output "Shield Icon Generated Successfully!"
