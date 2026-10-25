import { Users } from "lucide-react";

export default function EntriesPlaceholder() {
  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-indigo-50 p-3 text-indigo-700">
            <Users size={23} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
              Crowd Entries
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              View and explore crowd entry and exit records.
            </p>
          </div>
        </div>

        <section className="mt-8 rounded-xl border border-slate-200 bg-white px-5 py-12 text-center">
          <Users className="mx-auto text-slate-400" size={32} />
          <h2 className="mt-4 font-semibold text-slate-900">
            Entries view is coming next
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            The entries table, pagination, and API integration will be
            implemented in the next step.
          </p>
        </section>
      </div>
    </div>
  );
}
