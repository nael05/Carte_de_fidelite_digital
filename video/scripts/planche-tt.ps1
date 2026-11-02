# Planche contact des images de contrôle : powershell -File scripts/planche-tt.ps1 <sortie.jpg> <image1> <image2> …
param([string]$out, [Parameter(ValueFromRemainingArguments = $true)][string[]]$imgs)
Add-Type -AssemblyName System.Drawing
$w = 270; $h = 480; $cols = [Math]::Min(6, $imgs.Count); $rows = [Math]::Ceiling($imgs.Count / $cols)
$bmp = New-Object System.Drawing.Bitmap ($w * $cols), ($h * $rows)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = 'HighQualityBicubic'
$font = New-Object System.Drawing.Font 'Arial', 14, ([System.Drawing.FontStyle]::Bold)
for ($i = 0; $i -lt $imgs.Count; $i++) {
  $im = [System.Drawing.Image]::FromFile((Resolve-Path $imgs[$i]))
  $x = ($i % $cols) * $w; $y = [Math]::Floor($i / $cols) * $h
  $g.DrawImage($im, $x, $y, $w, $h)
  $g.DrawString([IO.Path]::GetFileNameWithoutExtension($imgs[$i]).Split('-')[-1], $font, [System.Drawing.Brushes]::Yellow, $x + 4, $y + 4)
  $im.Dispose()
}
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Jpeg)
