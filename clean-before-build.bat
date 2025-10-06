@echo off
echo ======================================
echo Limpieza Pre-Empaquetado
echo ======================================
echo.

echo [1/5] Limpiando cache de Python...
if exist "backend\__pycache__" (
    rmdir /s /q "backend\__pycache__"
    echo   √ Cache de Python eliminado
) else (
    echo   - No hay cache de Python
)

echo.
echo [2/5] Limpiando archivos temporales del backend...
if exist "backend\temp_output" (
    rmdir /s /q "backend\temp_output"
    echo   √ Archivos temporales eliminados
) else (
    echo   - No hay archivos temporales
)

echo.
echo [3/5] Limpiando archivos de assets subidos...
if exist "backend\assets" (
    del /q "backend\assets\*.*" 2>nul
    echo   √ Assets de prueba eliminados
) else (
    echo   - No hay assets
)

echo.
echo [4/5] Limpiando distribuciones anteriores...
if exist "dist" (
    rmdir /s /q "dist"
    echo   √ Carpeta dist eliminada
) else (
    echo   - No hay dist anterior
)

echo.
echo [5/5] Verificando base de datos...
if exist "backend\db.sqlite" (
    echo   √ Base de datos encontrada
) else (
    echo   ⚠ ADVERTENCIA: No se encontró db.sqlite
    echo   La base de datos debería existir para el empaquetado
)

echo.
echo ======================================
echo ✓ Limpieza completada
echo ======================================
echo.
echo Ahora puedes ejecutar: npm run build
echo.
pause
