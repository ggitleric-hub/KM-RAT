const { contextBridge, ipcRenderer, shell } = require('electron');

// Безопасный мост между Node.js и React renderer процессом
contextBridge.exposeInMainWorld('electronAPI', {
  // Платформа
  platform: process.platform,

  // Уведомления
  showNotification: (title, body) => {
    const notification = new Notification(title, {
      body,
      icon: '/icon.ico',
      urgency: 'normal',
    });
    notification.show();
  },

  // Работа с файлами
  openExternal: (url) => shell.openExternal(url),

  // Окно
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  restoreWindow: () => ipcRenderer.send('window-restore'),

  // Проверка режима
  isDev: () => process.env.NODE_ENV === 'development' || !require('electron').app.isPackaged,

  // Получение версии приложения
  getVersion: () => require('electron').app.getVersion(),

  // Патч для WebSocket (исправление проблем с websockets в Electron)
  patchWebSocket: () => {
    // WebSocket уже работает в современных версиях Electron
    // Но если нужны дополнительные настройки - они здесь
  },

  // Тема
  getTheme: () => {
    // Electron не имеет встроенного API для системной темы в renderer
    // Можно использовать nativeTheme из main процесса через ipc
    return 'light';
  },

  // Диалоги
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
});

// Экспорт для совместимости
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer,
  shell,
  app: {
    getVersion: () => require('electron').app.getVersion(),
    isPackaged: require('electron').app.isPackaged,
  },
  platform: process.platform,
});
