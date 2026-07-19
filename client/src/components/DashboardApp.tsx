import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function DashboardApp() {
  const [email, setEmail] = useState("Loading...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = "/login";
        return;
      }

      setEmail(session.user.email ?? "Authenticated user");
      setLoading(false);
    }

    void checkSession();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p>Loading dashboard...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm text-slate-500">Signed in as</p>
          <h1 className="text-xl font-semibold">{email}</h1>
        </div>

        <button
          type="button"
          onClick={() => void logout()}
          className="rounded-md bg-slate-900 px-4 py-2 text-white"
        >
          Log out
        </button>
      </header>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">
          Client Management
        </h2>

        <p className="mt-2 text-slate-600">
          Dashboard component is working.
        </p>
      </section>
    </main>
  );
}