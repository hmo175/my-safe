Add-Type -AssemblyName System.Drawing

function Draw-ShieldMaster {
    param([int]$size = 256)
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.Clear([System.Drawing.Color]::Transparent)

    # Outer dark rounded container for crisp visibility on light & dark browser toolbars
    $pad = 8
    $rect = New-Object System.Drawing.Rectangle $pad, $pad, ($size - 2 * $pad), ($size - 2 * $pad)
    $radius = 52
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddArc($rect.X, $rect.Y, $radius, $radius, 180, 90)
    $path.AddArc($rect.Right - $radius, $rect.Y, $radius, $radius, 270, 90)
    $path.AddArc($rect.Right - $radius, $rect.Bottom - $radius, $radius, $radius, 0, 90)
    $path.AddArc($rect.X, $rect.Bottom - $radius, $radius, $radius, 90, 90)
    $path.CloseFigure()

    $bgBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 11, 15, 23))
    $g.FillPath($bgBrush, $path)

    $borderPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(140, 16, 185, 129)), 6
    $g.DrawPath($borderPen, $path)

    # Emerald Shield
    $shieldPoints = @(
        (New-Object System.Drawing.Point 128, 36),
        (New-Object System.Drawing.Point 206, 66),
        (New-Object System.Drawing.Point 206, 136),
        (New-Object System.Drawing.Point 128, 220),
        (New-Object System.Drawing.Point 50, 136),
        (New-Object System.Drawing.Point 50, 66)
    )
    $shieldBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 16, 185, 129))
    $g.FillPolygon($shieldBrush, $shieldPoints)

    # Crisp White Checkmark
    $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 255, 255, 255)), 18
    $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    $checkPoints = @(
        (New-Object System.Drawing.Point 90, 128),
        (New-Object System.Drawing.Point 118, 156),
        (New-Object System.Drawing.Point 168, 96)
    )
    $g.DrawLines($pen, $checkPoints)

    $g.Dispose()
    return $bmp
}

$outDir = "extension/icons"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$master = Draw-ShieldMaster -size 256
$sizes = @(16, 32, 48, 128)

foreach ($s in $sizes) {
    $resized = New-Object System.Drawing.Bitmap $s, $s
    $rg = [System.Drawing.Graphics]::FromImage($resized)
    $rg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $rg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $rg.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $rg.DrawImage($master, 0, 0, $s, $s)
    $rg.Dispose()
    $filePath = Join-Path $outDir "icon$s.png"
    $resized.Save($filePath, [System.Drawing.Imaging.ImageFormat]::Png)
    $resized.Dispose()
    Write-Output "Generated $filePath"
}

$master.Dispose()
