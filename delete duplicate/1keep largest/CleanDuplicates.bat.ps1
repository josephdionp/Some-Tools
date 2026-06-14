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
# Key = "canonical|.ext"   Value = list of PSCustomObject
$groups = @{}

foreach ($f in $allFiles) {
    $name = $f.Name
    $ext  = $f.Extension.ToLower()

    $canonical = $null
    $index     = 0
    $isCopy    = $false

    # Try numbered pattern first:  something (2).pdf
    if ($name -match $rxNumbered) {
        $canonical = $Matches['base'].TrimEnd()
        $index     = [int]$Matches['num']
    }
    # Try copy pattern:  something - Copy.pdf
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
        # Original / non-duplicate file
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

    # Skip groups with only one file
    if ($members.Count -lt 2) { continue }

    $ext       = $members[0].Ext
    $canonical = $members[0].Canonical
    $isDoc     = $docExts -contains $ext

    # Separate "- Copy" members from numbered/original members
    $copyMembers     = @($members | Where-Object { $_.IsCopy })
    $numberedMembers = @($members | Where-Object { -not $_.IsCopy })

    $toDelete = @()
    $toKeep   = $null

    if ($isDoc) {
        # -- DOCUMENT FILES --
        # Strategy A: If there are "- Copy" variants, keep the LARGEST by size
        if ($copyMembers.Count -gt 0) {
            $allSorted = @($members | Sort-Object { $_.File.Length } -Descending)
            $toKeep    = $allSorted[0]
            $toDelete  = @($allSorted | Select-Object -Skip 1)
        }
        else {
            # Strategy B: Numbered copies - keep highest index, rename to original
            $sorted   = @($members | Sort-Object { $_.Index } -Descending)
            $toKeep   = $sorted[0]
            $toDelete = @($sorted | Select-Object -Skip 1)
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

    # -- Execute deletions --
    if ($toDelete.Count -eq 0) { continue }

    $keepName = $toKeep.File.Name
    Write-Host "Group: $canonical$ext" -ForegroundColor Yellow
    Write-Host "  KEEP : $keepName  ($([math]::Round($toKeep.File.Length/1KB,1)) KB)" -ForegroundColor Green

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
