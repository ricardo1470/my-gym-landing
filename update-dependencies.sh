#!/bin/bash

# Actualizar Next.js a la última versión
npm install next@latest

# Actualizar todas las dependencias a sus últimas versiones
npm update

# Actualizar todas las devDependencies a sus últimas versiones
npm update --dev

# Mostrar las dependencias actualizadas
echo "Dependencias actualizadas:"
npm ls --depth=0

echo "DevDependencies actualizadas:"
npm ls --dev --depth=0

# Ejecutar npm audit para verificar vulnerabilidades
npm audit

# Sugerir npm audit fix si se encuentran vulnerabilidades
if [ $? -ne 0 ]; then
    echo "Se encontraron vulnerabilidades. Considere ejecutar 'npm audit fix' para resolverlas."
fi
