param(
    [string]$TargetFolder = (Get-Location).Path
)

# -- Setup --
Add-Type -AssemblyName Microsoft.VisualBasic

$docExts = @('.pdf','.doc','.docx','.ppt','.pptx','.txt')
$deletedFiles = [System.Collections.Generic.List[string]]::new()
$renamedFiles = [System.Collections.Generic.List[string]]::new()

function Send-ToRecycleBin {
    param([string]$FilePath)
    try {
        [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile(
            $FilePath,
            [Microsoft.VisualBasic.FileIO.UIOption]::OnlyErrorDialogs,
            [Microsoft.VisualBasic.FileIO.RecycleOption]::SendToRecycleBin
        )
        return $true
    }
    catch {
        Write-Warning "  Could not recycle: $FilePath - $($_.Exception.Message)"
        return $false
    }
}

# -- Gather all files (non-recursive) --
$allFiles = Get-ChildItem -LiteralPath $TargetFolder -File

# -- Regex patterns for Windows-style duplicates --
# Matches:  "name (1).ext"  "name (2).ext"
$rxNumbered = '^(?<base>.+?)\s*\((?<num>\d+)\)(?<ext>\.[^.]+)$'
# Matches:  "name - Copy.ext"  "name - Copy (2).ext"  "name -copy.ext"  "name-copy.ext"
$rxCopy = '^(?<base>.+?)\s*-\s*[Cc]opy(?:\s*\((?<num>\d+)\))?(?<ext>\.[^.]+)$'

# -- Build groups --
$groups = @{}

foreach ($f in $allFiles) {
    $name = $f.Name
    $ext  = $f.Extension.ToLower()

    $canonical = $null
    $index     = 0
    $isCopy    = $false

    if ($name -match $rxNumbered) {
        $canonical = $Matches['base'].TrimEnd()
        $index     = [int]$Matches['num']
    }
    elseif ($name -match $rxCopy) {
        $canonical = $Matches['base'].TrimEnd()
        if ($Matches['num']) {
            $index = [int]$Matches['num']
        } else {
            $index = 1
        }
        $isCopy = $true
    }
    else {
        $canonical = [System.IO.Path]::GetFileNameWithoutExtension($name)
        $index     = 0
    }

    $key = "$canonical|$ext"

    if (-not $groups.ContainsKey($key)) {
        $groups[$key] = [System.Collections.Generic.List[PSCustomObject]]::new()
    }

    $groups[$key].Add([PSCustomObject]@{
        File      = $f
        Canonical = $canonical
        Ext       = $ext
        Index     = $index
        IsCopy    = $isCopy
    })
}

# -- Process each group --
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Duplicate File Cleaner"                -ForegroundColor Cyan
Write-Host "  Folder: $TargetFolder"                 -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

foreach ($key in @($groups.Keys)) {
    $members = $groups[$key]

    if ($members.Count -lt 2) { continue }

    $ext       = $members[0].Ext
    $canonical = $members[0].Canonical
    $isDoc     = $docExts -contains $ext

    $hasCopies    = ($members | Where-Object { $_.IsCopy }) -ne $null
    $hasNumbered  = ($members | Where-Object { $_.Index -gt 0 -and (-not $_.IsCopy) }) -ne $null

    $toDelete = @()
    $toKeep   = $null

    if ($isDoc) {
        # -- DOCUMENT FILES --

        if ($hasCopies) {
            # "- Copy" variants exist: keep the LAST MODIFIED across all members
            # (original + copies), delete the rest, rename survivor to canonical
            $sorted   = @($members | Sort-Object { $_.File.LastWriteTime } -Descending)
            $toKeep   = $sorted[0]
            $toDelete = @($sorted | Select-Object -Skip 1)
        }
        elseif ($hasNumbered) {
            # Numbered copies: keep highest (N), delete the rest, rename to original
            $sorted   = @($members | Sort-Object { $_.Index } -Descending)
            $toKeep   = $sorted[0]
            $toDelete = @($sorted | Select-Object -Skip 1)
        }
        else {
            continue
        }
    }
    else {
        # -- NON-DOCUMENT FILES --
        # Keep the biggest; break ties by newest modified
        $sorted   = @($members | Sort-Object `
            @{Expression={$_.File.Length};       Descending=$true},
            @{Expression={$_.File.LastWriteTime};Descending=$true})
        $toKeep   = $sorted[0]
        $toDelete = @($sorted | Select-Object -Skip 1)
    }

    if ($toDelete.Count -eq 0) { continue }

    $keepName = $toKeep.File.Name
    Write-Host "Group: $canonical$ext" -ForegroundColor Yellow
    Write-Host "  KEEP : $keepName  ($([math]::Round($toKeep.File.Length/1KB,1)) KB, modified $($toKeep.File.LastWriteTime.ToString('yyyy-MM-dd HH:mm')))" -ForegroundColor Green

    foreach ($d in $toDelete) {
        $dPath = $d.File.FullName
        $dName = $d.File.Name
        Write-Host "  DEL  : $dName  ($([math]::Round($d.File.Length/1KB,1)) KB)" -ForegroundColor Red
        if (Send-ToRecycleBin -FilePath $dPath) {
            $deletedFiles.Add($dName)
        }
    }

    # -- Rename the kept file to the canonical name if needed --
    $desiredName = "$canonical$ext"
    if ($toKeep.File.Name -ne $desiredName) {
        $destPath = Join-Path $TargetFolder $desiredName
        # Wait a moment for recycle bin to release file locks
        Start-Sleep -Milliseconds 300
        if (-not (Test-Path -LiteralPath $destPath)) {
            Rename-Item -LiteralPath $toKeep.File.FullName -NewName $desiredName -ErrorAction SilentlyContinue
            Write-Host "  REN  : $keepName  -->  $desiredName" -ForegroundColor Magenta
            $renamedFiles.Add("$keepName  -->  $desiredName")
        }
        else {
            Write-Host "  SKIP RENAME: '$desiredName' still exists on disk." -ForegroundColor DarkYellow
        }
    }

    Write-Host ""
}

# -- Summary --
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SUMMARY"                               -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($deletedFiles.Count -eq 0) {
    Write-Host "  No duplicates found. Folder is clean!" -ForegroundColor Green
}
else {
    Write-Host "  Files sent to Recycle Bin ($($deletedFiles.Count)):" -ForegroundColor Red
    foreach ($df in $deletedFiles) {
        Write-Host "    - $df" -ForegroundColor Red
    }
    Write-Host ""
    if ($renamedFiles.Count -gt 0) {
        Write-Host "  Files renamed ($($renamedFiles.Count)):" -ForegroundColor Magenta
        foreach ($rf in $renamedFiles) {
            Write-Host "    - $rf" -ForegroundColor Magenta
        }
    }
}

Write-Host ""
Write-Host "Done." -ForegroundColor Cyan
Write-Host ""
