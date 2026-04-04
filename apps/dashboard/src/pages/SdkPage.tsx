import React, { useState } from 'react';
import { Copy, Check, Key, Hash } from 'lucide-react';
import { getApiKey, getAppId } from '../lib/api';
import { Card, CardHeader, CardBody } from '../components/ui/Card';

function CodeBlock({ code, lang = 'bash' }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    void navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group">
      <pre className={`language-${lang} bg-slate-900 text-slate-100 rounded-xl p-4 text-xs overflow-x-auto font-mono leading-relaxed`}>
        {code}
      </pre>
      <button
        onClick={copy}
        className="absolute top-3 right-3 flex items-center gap-1 text-xs text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded transition-all"
      >
        {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
      </button>
    </div>
  );
}

export default function SdkPage() {
  const apiKey = getApiKey() || 'YOUR_API_KEY';
  const appId = getAppId() || 'YOUR_APP_ID';

  const installCode = `npm install axios`;

  const trackEventCode = `// Track a user event
const response = await fetch('http://localhost:3000/v1/events', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ${apiKey}',
  },
  body: JSON.stringify({
    wallet_address: '0xUSER_WALLET_ADDRESS',
    event_type: 'purchase',
    metadata: {
      amount: 99.99,
      product_id: 'prod_123',
    },
  }),
});

const data = await response.json();
// { event_id: '...', status: 'queued' }`;

  const getUserCode = `// Get user profile & points
const res = await fetch(
  'http://localhost:3000/v1/users/0xUSER_WALLET/profile',
  { headers: { 'x-app-id': '${appId}' }, credentials: 'include' }
);
const user = await res.json();
// { walletAddress, tier, currentPointsBalance, totalPointsEarned, referralCode }`;

  const leaderboardCode = `// Get leaderboard
const res = await fetch(
  'http://localhost:3000/v1/leaderboard?app_id=${appId}&period=all_time&limit=10',
  { headers: { 'x-app-id': '${appId}' } }
);
const { leaderboard } = await res.json();`;

  const webhookCode = `// Verify incoming webhook signature
import crypto from 'crypto';

function verifyWebhook(body: string, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

// In your webhook handler:
app.post('/webhook/chainloyalty', (req, res) => {
  const sig = req.headers['x-chainloyalty-signature'] as string;
  const isValid = verifyWebhook(JSON.stringify(req.body), sig, process.env.WEBHOOK_SECRET!);
  if (!isValid) return res.status(401).send('Invalid signature');

  const { event_type, wallet_address, rewards_issued } = req.body;
  // Handle the event...
  res.sendStatus(200);
});`;

  const siweCode = `// SIWE Authentication flow
// 1. Get nonce
const nonceRes = await fetch('/v1/auth/nonce', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-app-id': '${appId}' },
  body: JSON.stringify({ wallet_address: userWallet }),
});
const { message } = await nonceRes.json();

// 2. Sign with wallet (wagmi example)
const signature = await signMessageAsync({ message });

// 3. Verify — sets httpOnly JWT cookie
await fetch('/v1/auth/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-app-id': '${appId}' },
  credentials: 'include',
  body: JSON.stringify({ wallet_address: userWallet, signature }),
});`;

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">SDK & Integration Guide</h1>
        <p className="text-gray-500 text-sm mt-1">Everything you need to integrate ChainLoyalty into your app</p>
      </div>

      {/* Credentials */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900">Your Credentials</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">API Key</p>
              <code className="block bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono text-gray-700 break-all">
                {apiKey}
              </code>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">App ID</p>
              <code className="block bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono text-gray-700 break-all">
                {appId}
              </code>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Quick start */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Quick Start</h2>
        <CodeBlock code={installCode} lang="bash" />
      </div>

      {/* Auth */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">1. Authenticate Users (SIWE)</h2>
        <p className="text-sm text-gray-500">Users sign in with their Ethereum wallet. No passwords, no email.</p>
        <CodeBlock code={siweCode} lang="typescript" />
      </div>

      {/* Track events */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">2. Track Events</h2>
        <p className="text-sm text-gray-500">Send events from your backend using your API key. Events are processed asynchronously.</p>
        <CodeBlock code={trackEventCode} lang="typescript" />
      </div>

      {/* Get user */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">3. Read User Data</h2>
        <CodeBlock code={getUserCode} lang="typescript" />
      </div>

      {/* Leaderboard */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">4. Leaderboard</h2>
        <CodeBlock code={leaderboardCode} lang="typescript" />
      </div>

      {/* Webhooks */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">5. Webhooks</h2>
        <p className="text-sm text-gray-500">
          Configure a webhook URL in your app settings. ChainLoyalty will POST signed events to your endpoint whenever rewards are issued.
        </p>
        <CodeBlock code={webhookCode} lang="typescript" />
      </div>

      {/* Event types */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900">Supported Event Types</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {['purchase', 'referral', 'feature_usage', 'milestone', 'subscription', 'custom'].map((e) => (
              <code key={e} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono text-gray-700">
                {e}
              </code>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
