#!/bin/bash
# Criar ícones placeholder (você pode substituir por ícones reais depois)
sizes=(72 96 128 144 152 192 384 512)
for size in "${sizes[@]}"; do
  # Criar um SVG temporário com o tamanho correto
  cat > temp-${size}.svg << SVGEOF
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="$(($size/4))" fill="#09090b"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="$(($size/2))" fill="#10b981" font-family="Arial, sans-serif" font-weight="bold">U</text>
</svg>
SVGEOF
  # Renomear para PNG (navegadores aceitam SVG como PNG em muitos casos)
  mv temp-${size}.svg icon-${size}x${size}.png
done
echo "✅ Ícones placeholder criados!"
