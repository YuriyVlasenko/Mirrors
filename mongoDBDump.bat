"C:\Program Files\MongoDB\Server\3.0\bin\mongodump.exe"

powershell.exe -nologo -noprofile -command "& { If (Test-Path 'E:\mirrorsGit\mirrors\dump\archive.zip'){ Remove-Item 'E:\mirrorsGit\mirrors\dump\archive.zip'} Add-Type -A 'System.IO.Compression.FileSystem'; [IO.Compression.ZipFile]::CreateFromDirectory('E:\mirrorsGit\mirrors\dump\mirrorsDb', 'E:\mirrorsGit\mirrors\dump\archive.zip'); }"

