/**
 * Business Setup Wizard — 5-step guided onboarding for new businesses.
 * No JSON, no technical terms. Plain English throughout.
 * Shown once after first login when no rules/tiers are configured.
 */
import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Check, Zap, Star, Users, Code } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { tiersApi, rulesApi, getActiveAppId } from '../lib/api';
import { Button } from '../components/ui/Button';

interface WizardProps {
  onComplete: () => void;
}

interface TierRow { name: string; threshold: number; multiplier: number }
interface RuleTemplate { id: string; icon: string; title: string; description: string; eventType: string; defaultAmount: number; defaultThreshold: number }

const RULE_TEMPLATES: RuleTemplate[] = [
  {
    id: 'purchase_reward',
    icon: '🛒',
    title: 'Reward purchases',
    description: 'Give {amount} {currency} for every purchase over ${threshold}',
    eventType: 'purchase',
    defaultAmount: 100,
    defaultThreshold: 10,
  },
  {
    id: 'referral_reward',
    icon: '👥',
    title: 'Reward referrals',
    description: 'Give {amount} {currency} when a friend signs up and makes their first purchase',
    eventType: 'referral',
    defaultAmount: 50,
    defaultThreshold: 0,
  },
  {
    id: 'loyalty_reward',
    icon: '🔄',
    title: 'Reward loyalty',
    description: 'Give {amount} {currency} to users who come back 3+ times in a month',
    eventType: 'feature_usage',
    defaultAmount: 25,
    defaultThreshold: 3,
  },
];

const DEFAULT_TIERS: TierRow[] = [
  { name: 'Bronze', threshold: 0, multiplier: 1.0 },
  { name: 'Silver', threshold: 500, multiplier: 1.25 },
  { name: 'Gold', threshold: 2000, multiplier: 1.5 },
  { name: 'Platinum', threshold: 10000, multiplier: 2.0 },
];

export default function SetupWizard({ onComplete }: WizardProps) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1 — Currency name
  const [currencyName, setCurrencyName] = useState('Stars');

  // Step 2 — Tiers
  const [tiers, setTiers] = useState<TierRow[]>(DEFAULT_TIERS);

  // Step 3 — Rules
  const [selectedTemplate, setSelectedTemplate] = useState<string>('purchase_reward');
  const [ruleAmount, setRuleAmount] = useState(100);
  const [ruleThreshold, setRuleThreshold] = useState(10);

  const appId = getActiveAppId();
  const template = RULE_TEMPLATES.find((t) => t.id === selectedTemplate)!;

  const inputCls = 'block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-gray-600';

  const handleSaveAndFinish = async () => {
    setSaving(true);
    try {
      // Save tier config
      await tiersApi.update({
        currency_name: currencyName,
        tiers: tiers.map((t) => ({
          name: t.name.toLowerCase(),
          min_points: t.threshold,
          multiplier: t.multiplier,
        })),
      });

      // Save the selected rule
      const t = RULE_TEMPLATES.find((r) => r.id === selectedTemplate)!;
      await rulesApi.create({
        rule_id: t.id,
        name: t.title,
        rule_type: 'threshold',
        trigger_event: t.eventType,
        conditions: {
          operator: 'AND',
          checks: t.eventType === 'purchase'
            ? [{ field: 'metadata.amount', op: '>=', value: ruleThreshold }]
            : [{ field: 'metadata.count', op: '>=', value: 1 }],
        },
        reward: { type: 'points', amount: ruleAmount },
        priority: 10,
      });

      onComplete();
    } catch {
      // Non-fatal — let them proceed anyway
      onComplete();
    } finally {
      setSaving(false);
    }
  };

  const steps = ['Name your rewards', 'Set your tiers', 'Create your first rule', 'Get your code', 'Preview'];

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0f] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <span className="font-['Space_Mono'] text-cyan-400 font-bold text-lg">ChainLoyalty Setup</span>
        <div className="flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < step ? 'bg-cyan-500 text-black' : i === step ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'bg-white/5 text-gray-600'
              }`}>
                {i < step ? <Check size={12} /> : i + 1}
              </div>
              {i < steps.length - 1 && <div className={`w-8 h-px ${i < step ? 'bg-cyan-500/40' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>
        <button onClick={onComplete} className="text-gray-600 hover:text-gray-400 text-sm">Skip setup</button>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 overflow-auto">
        <div className="w-full max-w-2xl">

          {/* Step 0 — Currency name */}
          {step === 0 && (
            <div className="space-y-8 text-center">
              <div>
                <Star size={48} className="text-amber-400 mx-auto mb-4" />
                <h1 className="font-['Space_Mono'] text-white text-3xl font-bold mb-3">What do you want to call your rewards?</h1>
                <p className="text-gray-400">This is what your customers will see when they earn rewards.</p>
              </div>
              <div className="max-w-xs mx-auto">
                <input
                  className={inputCls}
                  value={currencyName}
                  onChange={(e) => setCurrencyName(e.target.value)}
                  placeholder="Stars, Coins, Points, XP..."
                  style={{ textAlign: 'center', fontSize: 20, fontWeight: 700 }}
                />
                <p className="text-gray-600 text-xs mt-2">e.g. "Stars", "Coins", "XP", "Gems"</p>
              </div>
              {/* Live preview */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 max-w-xs mx-auto">
                <p className="text-gray-500 text-xs mb-1">Preview</p>
                <p className="font-['Space_Mono'] text-amber-400 text-2xl font-bold">1,240 {currencyName || '...'}</p>
                <p className="text-gray-500 text-xs">Gold Member</p>
              </div>
            </div>
          )}

          {/* Step 1 — Tiers */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="font-['Space_Mono'] text-white text-2xl font-bold mb-2">Set your loyalty tiers</h1>
                <p className="text-gray-400 text-sm">Customers level up as they earn more {currencyName}. Rename tiers to match your brand.</p>
              </div>
              <div className="space-y-3">
                {tiers.map((tier, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 grid grid-cols-3 gap-3 items-center">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Tier name</label>
                      <input
                        className={inputCls}
                        value={tier.name}
                        onChange={(e) => setTiers(tiers.map((t, j) => j === i ? { ...t, name: e.target.value } : t))}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">{currencyName} needed</label>
                      <input
                        type="number"
                        className={inputCls}
                        value={tier.threshold}
                        disabled={i === 0}
                        onChange={(e) => setTiers(tiers.map((t, j) => j === i ? { ...t, threshold: parseInt(e.target.value) || 0 } : t))}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Bonus multiplier</label>
                      <input
                        type="number"
                        step="0.1"
                        className={inputCls}
                        value={tier.multiplier}
                        onChange={(e) => setTiers(tiers.map((t, j) => j === i ? { ...t, multiplier: parseFloat(e.target.value) || 1 } : t))}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2 — Rules */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <Zap size={40} className="text-cyan-400 mx-auto mb-3" />
                <h1 className="font-['Space_Mono'] text-white text-2xl font-bold mb-2">Create your first rule</h1>
                <p className="text-gray-400 text-sm">Choose how customers earn {currencyName}. You can add more rules later.</p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {RULE_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setSelectedTemplate(t.id); setRuleAmount(t.defaultAmount); setRuleThreshold(t.defaultThreshold); }}
                    className={`text-left p-4 rounded-xl border transition-all ${
                      selectedTemplate === t.id
                        ? 'bg-cyan-500/10 border-cyan-500/40 text-white'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{t.icon}</span>
                      <div>
                        <p className="font-semibold text-sm">{t.title}</p>
                        <p className="text-xs opacity-70 mt-0.5">
                          {t.description.replace('{currency}', currencyName).replace('{amount}', String(ruleAmount)).replace('{threshold}', String(ruleThreshold))}
                        </p>
                      </div>
                      {selectedTemplate === t.id && <Check size={16} className="text-cyan-400 ml-auto" />}
                    </div>
                  </button>
                ))}
              </div>
              {/* Customise selected rule */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">{currencyName} to give</label>
                  <input type="number" className={inputCls} value={ruleAmount} onChange={(e) => setRuleAmount(parseInt(e.target.value) || 0)} min={1} />
                </div>
                {template.eventType === 'purchase' && (
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Minimum purchase ($)</label>
                    <input type="number" className={inputCls} value={ruleThreshold} onChange={(e) => setRuleThreshold(parseInt(e.target.value) || 0)} min={0} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3 — Integration code */}
          {step === 3 && (
            <div className="space-y-6 text-center">
              <Code size={48} className="text-cyan-400 mx-auto" />
              <h1 className="font-['Space_Mono'] text-white text-2xl font-bold">Add one line to your website</h1>
              <p className="text-gray-400">That's it. Your loyalty program is live.</p>
              <div className="bg-slate-900 rounded-xl p-4 text-left">
                <pre className="text-cyan-400 text-xs font-mono overflow-x-auto whitespace-pre-wrap">{`<script
  src="https://cdn.chainloyalty.io/widget.js"
  data-app-id="${appId || 'YOUR_APP_ID'}"
  data-currency="${currencyName}"
></script>`}</pre>
              </div>
              <p className="text-gray-500 text-xs">After a user logs in, call <code className="text-cyan-400">window.ChainLoyalty.setUser('user@email.com')</code> to show their balance.</p>
            </div>
          )}

          {/* Step 4 — Preview */}
          {step === 4 && (
            <div className="space-y-6 text-center">
              <h1 className="font-['Space_Mono'] text-white text-2xl font-bold">Here's what your customers will see</h1>
              <p className="text-gray-400 text-sm">A live preview of your loyalty program.</p>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                {/* Mock top bar */}
                <div className="flex items-center justify-between bg-black/30 rounded-xl px-4 py-2">
                  <span className="text-white text-sm font-bold">Your Website</span>
                  <div className="flex items-center gap-2 bg-[#0d0d14] border border-cyan-500/30 rounded-xl px-3 py-1.5">
                    <span>🥇</span>
                    <span className="text-cyan-400 font-bold text-sm">1,240</span>
                    <span className="text-gray-500 text-xs">{currencyName}</span>
                    <span className="w-px h-4 bg-white/10" />
                    <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center font-bold">JD</span>
                  </div>
                </div>
                {/* Tier info */}
                <div className="text-left space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Gold Member</span>
                    <span className="text-amber-400 font-bold">1,240 {currencyName}</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full w-3/5 bg-gradient-to-r from-cyan-500 to-cyan-300 rounded-full" />
                  </div>
                  <p className="text-gray-500 text-xs">760 more {currencyName} to reach {tiers[3]?.name ?? 'Platinum'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer nav */}
      <div className="flex items-center justify-between px-8 py-5 border-t border-white/10">
        <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
          <ChevronLeft size={16} /> Back
        </Button>
        {step < 4 ? (
          <Button onClick={() => setStep(step + 1)}>
            Continue <ChevronRight size={16} />
          </Button>
        ) : (
          <Button onClick={handleSaveAndFinish} loading={saving}>
            <Check size={16} /> Finish Setup
          </Button>
        )}
      </div>
    </div>
  );
}
