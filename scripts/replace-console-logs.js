#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Скрипт для массовой замены console.log на Logger во всех файлах проекта
 */

const CONFIG = {
  // Директории для поиска
  searchDirs: [
    './src/screens',
    './src/components', 
    './src/contexts',
    './src/hooks',
    './src/utils'
  ],
  
  // Расширения файлов для обработки
  fileExtensions: ['.ts', '.tsx', '.js', '.jsx'],
  
  // Исключения - файлы которые не трогаем
  excludeFiles: [
    'logger.ts', // Сам файл логгера
    'bundle-analyzer.js' // Скрипт анализатора
  ],
  
  // Паттерны замены
  replacements: [
    {
      from: /console\.log\(/g,
      to: 'Logger.debug('
    },
    {
      from: /console\.warn\(/g, 
      to: 'Logger.warn('
    },
    {
      from: /console\.error\(/g,
      to: 'Logger.error('
    }
  ]
};

class ConsoleReplacer {
  constructor() {
    this.processedFiles = 0;
    this.modifiedFiles = 0;
    this.errors = [];
  }

  async run() {
    console.log('🔄 Начинаем замену console.log на Logger...\n');
    
    for (const dir of CONFIG.searchDirs) {
      if (fs.existsSync(dir)) {
        await this.processDirectory(dir);
      }
    }
    
    this.printSummary();
  }

  async processDirectory(dirPath) {
    try {
      const items = fs.readdirSync(dirPath, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item.name);
        
        if (item.isDirectory()) {
          await this.processDirectory(fullPath);
        } else if (item.isFile()) {
          await this.processFile(fullPath);
        }
      }
    } catch (error) {
      this.errors.push(`Ошибка при обработке директории ${dirPath}: ${error.message}`);
    }
  }

  async processFile(filePath) {
    // Проверяем расширение файла
    const ext = path.extname(filePath);
    if (!CONFIG.fileExtensions.includes(ext)) {
      return;
    }
    
    // Проверяем исключения
    const fileName = path.basename(filePath);
    if (CONFIG.excludeFiles.includes(fileName)) {
      return;
    }
    
    this.processedFiles++;
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      let modifiedContent = content;
      let hasChanges = false;
      
      // Применяем замены
      for (const replacement of CONFIG.replacements) {
        const newContent = modifiedContent.replace(replacement.from, replacement.to);
        if (newContent !== modifiedContent) {
          hasChanges = true;
          modifiedContent = newContent;
        }
      }
      
      if (hasChanges) {
        // Проверяем, есть ли уже импорт Logger
        if (!modifiedContent.includes("import { Logger }") && 
            !modifiedContent.includes("from '../utils/logger'") &&
            !modifiedContent.includes("from './logger'")) {
          
          // Добавляем импорт Logger
          const importLine = this.getLoggerImport(filePath);
          if (importLine) {
            modifiedContent = this.addImport(modifiedContent, importLine);
          }
        }
        
        // Сохраняем файл
        fs.writeFileSync(filePath, modifiedContent, 'utf8');
        this.modifiedFiles++;
        
        console.log(`✅ Обновлен: ${filePath}`);
      }
      
    } catch (error) {
      this.errors.push(`Ошибка при обработке файла ${filePath}: ${error.message}`);
    }
  }

  getLoggerImport(filePath) {
    // Определяем относительный путь к logger.ts
    const relativePath = path.relative(path.dirname(filePath), './src/utils');
    const importPath = relativePath.replace(/\\/g, '/'); // Для Windows
    
    return `import { Logger } from '${importPath}/logger';`;
  }

  addImport(content, importLine) {
    // Находим место для вставки импорта (после других импортов)
    const lines = content.split('\n');
    let insertIndex = 0;
    
    // Ищем последний импорт
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ')) {
        insertIndex = i + 1;
      } else if (lines[i].trim() === '' && insertIndex > 0) {
        // Пустая строка после импортов
        break;
      } else if (!lines[i].trim().startsWith('import ') && 
                 !lines[i].trim().startsWith('//') && 
                 lines[i].trim() !== '' && insertIndex > 0) {
        // Начался код, не импорты
        break;
      }
    }
    
    // Вставляем импорт
    lines.splice(insertIndex, 0, importLine);
    return lines.join('\n');
  }

  printSummary() {
    console.log('\n📊 РЕЗУЛЬТАТЫ ЗАМЕНЫ:');
    console.log('='.repeat(50));
    console.log(`📁 Обработано файлов: ${this.processedFiles}`);
    console.log(`✏️  Изменено файлов: ${this.modifiedFiles}`);
    console.log(`❌ Ошибок: ${this.errors.length}`);
    
    if (this.errors.length > 0) {
      console.log('\n❌ ОШИБКИ:');
      this.errors.forEach(error => console.log(`   ${error}`));
    }
    
    console.log('\n✅ Замена console.log на Logger завершена!');
    
    if (this.modifiedFiles > 0) {
      console.log('\n📝 СЛЕДУЮЩИЕ ШАГИ:');
      console.log('1. Проверьте изменения: git diff');
      console.log('2. Протестируйте приложение');
      console.log('3. Зафиксируйте изменения: git add . && git commit -m "Replace console.log with Logger"');
    }
  }
}

// Запускаем скрипт
if (require.main === module) {
  const replacer = new ConsoleReplacer();
  replacer.run().catch(console.error);
}

module.exports = { ConsoleReplacer };