// after-pack.js
// Скрипт выполняется после упаковки Electron приложения

const fs = require('fs');
const path = require('path');

exports.default = async function (context) {
  const { appOutDir, packager, electronPlatformName } = context;

  console.log(`After pack: ${electronPlatformName}`);
  console.log(`Output directory: ${appOutDir}`);

  if (electronPlatformName === 'win32') {
    // Windows post-pack actions
    try {
      const resourcesPath = path.join(appOutDir, 'resources');
      if (fs.existsSync(resourcesPath)) {
        console.log(`Resources directory exists: ${resourcesPath}`);
      }
    } catch (error) {
      console.error('Error in after-pack:', error);
    }
  }
};
