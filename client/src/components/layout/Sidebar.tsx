import {
  BarChart3,
  CalendarClock,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Target,
  Users,
  X,
} from "lucide-react";
import { logout } from "../../lib/auth";
import { initials } from "../../lib/format";

export type PageKey =
  | "dashboard"
  | "clients"
  | "leads"
  | "follow-ups"
  | "analytics"
  | "settings";

const NAV_ITEMS: { key: PageKey; label: string; href: string; icon: typeof Users }[] = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "clients", label: "Clients", href: "/clients", icon: Users },
  { key: "leads", label: "Leads", href: "/leads", icon: Target },
  { key: "follow-ups", label: "Follow-ups", href: "/follow-ups", icon: CalendarClock },
  { key: "analytics", label: "Analytics", href: "/analytics", icon: BarChart3 },
  { key: "settings", label: "Settings", href: "/settings", icon: Settings },
];

type SidebarProps = {
  active: PageKey;
  email: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
};

export default function Sidebar({
  active,
  email,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-out dark:border-slate-800 dark:bg-slate-900 lg:sticky lg:top-0 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "lg:w-[72px]" : "lg:w-64"} w-64`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-4">
          {!collapsed && (
            <span className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              Pipeline
            </span>
          )}
          <button
            type="button"
            onClick={onCloseMobile}
            className="focus-ring rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onToggleCollapse}
            className="focus-ring hidden rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:block"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.key;

            return (
              <a
                key={item.key}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`focus-ring flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                } ${collapsed ? "lg:justify-center" : ""}`}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                <span className={collapsed ? "lg:hidden" : ""}>{item.label}</span>
              </a>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-slate-200 p-3 dark:border-slate-800">
          <div
            className={`flex items-center gap-3 rounded-lg px-2 py-2 ${collapsed ? "lg:justify-center" : ""}`}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
              {initials(email)}
            </span>
            <div className={`min-w-0 flex-1 ${collapsed ? "lg:hidden" : ""}`}>
              <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                {email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void logout()}
            title={collapsed ? "Log out" : undefined}
            className={`focus-ring mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 ${
              collapsed ? "lg:justify-center" : ""
            }`}
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
            <span className={collapsed ? "lg:hidden" : ""}>Log out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export function MobileMenuButton({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="focus-ring rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
      aria-label="Open menu"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}
