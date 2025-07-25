
// Language detection helper
function getReportLanguage() {
  const browserLang = navigator.language || navigator.userLanguage;
  const lang = browserLang.toLowerCase().substring(0, 2);
  
  // Map browser languages to our supported languages
  const supportedLangs = {
    'en': 'en',
    'es': 'es',
    'pt': 'pt',
    'ca': 'es', // Catalan -> Spanish
    'gl': 'es', // Galician -> Spanish
    'eu': 'es', // Basque -> Spanish
  };
  
  return supportedLangs[lang] || 'en'; // Default to English
}

// Usage in report generator:
// const language = getReportLanguage();
// const templatePath = `daily-report-template-${language}.html`;
