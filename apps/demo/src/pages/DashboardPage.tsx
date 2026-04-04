import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import DashboardShell from '../components/dashboard/DashboardShell';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate('/');
  }, [user, loading, navigate]);

  if (loading || !user) return null;

  return <DashboardShell />;
}
