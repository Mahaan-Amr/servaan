@echo off
echo ==========================================
echo Servaan Backup Scripts Deployment
echo ==========================================
echo.

echo This script will help you deploy backup scripts to your server.
echo.
echo BEFORE YOU START:
echo 1. Make sure you have your server IP address
echo 2. Make sure you have SSH access to your server as ROOT
echo 3. Make sure you're in the servaan project directory
echo.

set /p SERVER_IP="Enter your server IP address: "
set /p SERVER_USER="Enter your server username (usually 'root'): "

echo.
echo ==========================================
echo Step 1: Testing Server Connection
echo ==========================================
echo.

echo Testing connection to %SERVER_USER%@%SERVER_IP%...
ping -n 1 %SERVER_IP% >nul 2>&1
if errorlevel 1 (
    echo ERROR: Cannot reach server %SERVER_IP%
    echo Please check your internet connection and server status.
    pause
    exit /b 1
)

echo Server is reachable!
echo.

echo ==========================================
echo Step 2: Testing SSH Connection
echo ==========================================
echo.

echo Testing SSH connection...
ssh -o ConnectTimeout=10 %SERVER_USER%@%SERVER_IP% "echo 'SSH connection successful!'"
if errorlevel 1 (
    echo.
    echo ERROR: SSH connection failed!
    echo.
    echo Possible solutions:
    echo 1. Check if you have SSH key set up
    echo 2. Check if you have the correct username (try 'root')
    echo 3. Check if SSH is enabled on your server
    echo 4. Try connecting manually: ssh %SERVER_USER%@%SERVER_IP%
    echo.
    pause
    exit /b 1
)

echo SSH connection successful!
echo.

echo ==========================================
echo Step 3: Deploying Backup Scripts
echo ==========================================
echo.

echo Creating backup scripts directory on server...
ssh %SERVER_USER%@%SERVER_IP% "mkdir -p /opt/servaan/backup-scripts"

echo Copying backup scripts to server...
scp server-backup.sh %SERVER_USER%@%SERVER_IP%:/opt/servaan/backup-scripts/
scp quick-server-backup.sh %SERVER_USER%@%SERVER_IP%:/opt/servaan/backup-scripts/

echo Making scripts executable...
ssh %SERVER_USER%@%SERVER_IP% "chmod +x /opt/servaan/backup-scripts/*.sh"

echo Creating backup directory...
ssh %SERVER_USER%@%SERVER_IP% "mkdir -p /opt/servaan/backups"

echo.
echo ==========================================
echo Deployment Complete!
echo ==========================================
echo.
echo Your backup scripts are now on the server at:
echo /opt/servaan/backup-scripts/
echo.
echo To run your first backup:
echo 1. SSH to your server: ssh %SERVER_USER%@%SERVER_IP%
echo 2. Navigate to scripts: cd /opt/servaan/backup-scripts
echo 3. Run backup: ./server-backup.sh
echo.
echo Or run quick backup: ./quick-server-backup.sh
echo.
echo Backups will be stored in: /opt/servaan/backups/
echo ==========================================
echo.
pause
