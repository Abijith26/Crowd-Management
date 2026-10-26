import { useEffect, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  RefreshCw,
  Users,
} from "lucide-react";

import { getEntryExitSessions, getSites } from "@/services/analyticsService";
import type { EntryExitResponse, Site } from "@/types/analytics";

type RangeOption = "24h" | "7d" | "30d";

const PAGE_SIZE_OPTIONS = [10, 25, 50];

function getTimeRange(range: RangeOption) {
  const toUtc = Date.now();

  const durations: Record<RangeOption, number> = {
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
  };

  return {
    fromUtc: toUtc - durations[range],
    toUtc,
  };
}

function formatDwell(minutes: number | null) {
  if (minutes == null) return "In progress";

  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);

  return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function severityClass(severity: string) {
  switch (severity.toLowerCase()) {
    case "high":
      return "bg-red-50 text-red-700 ring-red-200";
    case "medium":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "low":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
}

export default function EntriesPlaceholder() {
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [range, setRange] = useState<RangeOption>("24h");
  const [pageSize, setPageSize] = useState(10);
  const [pageNumber, setPageNumber] = useState(1);
  const [result, setResult] = useState<EntryExitResponse | null>(null);

  const [sitesLoading, setSitesLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [sitesError, setSitesError] = useState("");
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [sitesRetryKey, setSitesRetryKey] = useState(0);

  const selectedSite = sites.find((site) => site.siteId === selectedSiteId);

  useEffect(() => {
    let cancelled = false;

    async function loadSites() {
      setSitesLoading(true);
      setSitesError("");

      try {
        const response = await getSites();

        if (cancelled) return;

        setSites(response);

        if (response.length === 0) {
          setSitesError("No sites are available for your account.");
          return;
        }

        setSelectedSiteId((current) =>
          current && response.some((site) => site.siteId === current)
            ? current
            : response[0].siteId,
        );
      } catch (err) {
        if (!cancelled) {
          setSitesError(
            err instanceof Error ? err.message : "Unable to load sites.",
          );
        }
      } finally {
        if (!cancelled) setSitesLoading(false);
      }
    }

    void loadSites();

    return () => {
      cancelled = true;
    };
  }, [sitesRetryKey]);

  useEffect(() => {
    if (!selectedSiteId) return;

    let cancelled = false;

    async function loadEntries() {
      setLoading(true);
      setError("");
      setResult(null);

      try {
        const { fromUtc, toUtc } = getTimeRange(range);

        const response = await getEntryExitSessions({
          siteId: selectedSiteId,
          fromUtc,
          toUtc,
          pageSize,
          pageNumber,
        });

        if (!cancelled) setResult(response);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load crowd entries.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadEntries();

    return () => {
      cancelled = true;
    };
  }, [selectedSiteId, range, pageSize, pageNumber, retryKey]);

  function changeRange(value: RangeOption) {
    setRange(value);
    setPageNumber(1);
  }

  function changeSite(value: string) {
    setSelectedSiteId(value);
    setPageNumber(1);
  }

  function changePageSize(value: number) {
    setPageSize(value);
    setPageNumber(1);
  }

  const totalRecords = result?.totalRecords ?? 0;
  const totalPages = result?.totalPages ?? 0;
  const firstRecord = totalRecords === 0 ? 0 : (pageNumber - 1) * pageSize + 1;
  const lastRecord = Math.min(pageNumber * pageSize, totalRecords);

  return (
    <div className="min-w-0">
      <header className="border-b border-slate-200 bg-white px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="mt-1 text-sm text-slate-700 font-bold">
              Review visitor sessions, entry times, and zone activity.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3">
              <MapPin size={17} className="shrink-0 text-slate-500" />
              <span className="sr-only">Select site</span>
              <select
                value={selectedSiteId}
                onChange={(event) => changeSite(event.target.value)}
                disabled={sitesLoading || sites.length === 0}
                className="h-10 min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none"
              >
                {sitesLoading && <option value="">Loading sites...</option>}
                {sites.map((site) => (
                  <option key={site.siteId} value={site.siteId}>
                    {site.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3">
              <CalendarDays size={17} className="shrink-0 text-slate-500" />
              <span className="sr-only">Time range</span>
              <select
                value={range}
                onChange={(event) =>
                  changeRange(event.target.value as RangeOption)
                }
                className="h-10 bg-transparent text-sm text-slate-800 outline-none"
              >
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
              </select>
            </label>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        {selectedSite && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
            <span className="font-medium text-slate-700">
              {selectedSite.name}
            </span>
            <span>
              {selectedSite.city}, {selectedSite.country}
            </span>
            <span>Timezone: {selectedSite.timezone}</span>
          </div>
        )}

        {sitesError && (
          <div
            role="alert"
            className="flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle size={19} />
            <span className="flex-1">{sitesError}</span>
            <button
              type="button"
              disabled={sitesLoading}
              onClick={() => setSitesRetryKey((current) => current + 1)}
              className="font-semibold underline underline-offset-2 disabled:opacity-50"
            >
              Retry
            </button>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle size={19} />
            <span className="flex-1">{error}</span>
            <button
              type="button"
              disabled={loading}
              onClick={() => setRetryKey((current) => current + 1)}
              className="font-semibold underline underline-offset-2 disabled:opacity-50"
            >
              {loading ? "Retrying..." : "Retry"}
            </button>
          </div>
        )}

        <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                <Users size={20} />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">
                  Visitor sessions
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {loading
                    ? "Loading visitor records..."
                    : error
                      ? "Records could not be loaded."
                      : `${formatNumber(totalRecords)} records found`}
                </p>
              </div>
            </div>

            {totalRecords > 0 && (
              <label className="flex items-center gap-2 text-sm text-slate-600">
                Rows per page
                <select
                  value={pageSize}
                  onChange={(event) =>
                    changePageSize(Number(event.target.value))
                  }
                  className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          {totalRecords > 0 && (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-262.5 border-collapse text-left text-sm">
                <thead>
                  <tr className="border-y border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <th scope="col" className="px-4 py-3 font-medium">
                      Visitor
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Gender
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Zone
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Severity
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Entry time
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Exit time
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Dwell time
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {loading &&
                    Array.from({ length: 5 }, (_, index) => (
                      <tr key={`loading-${index}`}>
                        {Array.from({ length: 7 }, (_, cellIndex) => (
                          <td key={cellIndex} className="px-4 py-4">
                            <div className="h-4 animate-pulse rounded bg-slate-100" />
                          </td>
                        ))}
                      </tr>
                    ))}

                  {!loading &&
                    !error &&
                    result?.records.map((record) => (
                      <tr
                        key={`${record.personId}-${record.entryUtc}`}
                        className="transition-colors hover:bg-slate-50"
                      >
                        <td className="px-4 py-4">
                          <span className="font-medium text-slate-900">
                            {record.personName}
                          </span>
                        </td>
                        <td className="px-4 py-4 capitalize text-slate-600">
                          {record.gender}
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-slate-800">
                            {record.zoneName}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset ${severityClass(record.severity)}`}
                          >
                            {record.severity}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                          {record.entryLocal}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                          {record.exitLocal ?? (
                            <span className="text-amber-700">In progress</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <span className="inline-flex items-center gap-1.5 text-slate-700">
                            <Clock3 size={15} className="text-slate-400" />
                            {formatDwell(record.dwellMinutes)}
                          </span>
                        </td>
                      </tr>
                    ))}

                  {!loading && !error && result?.records.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-14 text-center">
                        <Users className="mx-auto text-slate-400" size={28} />
                        <p className="mt-3 font-medium text-slate-900">
                          No visitor sessions found
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Try another site or time range.
                        </p>
                      </td>
                    </tr>
                  )}

                  {!loading && !error && !result && !sitesError && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-14 text-center text-sm text-slate-500"
                      >
                        Select a site to view visitor sessions.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              {totalRecords > 0 &&
                `Showing ${formatNumber(firstRecord)}–${formatNumber(lastRecord)} of ${formatNumber(totalRecords)}`}

              {totalPages > 0
                ? ` · Page ${pageNumber} of ${formatNumber(totalPages)}`
                : ""}
            </p>

            {totalPages > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={loading || pageNumber <= 1 || !result}
                  onClick={() => setPageNumber((current) => current - 1)}
                  className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <button
                  type="button"
                  disabled={
                    loading ||
                    !result ||
                    totalPages === 0 ||
                    pageNumber >= totalPages
                  }
                  onClick={() => setPageNumber((current) => current + 1)}
                  className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </section>

        <p className="text-xs leading-5 text-slate-500">
          Entry and exit timestamps are provided by the API in the selected
          site's local time. Sessions without an exit time are still in
          progress.
        </p>

        {loading && (
          <span className="sr-only" role="status">
            <RefreshCw className="inline" size={1} />
            Loading visitor sessions
          </span>
        )}
      </div>
    </div>
  );
}
