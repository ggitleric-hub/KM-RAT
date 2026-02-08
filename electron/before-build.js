// before-build.js
// Скрипт выполняется перед сборкой Electron приложения

const { spawn } = require('child_process');
const path = require('path');

exports.default = async function (context) {
  const { electronPlatformName, packager } = context;

  console.log(`Before build: ${electronPlatformName}`);

  if (electronPlatformName === 'win32') {
    // Windows pre-build actions
    // Проверяем что Next.js приложение собрано
    const outPath = path.join(process.cwd(), 'out');
    const fs = require('fs');

    if (!fs.existsSync(outPath)) {
      console.log('Next.js output directory not found. Building...');
      // Сборка Next.js будет выполнена через npm script
    } else {
      console.log('Next.js output directory found.');
    }
  }
};
