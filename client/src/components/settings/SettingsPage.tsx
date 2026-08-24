import { useEffect, useState } from "react";
import { useSession, logout } from "../../lib/auth";
import { useTheme, type ThemePreference } from "../../lib/theme";
import { useToast } from "../../lib/toast";
import { supabase } from "../../lib/supabase";

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export default function SettingsPage() {
  const { session } = useSession();
  const { preference, setPreference } = useTheme();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!session) return;

    let active = true;
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setFullName(data?.full_name ?? "");
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [session]);

  async function handleSaveProfile() {
    if (!session) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim() || null })
        .eq("id", session.user.id);

      if (error) throw error;
      showToast("success", "Profile updated.");
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "Could not update profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <section className="surface-card p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Profile</h3>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="settings-name" className="field-label">Name</label>
            <input
              id="settings-name"
              className="input-field"
              value={fullName}
              disabled={loading}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Your name"
            />
          </div>
          <div>
            <label htmlFor="settings-email" className="field-label">Email</label>
            <input
              id="settings-email"
              className="input-field"
              value={session?.user.email ?? ""}
              disabled
              readOnly
            />
          </div>
          <button
            type="button"
            className="btn btn-primary"
            disabled={saving || loading}
            onClick={() => void handleSaveProfile()}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </section>

      <section className="surface-card p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Appearance</h3>
        <div className="mt-4 flex gap-2">
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setPreference(option.value)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                preference === option.value
                  ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-300"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="surface-card p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Account</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Signed in as {session?.user.email}
        </p>
        <button type="button" className="btn btn-secondary mt-4" onClick={() => void logout()}>
          Log out
        </button>
      </section>
    </div>
  );
}
