import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  loading?: boolean;
}

export default function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  loading = false,
}: MetricCardProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>

          {loading ? (
            <div
              aria-label={`Loading ${title}`}
              className="mt-3 h-8 w-28 animate-pulse rounded bg-slate-100"
            />
          ) : (
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              {value}
            </p>
          )}

          <p className="mt-2 text-xs text-slate-500">{description}</p>
        </div>

        <div className="rounded-lg bg-indigo-50 p-2.5 text-indigo-700">
          <Icon size={20} aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
