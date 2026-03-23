'use client';

import { useState, useEffect, useCallback } from 'react';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 1. Detectar si ya está instalada (standalone)
    if (typeof window !== 'undefined') {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
      }

      // 1.5. Verificar si el evento fue capturado globalmente antes de que el hook monte
      if ((window as any).deferredPWAInstallPrompt) {
        setDeferredPrompt((window as any).deferredPWAInstallPrompt);
        console.log('PWA: Recuperado evento previo de window.');
      }
    }

    // 2. Capturar el evento de instalación (por si ocurre después de montar)
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevenir el banner automático del navegador
      e.preventDefault();
      // Guardar el evento para dispararlo luego
      setDeferredPrompt(e);
      // También guardar en window para consistencia
      (window as any).deferredPWAInstallPrompt = e;
      console.log('PWA: beforeinstallprompt capturado en el hook.');
    };

    // 3. Detectar cuando se completa la instalación
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      (window as any).deferredPWAInstallPrompt = null;
      setIsInstalled(true);
      console.log('PWA: Instalación completada con éxito.');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) {
      console.warn('PWA: No hay un evento de instalación guardado.');
      return false;
    }

    // Mostrar el prompt nativo
    deferredPrompt.prompt();

    // Esperar la respuesta del usuario
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA: El usuario respondió al instalador: ${outcome}`);

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      return true;
    }

    return false;
  }, [deferredPrompt]);

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    handleInstall,
    deferredPrompt
  };
}
