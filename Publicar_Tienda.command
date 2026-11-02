#!/bin/bash
# ============================================================================
# KAOJ STORE - PUBLICADOR AUTOMÁTICO EN 1 CLIC (MAC / VS CODE)
# Compila app.jsx -> app.js + index.html y sube todo automáticamente a GitHub
# ============================================================================
cd "$(dirname "$0")" || exit 1

echo "========================================================"
echo "  ✨ KAOJ STORE - COMPILANDO Y SUBIENDO A GITHUB ✨"
echo "========================================================"

# 1. Compilar cambios de app.jsx hacia app.js e index.html
python3 build.py

# 2. Asegurar que el remoto de GitHub esté conectado
git remote set-url origin https://github.com/jhojann2002-design/KaojStore.git 2>/dev/null || git remote add origin https://github.com/jhojann2002-design/KaojStore.git

# 3. Guardar todos los archivos nuevos y modificados
git add -A

if ! git diff --cached --quiet; then
   FECHA=$(date '+%Y-%m-%d %H:%M:%S')
  git commit -m "Actualización Kaoj Store ($FECHA)"
fi

# 4. Subir directo a la rama main de GitHub
echo "Subiendo cambios a https://github.com/jhojann2002-design/KaojStore ..."
git push -u origin main --force

echo ""
echo "✅ ¡LISTO! Tu tienda Kaoj Store ya está actualizada en GitHub."
