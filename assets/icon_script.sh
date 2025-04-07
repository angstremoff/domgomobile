#!/bin/bash
# Простой скрипт для создания иконки
# Используем convert из ImageMagick для создания иконки

# Создаем квадратное изображение 1024x1024 с синим фоном для основной иконки
convert -size 1024x1024 xc:#0075FF \
  -fill white -pointsize 200 -gravity center -annotate 0 "DomGo" \
  /Users/savaleserg/CascadeProjects/DomGoMobile/assets/icon.png

# Создаем адаптивную иконку для Android
convert -size 1024x1024 xc:#0075FF \
  -fill white -pointsize 200 -gravity center -annotate 0 "DomGo" \
  /Users/savaleserg/CascadeProjects/DomGoMobile/assets/adaptive-icon.png

# Создаем иконку для сплеш-скрина
convert -size 1024x1024 xc:#0075FF \
  -fill white -pointsize 200 -gravity center -annotate 0 "DomGo" \
  /Users/savaleserg/CascadeProjects/DomGoMobile/assets/splash-icon.png

# Создаем favicon
convert -size 196x196 xc:#0075FF \
  -fill white -pointsize 40 -gravity center -annotate 0 "DomGo" \
  /Users/savaleserg/CascadeProjects/DomGoMobile/assets/favicon.png

echo "Иконки созданы!"
