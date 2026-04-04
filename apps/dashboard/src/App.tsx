import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import Shell from './components/layout/Shell';
import LoginPage from './pages/LoginPage';
import OverviewPage from './pages/OverviewPage';
import RuleBuilderPage from './pages/RuleBuilderPage';
import TiersPage from './pages/TiersPage';
import SpinPoolsPage from './pages/SpinPoolsPage';
import UsersPage from './pages/UsersPage';
import AnalyticsPage from './pages/AnalyticsPage';
import BurnDashboard from './pages/BurnDashboard';
import SdkPage from './pages/SdkPage';
import CompanyPage from './pages/CompanyPage';
import SetupWizard from './pages/SetupWizard';
import { rulesApi } from './lib/api';

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { loggedIn } = useAuth();
  if (!loggedIn) return <Navigate to="/login" replace />;
  return <Shell>{children}</Shell>;
}

function AppRoutes() {
  const { loggedIn } = useAuth();
  const [showWizard, setShowWizard] = useState(false);
  const [wizardChecked, setWizardChecked] = useState(false);

  useEffect(() => {
    if (!loggedIn || wizardChecked) return;
    // Show wizard if no rules configured yet
    rulesApi.list()
      .then((res) => {
        const data = res.data as { rules: unknown[] };
        if ((data.rules ?? []).length === 0) setShowWizard(true);
      })
      .catch(() => {})
      .finally(() => setWizardChecked(true));
  }, [loggedIn, wizardChecked]);

  return (
    <>
      {showWizard && <SetupWizard onComplete={() => setShowWizard(false)} />}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedLayout><OverviewPage /></ProtectedLayout>} />
        <Route path="/rules" element={<ProtectedLayout><RuleBuilderPage /></ProtectedLayout>} />
        <Route path="/tiers" element={<ProtectedLayout><TiersPage /></ProtectedLayout>} />
        <Route path="/spin-pools" element={<ProtectedLayout><SpinPoolsPage /></ProtectedLayout>} />
        <Route path="/users" element={<ProtectedLayout><UsersPage /></ProtectedLayout>} />
        <Route path="/analytics" element={<ProtectedLayout><AnalyticsPage /></ProtectedLayout>} />
        <Route path="/burn" element={<ProtectedLayout><BurnDashboard /></ProtectedLayout>} />
        <Route path="/sdk" element={<ProtectedLayout><SdkPage /></ProtectedLayout>} />
        <Route path="/company" element={<ProtectedLayout><CompanyPage /></ProtectedLayout>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
