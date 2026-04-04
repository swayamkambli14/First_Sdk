/**
 * ChainLoyalty Embed Widget
 * Compiled to a single widget.js bundle for script-tag integration.
 *
 * Usage:
 *   <script src="https://cdn.chainloyalty.io/widget.js"
 *     data-app-id="your-app-uuid"
 *     data-user-id="user@email.com"
 *     data-theme="dark"
 *     data-position="top-right"
 *     data-currency="Stars">
 *   </script>
 *
 * Global API:
 *   window.ChainLoyalty.setUser('user@email.com')
 *   window.ChainLoyalty.refresh()
 *   window.ChainLoyalty.showDashboard()
 *   window.ChainLoyalty.onReward(callback)
 */

interface WidgetConfig {
  appId: string;
  userId?: string;
  apiKey?: string;
  apiBaseUrl?: string;
  theme?: 'light' | 'dark';
  position?: 'top-right' | 'inline';
  currency?: string;
}

interface Summary {
  displayName: string;
  tier: string;
  tierDisplayName: string;
  balance: number;
  currencyName: string;
  nextTierName: string | null;
  pointsToNextTier: number;
  nextTierProgress: number;
  badgeCount: number;
  recentRewards: Array<{ id: string; description: string; issuedAt: string }>;
}

type RewardCallback = (reward: { type: string; amount?: number; description: string }) => void;

const TIER_ICONS: Record<string, string> = {
  bronze: '🥉', silver: '🥈', gold: '🥇', platinum: '💎',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

class ChainLoyaltyWidgetInstance {
  private config: WidgetConfig;
  private container: HTMLDivElement;
  private summary: Summary | null = null;
  private open = false;
  private refreshInterval: ReturnType<typeof setInterval> | null = null;
  private rewardCallbacks: RewardCallback[] = [];

  constructor(config: WidgetConfig) {
    this.config = config;
    this.container = document.createElement('div');
    this.container.id = 'chainloyalty-widget-root';

    if (config.position !== 'inline') {
      this.container.style.cssText = 'position:fixed;top:12px;right:16px;z-index:99999;font-family:system-ui,-apple-system,sans-serif';
    }

    document.body.appendChild(this.container);

    if (config.userId) {
      void this.fetchAndRender();
      this.refreshInterval = setInterval(() => void this.fetchAndRender(), 30_000);
    }

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target as Node)) {
        this.open = false;
        this.render();
      }
    });
  }

  private get isDark(): boolean {
    return this.config.theme !== 'light';
  }

  private get bg(): string { return this.isDark ? '#0d0d14' : '#ffffff'; }
  private get text(): string { return this.isDark ? '#ffffff' : '#111827'; }
  private get accent(): string { return '#06b6d4'; }
  private get border(): string { return this.isDark ? 'rgba(6,182,212,0.2)' : 'rgba(6,182,212,0.3)'; }

  async fetchAndRender(): Promise<void> {
    if (!this.config.userId || !this.config.appId) return;
    try {
      const headers: Record<string, string> = { 'x-app-id': this.config.appId };
      if (this.config.apiKey) headers['Authorization'] = `Bearer ${this.config.apiKey}`;

      const base = this.config.apiBaseUrl ?? 'http://localhost:3000';
      const res = await fetch(`${base}/v1/users/${encodeURIComponent(this.config.userId)}/summary`, { headers });
      if (!res.ok) return;
      const prev = this.summary?.balance;
      this.summary = await res.json() as Summary;

      // Override currency name if provided via data attribute
      if (this.config.currency) this.summary.currencyName = this.config.currency;

      // Trigger reward callbacks if balance increased
      if (prev !== undefined && this.summary.balance > prev) {
        const diff = this.summary.balance - prev;
        this.rewardCallbacks.forEach((cb) => cb({
          type: 'points',
          amount: diff,
          description: `You earned ${diff} ${this.summary!.currencyName}`,
        }));
      }
    } catch { /* silent */ }
    this.render();
  }

  render(): void {
    if (!this.summary) { this.container.innerHTML = ''; return; }

    const s = this.summary;
    const tierIcon = TIER_ICONS[s.tier] ?? '⭐';
    const initials = s.displayName.slice(0, 2).toUpperCase();

    this.container.innerHTML = `
      <div style="position:relative">
        <button id="cl-toggle" style="
          display:flex;align-items:center;gap:8px;
          background:${this.bg};color:${this.text};
          border:1px solid ${this.border};border-radius:12px;
          padding:6px 12px;cursor:pointer;font-size:13px;font-weight:600;height:40px;
          box-shadow:0 0 12px rgba(6,182,212,0.15);transition:all 0.2s;
        ">
          <span style="font-size:16px">${tierIcon}</span>
          <span style="color:${this.accent};font-weight:700">${s.balance.toLocaleString()}</span>
          <span style="color:${this.text}99;font-size:12px">${s.currencyName}</span>
          <span style="width:1px;height:16px;background:${this.text}22;margin:0 4px"></span>
          <span style="
            width:26px;height:26px;border-radius:50%;
            background:${this.accent}22;color:${this.accent};
            display:flex;align-items:center;justify-content:center;
            font-size:11px;font-weight:700;
          ">${initials}</span>
        </button>

        ${this.open ? `
        <div id="cl-panel" style="
          position:absolute;top:48px;right:0;width:320px;
          background:${this.bg};border:1px solid ${this.border};
          border-radius:12px;box-shadow:0 16px 40px rgba(0,0,0,0.5);
          overflow:hidden;z-index:100000;
          animation:cl-slide-down 0.15s ease-out;
        ">
          <div style="padding:16px 16px 12px;border-bottom:1px solid ${this.text}11">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px">
              <span style="color:${this.text};font-weight:700;font-size:14px">${tierIcon} ${s.tierDisplayName}</span>
              <span style="color:${this.accent};font-weight:700;font-size:14px">${s.balance.toLocaleString()} ${s.currencyName}</span>
            </div>
            ${s.nextTierName ? `
              <div style="height:6px;background:${this.text}15;border-radius:3px;overflow:hidden">
                <div style="height:100%;width:${s.nextTierProgress}%;background:linear-gradient(90deg,${this.accent},${this.accent}cc);border-radius:3px"></div>
              </div>
              <p style="color:${this.text}66;font-size:11px;margin:6px 0 0">${s.pointsToNextTier.toLocaleString()} more ${s.currencyName} to reach ${s.nextTierName}</p>
            ` : ''}
          </div>

          ${s.recentRewards.length > 0 ? `
          <div style="padding:12px 16px;border-bottom:1px solid ${this.text}11">
            <p style="color:${this.text}55;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px">Recent</p>
            ${s.recentRewards.map((r) => `
              <div style="display:flex;justify-content:space-between;margin-bottom:8px">
                <span style="color:${this.text};font-size:12px;flex:1;line-height:1.4">${r.description}</span>
                <span style="color:${this.text}44;font-size:11px;margin-left:8px;flex-shrink:0">${timeAgo(r.issuedAt)}</span>
              </div>
            `).join('')}
          </div>
          ` : ''}

          <div style="padding:12px 16px;display:flex;gap:8px">
            <button id="cl-view-all" style="
              flex:1;padding:8px 0;background:${this.accent}22;
              color:${this.accent};border:1px solid ${this.accent}44;
              border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;
            ">View All Rewards</button>
            <button id="cl-invite" style="
              flex:1;padding:8px 0;background:transparent;
              color:${this.text}88;border:1px solid ${this.text}22;
              border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;
            ">Invite Friends</button>
          </div>
        </div>
        ` : ''}
      </div>
      <style>
        @keyframes cl-slide-down {
          from { opacity:0;transform:translateY(-8px); }
          to   { opacity:1;transform:translateY(0); }
        }
      </style>
    `;

    document.getElementById('cl-toggle')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.open = !this.open;
      this.render();
    });

    document.getElementById('cl-view-all')?.addEventListener('click', () => {
      this.open = false;
      this.render();
      window.dispatchEvent(new CustomEvent('chainloyalty:show-dashboard'));
    });
  }

  // Public API methods
  setUser(userId: string): void {
    this.config.userId = userId;
    void this.fetchAndRender();
  }

  refresh(): void {
    void this.fetchAndRender();
  }

  showDashboard(): void {
    window.dispatchEvent(new CustomEvent('chainloyalty:show-dashboard'));
  }

  onReward(callback: RewardCallback): void {
    this.rewardCallbacks.push(callback);
  }

  destroy(): void {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    this.container.remove();
  }
}

// Auto-initialize from script tag attributes
(function () {
  const script = document.currentScript as HTMLScriptElement | null;
  if (!script) return;

  const config: WidgetConfig = {
    appId: script.getAttribute('data-app-id') ?? '',
    userId: script.getAttribute('data-user-id') ?? undefined,
    apiKey: script.getAttribute('data-api-key') ?? undefined,
    apiBaseUrl: script.getAttribute('data-api-base-url') ?? undefined,
    theme: (script.getAttribute('data-theme') as 'light' | 'dark') ?? 'dark',
    position: (script.getAttribute('data-position') as 'top-right' | 'inline') ?? 'top-right',
    currency: script.getAttribute('data-currency') ?? undefined,
  };

  if (!config.appId) {
    console.warn('[ChainLoyalty] data-app-id is required');
    return;
  }

  const instance = new ChainLoyaltyWidgetInstance(config);

  // Expose global API
  (window as unknown as Record<string, unknown>)['ChainLoyalty'] = {
    setUser: (userId: string) => instance.setUser(userId),
    refresh: () => instance.refresh(),
    showDashboard: () => instance.showDashboard(),
    onReward: (cb: RewardCallback) => instance.onReward(cb),
  };
})();
