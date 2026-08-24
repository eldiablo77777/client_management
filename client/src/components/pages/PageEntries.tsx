import AppShell from "../layout/AppShell";
import DashboardOverview from "../dashboard/DashboardOverview";
import ClientsPage from "../clients/ClientsPage";
import FollowUpsPage from "../followups/FollowUpsPage";
import AnalyticsPage from "../analytics/AnalyticsPage";
import SettingsPage from "../settings/SettingsPage";

export function DashboardPageEntry() {
  return (
    <AppShell active="dashboard" title="Dashboard">
      <DashboardOverview />
    </AppShell>
  );
}

export function ClientsPageEntry() {
  return (
    <AppShell
      active="clients"
      title="Clients"
      subtitle="Every company in your pipeline, in one place."
    >
      <ClientsPage />
    </AppShell>
  );
}

export function LeadsPageEntry() {
  return (
    <AppShell active="leads" title="Leads" subtitle="New clients that haven't been contacted yet.">
      <ClientsPage lockedStatus="New" />
    </AppShell>
  );
}

export function FollowUpsPageEntry() {
  return (
    <AppShell
      active="follow-ups"
      title="Follow-ups"
      subtitle="Stay on top of every scheduled touchpoint."
    >
      <FollowUpsPage />
    </AppShell>
  );
}

export function AnalyticsPageEntry() {
  return (
    <AppShell
      active="analytics"
      title="Analytics"
      subtitle="Real numbers pulled straight from your pipeline."
    >
      <AnalyticsPage />
    </AppShell>
  );
}

export function SettingsPageEntry() {
  return (
    <AppShell
      active="settings"
      title="Settings"
      subtitle="Manage your profile, appearance, and account."
    >
      <SettingsPage />
    </AppShell>
  );
}
