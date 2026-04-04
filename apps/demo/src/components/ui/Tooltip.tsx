/**
 * InfoTooltip — the ⓘ tooltip system for non-tech users.
 * Hover or tap to see a plain-English explanation.
 */
import { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function InfoTooltip({ text, position = 'top' }: InfoTooltipProps) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click (mobile)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setVisible(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const positionCls = {
    top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left:   'right-full top-1/2 -translate-y-1/2 mr-2',
    right:  'left-full top-1/2 -translate-y-1/2 ml-2',
  }[position];

  return (
    <div ref={ref} className="relative inline-flex items-center">
      <button
        type="button"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onClick={() => setVisible(!visible)}
        className="text-gray-500 hover:text-cyan-400 transition-colors ml-1 flex-shrink-0"
        aria-label="More information"
      >
        <Info size={13} />
      </button>
      {visible && (
        <div className={`absolute ${positionCls} z-50 w-56 bg-[#1a1a2e] border border-white/20 rounded-xl px-3 py-2.5 text-xs text-gray-300 font-['DM_Sans'] leading-relaxed shadow-2xl pointer-events-none`}>
          {text}
          <div className={`absolute w-2 h-2 bg-[#1a1a2e] border-white/20 rotate-45 ${
            position === 'top' ? 'bottom-[-5px] left-1/2 -translate-x-1/2 border-b border-r' :
            position === 'bottom' ? 'top-[-5px] left-1/2 -translate-x-1/2 border-t border-l' :
            position === 'left' ? 'right-[-5px] top-1/2 -translate-y-1/2 border-t border-r' :
            'left-[-5px] top-1/2 -translate-y-1/2 border-b border-l'
          }`} />
        </div>
      )}
    </div>
  );
}
