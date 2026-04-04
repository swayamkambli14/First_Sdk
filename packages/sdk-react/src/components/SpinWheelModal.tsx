import React, { useState, useRef } from 'react';
import { useChainLoyalty } from '../context.js';
import type { SpinPoolEntry } from '@chainloyalty/sdk';

export interface SpinWheelModalProps {
  poolId: string;
  spinCost?: number;
  currencyName?: string;
  currentBalance?: number;
  onSpin?: () => Promise<{ rewardType: string; amount?: number; badgeName?: string }>;
  onClose?: () => void;
}

export function SpinWheelModal({
  poolId,
  spinCost = 100,
  currencyName = 'points',
  currentBalance = 0,
  onSpin,
  onClose,
}: SpinWheelModalProps) {
  const { theme } = useChainLoyalty();
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<{ rewardType: string; amount?: number; badgeName?: string } | null>(null);
  const [showResult, setShowResult] = useState(false);

  const primaryColor = theme.primaryColor ?? '#06b6d4';
  const isDark = theme.mode === 'dark' || (theme.mode !== 'light' && typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  const bg = isDark ? '#0d0d14' : '#ffffff';
  const border = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const text = isDark ? '#ffffff' : '#111827';
  const subtext = isDark ? '#9ca3af' : '#6b7280';

  const canSpin = !spinning && currentBalance >= spinCost;

  const handleSpin = async () => {
    if (!canSpin || !onSpin) return;
    setSpinning(true);

    const extraSpins = 5 + Math.floor(Math.random() * 3);
    const targetAngle = extraSpins * 360 + Math.random() * 360;
    setRotation((prev) => prev + targetAngle);

    try {
      const spinResult = await onSpin();
      setTimeout(() => {
        setResult(spinResult);
        setShowResult(true);
        setSpinning(false);
      }, 4000);
    } catch {
      setSpinning(false);
    }
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 9999, padding: '16px',
  };

  const modalStyle: React.CSSProperties = {
    background: bg, borderRadius: theme.borderRadius ?? '20px',
    border: `1px solid ${border}`, padding: '32px', maxWidth: '360px',
    width: '100%', textAlign: 'center',
    fontFamily: theme.fontFamily ?? 'system-ui, sans-serif', color: text,
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        {showResult && result ? (
          <>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
            <div style={{ fontWeight: 700, fontSize: '20px', marginBottom: '8px' }}>You won!</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: primaryColor, marginBottom: '16px' }}>
              {result.rewardType === 'points'
                ? `+${result.amount} ${currencyName}`
                : `🏅 ${result.badgeName ?? 'Badge'}`}
            </div>
            <button
              onClick={onClose}
              style={{ width: '100%', padding: '12px', background: primaryColor, border: 'none', borderRadius: '10px', color: '#000', fontWeight: 700, cursor: 'pointer' }}
            >
              Awesome!
            </button>
          </>
        ) : (
          <>
            <div style={{ fontWeight: 700, fontSize: '18px', marginBottom: '4px' }}>Spin the Wheel</div>
            <div style={{ fontSize: '12px', color: subtext, marginBottom: '24px' }}>
              Costs {spinCost} {currencyName} · Balance: {currentBalance.toLocaleString()}
            </div>

            {/* Wheel visual */}
            <div style={{ position: 'relative', width: '200px', height: '200px', margin: '0 auto 24px', borderRadius: '50%', border: `4px solid ${border}`, overflow: 'hidden', background: `conic-gradient(${primaryColor} 0deg 45deg, ${primaryColor}60 45deg 90deg, ${primaryColor} 90deg 135deg, ${primaryColor}60 135deg 180deg, ${primaryColor} 180deg 225deg, ${primaryColor}60 225deg 270deg, ${primaryColor} 270deg 315deg, ${primaryColor}60 315deg 360deg)`, transform: `rotate(${rotation}deg)`, transition: spinning ? 'transform 4s cubic-bezier(0.17,0.67,0.12,0.99)' : 'none' }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: bg, border: `2px solid ${border}` }} />
              </div>
            </div>

            <button
              onClick={handleSpin}
              disabled={!canSpin}
              style={{
                width: '100%', padding: '14px', border: 'none', borderRadius: '10px',
                background: canSpin ? primaryColor : border,
                color: canSpin ? '#000' : subtext,
                fontWeight: 700, fontSize: '14px',
                cursor: canSpin ? 'pointer' : 'not-allowed',
              }}
            >
              {spinning ? 'Spinning...' : !canSpin ? `Need ${spinCost} ${currencyName}` : 'SPIN'}
            </button>

            {onClose && (
              <button onClick={onClose} style={{ marginTop: '12px', background: 'none', border: 'none', color: subtext, cursor: 'pointer', fontSize: '13px' }}>
                Cancel
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
