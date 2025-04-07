const fs = require('fs');
const sharp = require('sharp');
const path = require('path');

// Чтение SVG файла
const svgBuffer = fs.readFileSync(path.join(__dirname, 'assets', 'favicon.svg'));

// Создание разных размеров иконок
async function convertIcons() {
  try {
    // Основная иконка (1024x1024)
    await sharp(svgBuffer)
      .resize(1024, 1024)
      .png()
      .toFile(path.join(__dirname, 'assets', 'icon.png'));
    
    // Адаптивная иконка для Android (1024x1024)
    await sharp(svgBuffer)
      .resize(1024, 1024)
      .png()
      .toFile(path.join(__dirname, 'assets', 'adaptive-icon.png'));
    
    // Иконка для сплеш-скрина (1024x1024)
    await sharp(svgBuffer)
      .resize(1024, 1024)
      .png()
      .toFile(path.join(__dirname, 'assets', 'splash-icon.png'));
    
    // Favicon (196x196)
    await sharp(svgBuffer)
      .resize(196, 196)
      .png()
      .toFile(path.join(__dirname, 'assets', 'favicon.png'));
    
    console.log('Все иконки успешно созданы!');
  } catch (error) {
    console.error('Ошибка при создании иконок:', error);
  }
}

convertIcons();
