import { useEffect, useState } from 'react';
import { Key } from 'lucide-react';

interface AurumToastProps {
  message: string;
  subtitle?: string;
  progress?: number; // 0-100
  onDismiss: () => void;
}

export function AurumToast({ message, subtitle, progress, onDismiss }: AurumToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Slide in
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 400);
    }, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className={`fixed top-20 right-4 z-[9999] w-80 transition-all duration-400 ${
        visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
      }`}
    >
      <div className="bg-aurum-midnight border border-aurum-gold/40 rounded-xl p-4 shadow-gold">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-aurum-gold/20 flex items-center justify-center flex-shrink-0">
            <Key size={14} className="text-aurum-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-aurum-gold font-semibold tracking-wide uppercase mb-0.5">Aurum Circle</p>
            <p className="text-aurum-ivory text-sm font-medium">{message}</p>
            {subtitle && <p className="text-aurum-ivory/50 text-xs mt-0.5">{subtitle}</p>}
            {progress !== undefined && (
              <div className="mt-2">
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-aurum-gold rounded-full transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          <button onClick={() => { setVisible(false); setTimeout(onDismiss, 400); }} className="text-aurum-ivory/30 hover:text-aurum-ivory/70 text-lg leading-none">×</button>
        </div>
      </div>
    </div>
  );
}

// Toast manager hook
import { useCallback } from 'react';

interface ToastState {
  id: number;
  message: string;
  subtitle?: string;
  progress?: number;
}

let toastId = 0;

export function useAurumToast() {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const showToast = useCallback((message: string, subtitle?: string, progress?: number) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, subtitle, progress }]);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const ToastContainer = () => (
    <>
      {toasts.map((t) => (
        <AurumToast
          key={t.id}
          message={t.message}
          subtitle={t.subtitle}
          progress={t.progress}
          onDismiss={() => dismissToast(t.id)}
        />
      ))}
    </>
  );

  return { showToast, ToastContainer };
}
