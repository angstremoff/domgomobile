import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

/**
 * Функция для сжатия изображений перед загрузкой в Supabase
 * Работает аналогично веб-версии, но использует нативные возможности
 * 
 * @param uri - URI изображения для сжатия
 * @param maxSizeMB - Целевой размер в МБ (по умолчанию 0.4 МБ = 400 КБ)
 * @returns Объект с URI сжатого изображения
 */
export async function compressImage(uri: string, maxSizeMB: number = 0.4): Promise<{ uri: string }> {
  try {
    console.log('Начинаем сжатие изображения:', uri);
    
    if (!uri) {
      console.error('Пустой URI изображения');
      throw new Error('Пустой URI изображения');
    }
    
    // Начинаем с качества 0.7 (70%)
    let quality = 0.7;
    
    // Если размер очень большой, уменьшаем качество
    if (maxSizeMB < 0.3) {
      quality = 0.5;
    }
    
    try {
      let compressed = await manipulateAsync(
        uri,
        [{ resize: { width: 1280 } }], // Максимальная ширина 1280px
        { compress: quality, format: SaveFormat.JPEG }
      );
      
      console.log('Сжатие выполнено успешно');
      console.log('Исходный URI:', uri);
      console.log('Сжатый URI:', compressed.uri);
      console.log('Использовано качество:', quality);
      
      return { uri: compressed.uri };
    } catch (manipulateError) {
      console.error('Ошибка при манипуляции с изображением:', manipulateError);
      // Пробуем с меньшим качеством, если первая попытка не удалась
      try {
        let compressed = await manipulateAsync(
          uri,
          [{ resize: { width: 800 } }], // Уменьшаем размер еще больше
          { compress: 0.4, format: SaveFormat.JPEG }
        );
        
        console.log('Сжатие выполнено успешно со вторым набором параметров');
        return { uri: compressed.uri };
      } catch (secondError) {
        console.error('Вторая попытка сжатия также не удалась:', secondError);
        // В случае ошибки возвращаем исходное изображение
        return { uri };
      }
    }
  } catch (error) {
    console.error('Ошибка при сжатии изображения:', error);
    // В случае ошибки возвращаем исходное изображение
    return { uri };
  }
}
