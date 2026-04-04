import DashboardShell from '../components/dashboard/DashboardShell';

// Auth check bypassed for UI preview — restore original guard before production
export default function DashboardPage() {
  return <DashboardShell />;
}
