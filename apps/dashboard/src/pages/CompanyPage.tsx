import React, { useState, useEffect } from 'react';
import { Building2, Mail, Globe, Phone, MapPin, Briefcase, Clock, Save, Plus, ExternalLink } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { companyApi } from '../lib/api';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

interface CompanyProfile {
  company_id: string;
  name: string;
  email: string;
  logo_url?: string;
  website?: string;
  industry?: string;
  description?: string;
  contact_name?: string;
  contact_phone?: string;
  country?: string;
  timezone?: string;
  plan: string;
  plan_expires_at?: string;
  email_verified: boolean;
  created_at: string;
}

interface AppEntry {
  id: string;
  name: string;
  apiKeyPrefix: string;
  webhookUrl?: string;
  isActive: boolean;
  createdAt: string;
  _count: { users: number; events: number };
}

const PLAN_COLOR: Record<string, 'gray' | 'cyan' | 'blue' | 'green'> = {
  free: 'gray', starter: 'cyan', pro: 'blue', enterprise: 'green',
};

export default function CompanyPage() {
  const { companyToken, company: authCompany, setCompanyAuth } = useAuth();
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [apps, setApps] = useState<AppEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Edit state
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');
  const [description, setDescription] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [country, setCountry] = useState('');
  const [timezone, setTimezone] = useState('UTC');

  // New app
  const [showNewApp, setShowNewApp] = useState(false);
  const [newAppName, setNewAppName] = useState('');
  const [newAppWebhook, setNewAppWebhook] = useState('');
  const [creatingApp, setCreatingApp] = useState(false);
  const [newAppResult, setNewAppResult] = useState<{ api_key: string; app_id: string } | null>(null);

  const token = companyToken;

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      companyApi.me(token),
      companyApi.getApps(token),
    ]).then(([meRes, appsRes]) => {
      const p = meRes.data as CompanyProfile;
      setProfile(p);
      setName(p.name ?? '');
      setWebsite(p.website ?? '');
      setIndustry(p.industry ?? '');
      setDescription(p.description ?? '');
      setContactName(p.contact_name ?? '');
      setContactPhone(p.contact_phone ?? '');
      setCountry(p.country ?? '');
      setTimezone(p.timezone ?? 'UTC');
      setApps((appsRes.data as { apps: AppEntry[] }).apps);
    }).catch(() => setError('Failed to load company data'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      await companyApi.updateProfile(token, {
        name, website: website || undefined, industry: industry || undefined,
        description: description || undefined, contact_name: contactName || undefined,
        contact_phone: contactPhone || undefined, country: country || undefined, timezone,
      });
      // Update auth context name
      if (authCompany && token) {
        setCompanyAuth({ ...authCompany, name }, token);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateApp = async () => {
    if (!token || !newAppName.trim()) return;
    setCreatingApp(true);
    try {
      const res = await companyApi.createApp(token, newAppName.trim(), newAppWebhook || undefined);
      const d = res.data as { app_id: string; api_key: string; name: string; created_at: string };
      setNewAppResult({ api_key: d.api_key, app_id: d.app_id });
      // Auto-select this app for business route auth if none selected
      if (!localStorage.getItem('cl_active_app_id')) {
        localStorage.setItem('cl_active_app_id', d.app_id);
      }
      // Refresh apps list
      const appsRes = await companyApi.getApps(token);
      setApps((appsRes.data as { apps: AppEntry[] }).apps);
      setNewAppName('');
      setNewAppWebhook('');
    } catch {
      setError('Failed to create app');
    } finally {
      setCreatingApp(false);
    }
  };

  const inputCls = 'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500';

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-white rounded-xl border border-gray-200 animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 size={24} className="text-cyan-600" />
            Company Profile
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage your company details and apps</p>
        </div>
        {profile && (
          <div className="flex items-center gap-3">
            <Badge color={PLAN_COLOR[profile.plan] ?? 'gray'}>{profile.plan.toUpperCase()} plan</Badge>
            {profile.email_verified && <Badge color="green">Verified</Badge>}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Profile form */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900">Company Details</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1"><Building2 size={13} /> Company Name</label>
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Corp" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1"><Mail size={13} /> Email</label>
              <input className={`${inputCls} bg-gray-50 text-gray-500`} value={profile?.email ?? ''} disabled />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1"><Globe size={13} /> Website</label>
              <input className={inputCls} value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yourcompany.com" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1"><Briefcase size={13} /> Industry</label>
              <input className={inputCls} value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="E-commerce, SaaS, Retail..." />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1"><Phone size={13} /> Contact Name</label>
              <input className={inputCls} value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="John Doe" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1"><Phone size={13} /> Contact Phone</label>
              <input className={inputCls} value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+1 555 000 0000" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1"><MapPin size={13} /> Country</label>
              <input className={inputCls} value={country} onChange={(e) => setCountry(e.target.value)} placeholder="United States" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1"><Clock size={13} /> Timezone</label>
              <select className={inputCls} value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                {['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Kolkata', 'Asia/Tokyo', 'Australia/Sydney'].map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Description</label>
              <textarea
                className={`${inputCls} resize-none`}
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of your company and loyalty program..."
              />
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={handleSave} loading={saving}>
              <Save size={14} /> {saved ? 'Saved!' : 'Save Changes'}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Apps */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Your Apps ({apps.length})</h3>
            <Button variant="secondary" size="sm" onClick={() => setShowNewApp(!showNewApp)}>
              <Plus size={14} /> New App
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          {showNewApp && (
            <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Create New App</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input className={inputCls} placeholder="App name" value={newAppName} onChange={(e) => setNewAppName(e.target.value)} />
                <input className={inputCls} placeholder="Webhook URL (optional)" value={newAppWebhook} onChange={(e) => setNewAppWebhook(e.target.value)} />
              </div>
              <Button size="sm" loading={creatingApp} onClick={handleCreateApp}>Create App</Button>

              {newAppResult && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs font-medium text-amber-800 mb-2">Save these — the API key is shown only once!</p>
                  <div className="space-y-1">
                    <p className="text-xs font-mono text-gray-700"><span className="text-gray-500">App ID: </span>{newAppResult.app_id}</p>
                    <p className="text-xs font-mono text-gray-700 break-all"><span className="text-gray-500">API Key: </span>{newAppResult.api_key}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {apps.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No apps yet. Create one above to get started.</p>
          ) : (
            <div className="space-y-3">
              {apps.map((app) => {
                const isSelected = localStorage.getItem('cl_active_app_id') === app.id;
                return (
                  <div key={app.id} className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${isSelected ? 'bg-cyan-50 border-cyan-200' : 'bg-gray-50 border-gray-100'}`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 text-sm">{app.name}</p>
                        <Badge color={app.isActive ? 'green' : 'gray'}>{app.isActive ? 'Active' : 'Inactive'}</Badge>
                        {isSelected && <Badge color="cyan">Selected</Badge>}
                      </div>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{app.id}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {app._count.users.toLocaleString()} users · {app._count.events.toLocaleString()} events
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-xs text-gray-400 font-mono">Key prefix: {app.apiKeyPrefix}...</p>
                      <p className="text-xs text-gray-400">{new Date(app.createdAt).toLocaleDateString()}</p>
                      {!isSelected && (
                        <button
                          onClick={() => { localStorage.setItem('cl_active_app_id', app.id); window.location.reload(); }}
                          className="text-xs text-cyan-600 hover:text-cyan-500 font-medium"
                        >
                          Use this app →
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Account info */}
      {profile && (
        <Card>
          <CardHeader><h3 className="font-semibold text-gray-900">Account Info</h3></CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500 text-xs">Company ID</p>
                <p className="font-mono text-gray-700 text-xs break-all">{profile.company_id}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Plan</p>
                <p className="font-medium text-gray-900 capitalize">{profile.plan}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Member Since</p>
                <p className="text-gray-700">{new Date(profile.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Email Status</p>
                <p className={profile.email_verified ? 'text-green-600' : 'text-amber-600'}>
                  {profile.email_verified ? 'Verified' : 'Unverified'}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
