Add-Type -AssemblyName System.Drawing

$size = 256
$bmp = New-Object System.Drawing.Bitmap $size, $size
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.Clear([System.Drawing.Color]::Transparent)

# Draw Emerald Shield Background
$shieldPoints = @(
    (New-Object System.Drawing.Point 128, 20),
    (New-Object System.Drawing.Point 220, 52),
    (New-Object System.Drawing.Point 220, 136),
    (New-Object System.Drawing.Point 128, 236),
    (New-Object System.Drawing.Point 36, 136),
    (New-Object System.Drawing.Point 36, 52)
)

$brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 16, 185, 129))
$g.FillPolygon($brush, $shieldPoints)

# Draw Inner Accent Checkmark
$pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 255, 255, 255)), 16
$pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
$checkPoints = @(
    (New-Object System.Drawing.Point 88, 128),
    (New-Object System.Drawing.Point 120, 160),
    (New-Object System.Drawing.Point 176, 88)
)
$g.DrawLines($pen, $checkPoints)

$g.Dispose()

New-Item -ItemType Directory -Force -Path 'resources' | Out-Null
$bmp.Save('resources/icon.png', [System.Drawing.Imaging.ImageFormat]::Png)

# Save as .ico using native icon handle
$hIcon = $bmp.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)
$fileStream = New-Object System.IO.FileStream('resources/icon.ico', [System.IO.FileMode]::Create)
$icon.Save($fileStream)
$fileStream.Close()

Write-Output "256x256 icon.png and icon.ico generated successfully!"
