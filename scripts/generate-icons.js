/**
 * Script para gerar ícones PWA em vários tamanhos
 *
 * Como usar este arquivo SVG base para gerar os PNGs:
 *
 * OPÇÃO 1 - Online (Mais Fácil):
 * 1. Acesse: https://realfavicongenerator.net/
 * 2. Faça upload do arquivo: public/icons/icon.svg
 * 3. Configure as opções e baixe o pacote
 * 4. Extraia os arquivos para public/icons/
 *
 * OPÇÃO 2 - Usando Inkscape (CLI):
 * Instale o Inkscape e execute os comandos abaixo:
 *
 * inkscape public/icons/icon.svg --export-type=png --export-filename=public/icons/icon-72x72.png -w 72 -h 72
 * inkscape public/icons/icon.svg --export-type=png --export-filename=public/icons/icon-96x96.png -w 96 -h 96
 * inkscape public/icons/icon.svg --export-type=png --export-filename=public/icons/icon-128x128.png -w 128 -h 128
 * inkscape public/icons/icon.svg --export-type=png --export-filename=public/icons/icon-144x144.png -w 144 -h 144
 * inkscape public/icons/icon.svg --export-type=png --export-filename=public/icons/icon-152x152.png -w 152 -h 152
 * inkscape public/icons/icon.svg --export-type=png --export-filename=public/icons/icon-192x192.png -w 192 -h 192
 * inkscape public/icons/icon.svg --export-type=png --export-filename=public/icons/icon-384x384.png -w 384 -h 384
 * inkscape public/icons/icon.svg --export-type=png --export-filename=public/icons/icon-512x512.png -w 512 -h 512
 *
 * OPÇÃO 3 - Usando ImageMagick:
 * convert -background none public/icons/icon.svg -resize 72x72 public/icons/icon-72x72.png
 * convert -background none public/icons/icon.svg -resize 96x96 public/icons/icon-96x96.png
 * convert -background none public/icons/icon.svg -resize 128x128 public/icons/icon-128x128.png
 * convert -background none public/icons/icon.svg -resize 144x144 public/icons/icon-144x144.png
 * convert -background none public/icons/icon.svg -resize 152x152 public/icons/icon-152x152.png
 * convert -background none public/icons/icon.svg -resize 192x192 public/icons/icon-192x192.png
 * convert -background none public/icons/icon.svg -resize 384x384 public/icons/icon-384x384.png
 * convert -background none public/icons/icon.svg -resize 512x512 public/icons/icon-512x512.png
 */

console.log('📱 Para gerar os ícones PWA, use uma das opções no comentário acima!');
console.log('🌐 Recomendado: https://realfavicongenerator.net/');
