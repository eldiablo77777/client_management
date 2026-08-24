import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import type { Client } from "../../types/client";

type SearchResult = Pick<
  Client,
  "id" | "company_name" | "contact_person" | "phone_number" | "status"
>;

export default function SearchBar() {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      } else if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      setTerm("");
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    const query = term.trim();

    if (!query) {
      setResults([]);
      return;
    }

    setLoading(true);
    const timeout = window.setTimeout(async () => {
      const like = `%${query}%`;
      const { data } = await supabase
        .from("clients")
        .select("id, company_name, contact_person, phone_number, status")
        .eq("archived", false)
        .or(
          `company_name.ilike.${like},contact_person.ilike.${like},phone_number.ilike.${like},email.ilike.${like},requirements.ilike.${like}`,
        )
        .limit(8);

      setResults((data ?? []) as SearchResult[]);
      setLoading(false);
    }, 200);

    return () => window.clearTimeout(timeout);
  }, [term]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="focus-ring flex w-full max-w-sm items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-400 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500"
      >
        <Search className="h-4 w-4" aria-hidden="true" />
        <span className="flex-1 text-left">Search clients…</span>
        <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 dark:border-slate-700 dark:bg-slate-900">
          Ctrl K
        </kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/50 px-4 pt-24"
          role="dialog"
          aria-modal="true"
          aria-label="Global search"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
              <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
              <input
                ref={inputRef}
                type="text"
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="Search by company, contact, phone, email, notes…"
                className="flex-1 border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="focus-ring rounded p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Close search"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto py-2">
              {loading && (
                <p className="px-4 py-6 text-center text-sm text-slate-400">
                  Searching…
                </p>
              )}

              {!loading && term.trim() && results.length === 0 && (
                <p className="px-4 py-6 text-center text-sm text-slate-400">
                  No clients match your search.
                </p>
              )}

              {!loading &&
                results.map((client) => (
                  <a
                    key={client.id}
                    href={`/clients?open=${client.id}`}
                    className="focus-ring flex flex-col gap-0.5 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {client.company_name}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {client.contact_person || "No contact"} · {client.phone_number}
                    </span>
                  </a>
                ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
