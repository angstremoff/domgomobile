const fs = require('fs');
const path = require('path');

class BundleAnalyzer {
  constructor() {
    this.nodeModulesPath = path.join(process.cwd(), 'node_modules');
    this.results = {
      largestDirectories: [],
      duplicates: [],
      buildArtifacts: [],
      totalSize: 0,
      recommendations: []
    };
  }

  async analyze() {
    console.log('🔍 Анализ размера node_modules...\n');
    
    if (!fs.existsSync(this.nodeModulesPath)) {
      console.log('❌ Директория node_modules не найдена');
      return;
    }

    await this.calculateDirectorySizes();
    await this.findDuplicates();
    await this.findBuildArtifacts();
    this.generateRecommendations();
    
    this.printReport();
  }

  async calculateDirectorySizes() {
    const directories = fs.readdirSync(this.nodeModulesPath);
    const sizes = [];

    for (const dir of directories) {
      const dirPath = path.join(this.nodeModulesPath, dir);
      if (fs.statSync(dirPath).isDirectory()) {
        const size = await this.getDirectorySize(dirPath);
        sizes.push({ name: dir, size, sizeMB: (size / 1024 / 1024).toFixed(2) });
      }
    }

    this.results.largestDirectories = sizes
      .sort((a, b) => b.size - a.size)
      .slice(0, 10);

    this.results.totalSize = sizes.reduce((sum, item) => sum + item.size, 0);
  }

  async getDirectorySize(dirPath) {
    let size = 0;
    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
          size += await this.getDirectorySize(itemPath);
        } else {
          size += stat.size;
        }
      }
    } catch (error) {
      // Пропускаем недоступные директории
    }
    
    return size;
  }

  async findDuplicates() {
    // Поиск дублированных зависимостей через вложенные node_modules
    const duplicates = new Map();
    
    const scanForNestedNodeModules = (currentPath, depth = 0) => {
      if (depth > 3) return; // Ограничиваем глубину поиска
      
      try {
        const items = fs.readdirSync(currentPath);
        
        for (const item of items) {
          if (item === 'node_modules') {
            const nestedPath = path.join(currentPath, item);
            const packages = fs.readdirSync(nestedPath);
            
            packages.forEach(pkg => {
              if (!duplicates.has(pkg)) {
                duplicates.set(pkg, []);
              }
              duplicates.get(pkg).push(nestedPath);
            });
          } else {
            const itemPath = path.join(currentPath, item);
            if (fs.statSync(itemPath).isDirectory()) {
              scanForNestedNodeModules(itemPath, depth + 1);
            }
          }
        }
      } catch (error) {
        // Игнорируем ошибки доступа
      }
    };

    scanForNestedNodeModules(this.nodeModulesPath);
    
    this.results.duplicates = Array.from(duplicates.entries())
      .filter(([pkg, paths]) => paths.length > 1)
      .map(([pkg, paths]) => ({ package: pkg, locations: paths.length }));
  }

  async findBuildArtifacts() {
    const artifacts = [];
    
    // Поиск build директорий и артефактов
    const findArtifacts = async (currentPath, relativePath = '') => {
      try {
        const items = fs.readdirSync(currentPath);
        
        for (const item of items) {
          const itemPath = path.join(currentPath, item);
          const relativeItemPath = path.join(relativePath, item);
          
          if (fs.statSync(itemPath).isDirectory()) {
            // Проверяем на типичные build директории
            if (['build', 'dist', 'lib', 'android', 'ios'].includes(item)) {
              const size = await this.getDirectorySize(itemPath);
              if (size > 1024 * 1024) { // Больше 1MB
                artifacts.push({
                  path: relativeItemPath,
                  size: (size / 1024 / 1024).toFixed(2) + 'MB',
                  type: 'build-directory'
                });
              }
            } else if (items.length < 50) { // Ограничиваем рекурсию
              await findArtifacts(itemPath, relativeItemPath);
            }
          }
        }
      } catch (error) {
        // Игнорируем ошибки доступа
      }
    };

    await findArtifacts(this.nodeModulesPath, 'node_modules');
    this.results.buildArtifacts = artifacts.slice(0, 20); // Топ 20
  }

  generateRecommendations() {
    const recommendations = [];

    // Рекомендации по размеру
    if (this.results.totalSize > 500 * 1024 * 1024) { // > 500MB
      recommendations.push({
        priority: 'ВЫСОКАЯ',
        issue: 'Критически большой размер node_modules',
        action: 'Выполнить npm dedupe и очистку build артефактов',
        expectedSaving: '200-400MB'
      });
    }

    // Рекомендации по дубликатам
    if (this.results.duplicates.length > 10) {
      recommendations.push({
        priority: 'СРЕДНЯЯ',
        issue: `Найдено ${this.results.duplicates.length} дублированных пакетов`,
        action: 'Выполнить npm dedupe для устранения дубликатов',
        expectedSaving: '50-150MB'
      });
    }

    // Рекомендации по build артефактам
    if (this.results.buildArtifacts.length > 5) {
      recommendations.push({
        priority: 'СРЕДНЯЯ',
        issue: 'Найдены build артефакты в node_modules',
        action: 'Очистить build директории из зависимостей',
        expectedSaving: '100-300MB'
      });
    }

    this.results.recommendations = recommendations;
  }

  printReport() {
    console.log('📊 ОТЧЕТ ПО АНАЛИЗУ BUNDLE SIZE\n');
    console.log('='.repeat(50));
    
    console.log(`💾 Общий размер node_modules: ${(this.results.totalSize / 1024 / 1024).toFixed(2)}MB\n`);
    
    console.log('📁 ТОП-10 НАИБОЛЬШИХ ДИРЕКТОРИЙ:');
    this.results.largestDirectories.forEach((dir, index) => {
      console.log(`${index + 1}. ${dir.name}: ${dir.sizeMB}MB`);
    });
    
    console.log('\n🔄 ДУБЛИРОВАННЫЕ ПАКЕТЫ:');
    if (this.results.duplicates.length === 0) {
      console.log('✅ Дубликатов не найдено');
    } else {
      this.results.duplicates.slice(0, 10).forEach(dup => {
        console.log(`📦 ${dup.package}: найдено в ${dup.locations} местах`);
      });
    }
    
    console.log('\n🏗️ BUILD АРТЕФАКТЫ:');
    if (this.results.buildArtifacts.length === 0) {
      console.log('✅ Крупных build артефактов не найдено');
    } else {
      this.results.buildArtifacts.slice(0, 5).forEach(artifact => {
        console.log(`📁 ${artifact.path}: ${artifact.size}`);
      });
    }
    
    console.log('\n💡 РЕКОМЕНДАЦИИ:');
    this.results.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. [${rec.priority}] ${rec.issue}`);
      console.log(`   ✨ Действие: ${rec.action}`);
      console.log(`   💾 Ожидаемая экономия: ${rec.expectedSaving}\n`);
    });

    console.log('🔧 БЕЗОПАСНЫЕ КОМАНДЫ ДЛЯ ОПТИМИЗАЦИИ:');
    console.log('npm dedupe              # Устранить дубликаты');
    console.log('npm prune               # Удалить неиспользуемые пакеты');
    console.log('npx depcheck            # Найти неиспользуемые зависимости');
    console.log('\n⚠️ Все команды безопасны и не затронут исходный код');
  }
}

// Запуск анализа
if (require.main === module) {
  const analyzer = new BundleAnalyzer();
  analyzer.analyze().catch(console.error);
}

module.exports = { BundleAnalyzer };