import { useEffect, useState, useCallback } from 'react';

export function useElectron() {
  const [isElectron, setIsElectron] = useState(false);
  const [platform, setPlatform] = useState<string>('');
  const [version, setVersion] = useState<string>('');
  const [isDev, setIsDev] = useState(false);

  useEffect(() => {
    // Проверяем, запущено ли приложение в Electron
    const checkElectron = () => {
      if (typeof window !== 'undefined' && 'electronAPI' in window) {
        const electronAPI = (window as unknown as { electronAPI: { platform: string; isDev: () => boolean; getVersion: () => string } }).electronAPI;
        setIsElectron(true);
        setPlatform(electronAPI.platform || '');
        setIsDev(electronAPI.isDev?.() || false);
        setVersion(electronAPI.getVersion?.() || '');
      } else {
        setIsElectron(false);
        setPlatform(process.platform || 'unknown');
        setIsDev(process.env.NODE_ENV === 'development');
        setVersion('');
      }
    };

    checkElectron();
  }, []);

  const minimizeWindow = useCallback(() => {
    if (isElectron && 'electronAPI' in window) {
      (window as unknown as { electronAPI: { minimizeWindow: () => void } }).electronAPI.minimizeWindow();
    }
  }, [isElectron]);

  const maximizeWindow = useCallback(() => {
    if (isElectron && 'electronAPI' in window) {
      (window as unknown as { electronAPI: { maximizeWindow: () => void } }).electronAPI.maximizeWindow();
    }
  }, [isElectron]);

  const closeWindow = useCallback(() => {
    if (isElectron && 'electronAPI' in window) {
      (window as unknown as { electronAPI: { closeWindow: () => void } }).electronAPI.closeWindow();
    }
  }, [isElectron]);

  const openExternal = useCallback((url: string) => {
    if (isElectron && 'electronAPI' in window) {
      (window as unknown as { electronAPI: { openExternal: (url: string) => void } }).electronAPI.openExternal(url);
    } else {
      window.open(url, '_blank');
    }
  }, [isElectron]);

  const showNotification = useCallback((title: string, body: string) => {
    if (isElectron && 'electronAPI' in window) {
      (window as unknown as { electronAPI: { showNotification: (title: string, body: string) => void } }).electronAPI.showNotification(title, body);
    } else {
      new Notification(title, { body });
    }
  }, [isElectron]);

  return {
    isElectron,
    platform,
    version,
    isDev,
    minimizeWindow,
    maximizeWindow,
    closeWindow,
    openExternal,
    showNotification,
  };
}

export default useElectron;
