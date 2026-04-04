import React from 'react';
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
import SdkPage from './pages/SdkPage';

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { loggedIn } = useAuth();
  if (!loggedIn) return <Navigate to="/login" replace />;
  return <Shell>{children}</Shell>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedLayout><OverviewPage /></ProtectedLayout>} />
          <Route path="/rules" element={<ProtectedLayout><RuleBuilderPage /></ProtectedLayout>} />
          <Route path="/tiers" element={<ProtectedLayout><TiersPage /></ProtectedLayout>} />
          <Route path="/spin-pools" element={<ProtectedLayout><SpinPoolsPage /></ProtectedLayout>} />
          <Route path="/users" element={<ProtectedLayout><UsersPage /></ProtectedLayout>} />
          <Route path="/analytics" element={<ProtectedLayout><AnalyticsPage /></ProtectedLayout>} />
          <Route path="/sdk" element={<ProtectedLayout><SdkPage /></ProtectedLayout>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
