module.exports = function(api) {
  api.cache(true);
  
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module:react-native-dotenv', {
        moduleName: '@env',
        path: '.env',
        blacklist: null,
        whitelist: null,
        safe: false,
        allowUndefined: true
      }],
      // Удаляем console.log в production для улучшения производительности
      isProduction && ['babel-plugin-transform-remove-console', {
        exclude: ['error', 'warn', 'info'] // Оставляем важные логи
      }]
    ].filter(Boolean)
  };
};
