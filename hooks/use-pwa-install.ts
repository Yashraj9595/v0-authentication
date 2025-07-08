'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
    appinstalled: Event;
  }
}

export interface PWAInstallState {
  canInstall: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  showPrompt: boolean;
  installationStatus: 'idle' | 'pending' | 'success' | 'error';
  deferredPrompt: BeforeInstallPromptEvent | null;
}

export interface PWAInstallActions {
  install: () => Promise<boolean>;
  dismissPrompt: () => void;
  resetPrompt: () => void;
  showIOSInstructions: () => void;
}

const STORAGE_KEY = 'pwa-install-dismissed';
const INSTALL_DELAY = 3000; // 3 seconds
const PROMPT_COOLDOWN = 7 * 24 * 60 * 60 * 1000; // 7 days

export function usePWAInstall(): PWAInstallState & PWAInstallActions {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const [installationStatus, setInstallationStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');

  // Detect device and browser
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent.toLowerCase();
      
      // Detect iOS
      const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
      setIsIOS(isIOSDevice);
      
      // Detect Android
      const isAndroidDevice = /android/.test(userAgent);
      setIsAndroid(isAndroidDevice);
      
      // Detect Safari
      const isSafariBrowser = /safari/.test(userAgent) && !/chrome|chromium|crios|firefox|edge|opera/.test(userAgent);
      setIsSafari(isSafariBrowser);
      
      console.log('[PWA] Device detection:', { isIOS: isIOSDevice, isAndroid: isAndroidDevice, isSafari: isSafariBrowser });
    }
  }, []);

  useEffect(() => {
    // Check if app is already installed
    const checkInstallation = () => {
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes('android-app://');
      
      setIsStandalone(isStandaloneMode);
      setIsInstalled(isStandaloneMode);
      
      console.log('[PWA] Standalone mode:', isStandaloneMode);
    };

    checkInstallation();

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      console.log('[PWA] Before install prompt triggered');
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
      
      // Show prompt after delay if not recently dismissed
      const lastDismissed = localStorage.getItem(STORAGE_KEY);
      const shouldShowPrompt = !lastDismissed || 
        (Date.now() - parseInt(lastDismissed, 10)) > PROMPT_COOLDOWN;
      
      if (shouldShowPrompt) {
        setTimeout(() => {
          setShowPrompt(true);
        }, INSTALL_DELAY);
      }
    };

    const handleAppInstalled = () => {
      console.log('[PWA] App installed successfully');
      setDeferredPrompt(null);
      setIsInstalled(true);
      setIsStandalone(true);
      setInstallationStatus('success');
      setShowPrompt(false);
      
      // Track successful installation
      if (typeof window !== 'undefined' && 'gtag' in window) {
        (window as any).gtag('event', 'pwa_installed', {
          event_category: 'engagement',
          event_label: 'pwa_installation_success'
        });
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      console.log('[PWA] Display mode changed:', e.matches ? 'standalone' : 'browser');
      setIsStandalone(e.matches);
      if (e.matches) {
        setIsInstalled(true);
      }
    };
    mediaQuery.addEventListener('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  const install = async () => {
    console.log('[PWA] Install requested, prompt available:', !!deferredPrompt);
    if (!deferredPrompt) return false;

    setInstallationStatus('pending');
    
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('[PWA] User choice:', outcome);
      
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setInstallationStatus('success');
        
        // Track successful installation
        if (typeof window !== 'undefined' && 'gtag' in window) {
          (window as any).gtag('event', 'pwa_installed', {
            event_category: 'engagement',
            event_label: 'user_accepted_installation'
          });
        }
        
        return true;
      } else {
        setInstallationStatus('idle');
        
        // Track installation rejection
        if (typeof window !== 'undefined' && 'gtag' in window) {
          (window as any).gtag('event', 'pwa_install_rejected', {
            event_category: 'engagement',
            event_label: 'user_rejected_installation'
          });
        }
        
        return false;
      }
    } catch (error) {
      console.error("[PWA] Error installing:", error);
      setInstallationStatus('error');
      
      // Track installation error
      if (typeof window !== 'undefined' && 'gtag' in window) {
        (window as any).gtag('event', 'pwa_install_error', {
          event_category: 'error',
          event_label: 'installation_error'
        });
      }
      
      return false;
    }
  };

  const dismissPrompt = (): void => {
    setShowPrompt(false);
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    
    // Track dismissal
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', 'pwa_prompt_dismissed', {
        event_category: 'engagement',
        event_label: 'custom_prompt_dismissed'
      });
    }
  };

  const resetPrompt = (): void => {
    localStorage.removeItem(STORAGE_KEY);
    setShowPrompt(!!deferredPrompt);
  };
  
  const showIOSInstructions = (): void => {
    // Track iOS instructions shown
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', 'ios_install_instructions', {
        event_category: 'engagement',
        event_label: 'ios_installation_help'
      });
    }
    
    // Implementation would typically show a modal with iOS-specific installation instructions
    // This is just a placeholder - you would implement the actual UI elsewhere
    console.log('[PWA] Show iOS installation instructions');
  };

  return {
    canInstall: !!deferredPrompt && !isInstalled && !isStandalone,
    isInstalled,
    isStandalone,
    isIOS,
    isAndroid,
    isSafari,
    showPrompt,
    installationStatus,
    deferredPrompt,
    install,
    dismissPrompt,
    resetPrompt,
    showIOSInstructions,
  };
}