@echo off
REM Migration: Add multiple TypeCaisses per Livraison
REM Usage: scripts\run-migration.cmd

echo Starting migration...

psql "postgresql://neondb_owner:npg_LM4CfuWmdP3e@ep-icy-lake-aiwu9yt7.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require" -f prisma\migrations\add_multiple_caisses.sql

if %ERRORLEVEL% EQU 0 (
    echo Migration completed successfully!
    echo.
    echo Now run: bunx prisma generate
) else (
    echo Migration failed with error code %ERRORLEVEL%
)

pause
