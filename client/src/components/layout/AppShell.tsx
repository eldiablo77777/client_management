import { useState, type ReactNode } from "react";
import { Moon, Sun } from "lucide-react";
import { useSession } from "../../lib/auth";
import { ThemeProvider, useTheme } from "../../lib/theme";
import { ToastProvider } from "../../lib/toast";
import ToastViewport from "../ui/Toast";
import SearchBar from "../ui/SearchBar";
import Sidebar, { MobileMenuButton, type PageKey } from "./Sidebar";

const STORAGE_KEY = "crm-sidebar-collapsed";

function readCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}

function ThemeToggleButton() {
  const { resolved, setPreference } = useTheme();

  return (
    <button
      type="button"
      onClick={() => setPreference(resolved === "dark" ? "light" : "dark")}
      className="focus-ring rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
      aria-label={resolved === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {resolved === "dark" ? (
        <Sun className="h-[18px] w-[18px]" />
      ) : (
        <Moon className="h-[18px] w-[18px]" />
      )}
    </button>
  );
}

function Shell({
  active,
  title,
  subtitle,
  children,
}: {
  active: PageKey;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const { session, loading } = useSession();
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  function toggleCollapse() {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <p className="text-sm text-slate-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar
        active={active}
        email={session.user.email ?? "Signed in"}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 sm:px-6">
          <MobileMenuButton onOpen={() => setMobileOpen(true)} />

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold text-slate-900 dark:text-slate-50">
              {title}
            </h1>
            {subtitle && (
              <p className="hidden truncate text-xs text-slate-500 dark:text-slate-400 sm:block">
                {subtitle}
              </p>
            )}
          </div>

          <div className="hidden md:block md:w-72">
            <SearchBar />
          </div>

          <ThemeToggleButton />
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>

      <ToastViewport />
    </div>
  );
}

export default function AppShell(props: {
  active: PageKey;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <Shell {...props} />
      </ToastProvider>
    </ThemeProvider>
  );
}
