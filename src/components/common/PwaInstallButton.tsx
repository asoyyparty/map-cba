import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Share2, PlusSquare } from 'lucide-react';

export const PwaInstallButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // Check if already running standalone
    const isStandaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    // Check iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else if (isIos) {
      setShowIosGuide(true);
    }
  };

  // Don't show if already installed in standalone mode
  if (isStandalone) {
    return null;
  }

  // Show if either browser gave us install prompt OR on iOS mobile
  if (!deferredPrompt && !isIos) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all cursor-pointer shrink-0 animate-pulse hover:animate-none"
        title="Tambahkan CBA Network Map ke Layar Utama (Add to Home Screen)"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Add to Home Screen</span>
        <span className="sm:hidden">Install</span>
      </button>

      {/* iOS Instructions Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl relative text-slate-800 dark:text-slate-100">
            <button
              onClick={() => setShowIosGuide(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 shrink-0">
                <img src="/logo-96.png?v=3" alt="Network Map Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Tambahkan ke Layar Utama</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">CBA Network Map PWA</p>
              </div>
            </div>

            <ol className="text-xs text-slate-600 dark:text-slate-300 space-y-2.5 list-decimal list-inside bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <li className="leading-relaxed">
                Ketuk tombol <strong className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-cyan-400"><Share2 className="w-3.5 h-3.5 inline" /> Bagikan (Share)</strong> di bar browser Safari.
              </li>
              <li className="leading-relaxed">
                Gulir ke bawah dan pilih <strong className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-cyan-400"><PlusSquare className="w-3.5 h-3.5 inline" /> Tambahkan ke Layar Utama (Add to Home Screen)</strong>.
              </li>
              <li className="leading-relaxed">
                Ketuk <strong>Tambah</strong> di pojok kanan atas.
              </li>
            </ol>

            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
};
