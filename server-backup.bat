@echo off
setlocal enabledelayedexpansion

REM Servaan Server Database Backup Script (Windows Batch)
REM This script triggers a backup on your Ubuntu server via SSH

echo ==========================================
echo Servaan Server Database Backup
echo ==========================================
echo.

REM Configuration
set SERVER_IP=your_server_ip_here
set SERVER_USER=ubuntu
set SSH_KEY_PATH=C:\Users\%USERNAME%\.ssh\id_rsa
set BACKUP_SCRIPT_PATH=/home/ubuntu/server-backup.sh

echo Configuration:
echo Server IP: %SERVER_IP%
echo Server User: %SERVER_USER%
echo SSH Key: %SSH_KEY_PATH%
echo.

REM Check if SSH key exists
if not exist "%SSH_KEY_PATH%" (
    echo ERROR: SSH key not found at %SSH_KEY_PATH%
    echo Please ensure you have SSH access configured to your server
    echo.
    pause
    exit /b 1
)

REM Check if server is reachable
echo Checking server connectivity...
ping -n 1 %SERVER_IP% >nul 2>&1
if errorlevel 1 (
    echo ERROR: Cannot reach server %SERVER_IP%
    echo Please check your internet connection and server status
    echo.
    pause
    exit /b 1
)

echo Server is reachable.
echo.

REM Upload backup script to server
echo Uploading backup script to server...
scp -i "%SSH_KEY_PATH%" -o StrictHostKeyChecking=no server-backup.sh %SERVER_USER%@%SERVER_IP%:/home/ubuntu/

if errorlevel 1 (
    echo ERROR: Failed to upload backup script
    echo Please check your SSH connection and permissions
    echo.
    pause
    exit /b 1
)

echo Backup script uploaded successfully.
echo.

REM Make script executable and run backup
echo Starting backup on server...
ssh -i "%SSH_KEY_PATH%" -o StrictHostKeyChecking=no %SERVER_USER%@%SERVER_IP% << 'EOF'
chmod +x /home/ubuntu/server-backup.sh
cd /home/ubuntu
./server-backup.sh
EOF

if errorlevel 1 (
    echo ERROR: Backup failed on server
    echo Please check the server logs for details
    echo.
    pause
    exit /b 1
)

echo.
echo ==========================================
echo Backup completed successfully!
echo ==========================================
echo.
echo The backup has been created on your server at:
echo /home/ubuntu/backups/
echo.
echo To download the backup files, you can use:
echo scp -i "%SSH_KEY_PATH%" %SERVER_USER%@%SERVER_IP%:/home/ubuntu/backups/* .
echo.
pause
