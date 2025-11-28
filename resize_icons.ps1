
Add-Type -AssemblyName System.Drawing

function Resize-Image {
    param (
        [string]$InputFile,
        [string]$OutputFile,
        [int]$Width,
        [int]$Height
    )

    $srcImage = [System.Drawing.Image]::FromFile($InputFile)
    $newBitmap = New-Object System.Drawing.Bitmap($Width, $Height)
    $graphics = [System.Drawing.Graphics]::FromImage($newBitmap)
    
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    $graphics.DrawImage($srcImage, 0, 0, $Width, $Height)
    
    $newBitmap.Save($OutputFile, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $srcImage.Dispose()
    $newBitmap.Dispose()
    $graphics.Dispose()
    
    Write-Host "Resized $InputFile to $Width x $Height at $OutputFile"
}

$sourceIcon = "C:\Users\USER\.gemini\antigravity\brain\4d69d118-c9ec-404a-94f3-44be3440a581\uploaded_image_1764322807894.png"
Resize-Image -InputFile $sourceIcon -OutputFile "c:\hugloom\public\icons\icon-192x192.png" -Width 192 -Height 192
Resize-Image -InputFile $sourceIcon -OutputFile "c:\hugloom\public\icons\icon-512x512.png" -Width 512 -Height 512
