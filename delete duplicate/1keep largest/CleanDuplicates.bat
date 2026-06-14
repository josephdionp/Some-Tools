@echo off
REM ============================================================
REM  CleanDuplicates.bat
REM  Cleans duplicate files in the current folder.
REM  - Documents (pdf/docx/doc/pptx/ppt/txt):
REM      Numbered copies  : keeps highest (N), deletes the rest, renames to original.
REM      "- Copy" variants: keeps the LARGEST by size, deletes the rest.
REM  - All other files:
REM      Keeps the LARGEST + LATEST-modified, deletes the rest.
REM  All deletions go to the Recycle Bin.
REM ============================================================
REM  USAGE:  Place this .bat in the target folder and double-click,
REM          OR drag-drop a folder onto it,
REM          OR run:  CleanDuplicates.bat "C:\some\folder"
REM ============================================================

setlocal
if "%~1"=="" (
    set "TARGET=%~dp0"
) else (
    set "TARGET=%~1"
)

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "& { . '%~f0.ps1' -TargetFolder '%TARGET%' }"

pause
exit /b

