import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Clock3,
  Footprints,
  LoaderCircle,
  Radio,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { connectRealtime } from "@/services/socket";
import type {
  LiveOccupancyPayload,
  RealtimeAlertPayload,
  RealtimeConnectionStatus,
} from "@/types/realtime-socket";

import {
  getSites,
  getOccupancy,
  getFootfall,
  getDwell,
  getDemographics,
} from "@/services/analyticsService";

import type {
  Site,
  OccupancyResponse,
  FootfallResponse,
  DwellResponse,
  DemographicsResponse,
} from "@/types/analytics";

type RangeOption = "24h" | "7d" | "30d";

interface DashboardData {
  occupancy: OccupancyResponse;
  footfall: FootfallResponse;
  dwell: DwellResponse;
  demographics: DemographicsResponse;
  previousFootfall: number | null;
  previousDwellMinutes: number | null;
}

interface LiveOccupancyPoint {
  ts: number;
  occupancy: number;
}

interface Trend {
  pct: number;
  label: string;
}

const RANGE_OPTIONS: { label: string; value: RangeOption }[] = [
  { label: "Last 24 hours", value: "24h" },
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
];

const ALERT_LIMIT = 20;

// Max live points kept per site for the occupancy timeline.
const LIVE_POINT_LIMIT = 120;

const DAY_MS = 24 * 60 * 60 * 1000;

const SEVERITY_STYLES: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-emerald-100 text-emerald-700",
};

function getTimeRange(range: RangeOption) {
  const toUtc = Date.now();

  const durationMs: Record<RangeOption, number> = {
    "24h": DAY_MS,
    "7d": 7 * DAY_MS,
    "30d": 30 * DAY_MS,
  };

  return {
    fromUtc: toUtc - durationMs[range],
    toUtc,
  };
}

function zonedDateTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string,
): number {
  const targetAsUtc = Date.UTC(year, month - 1, day, hour, minute, second);

  let candidate = targetAsUtc;

  for (let i = 0; i < 4; i += 1) {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(candidate));

    const values = Object.fromEntries(
      parts.map((part) => [part.type, part.value]),
    );

    const representedAsUtc = Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day),
      Number(values.hour),
      Number(values.minute),
      Number(values.second),
    );

    const difference = targetAsUtc - representedAsUtc;

    candidate += difference;

    if (difference === 0) break;
  }

  return candidate;
}

function getSiteDayStartUtc(timeZone: string, now = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return zonedDateTimeToUtc(
    Number(values.year),
    Number(values.month),
    Number(values.day),
    0,
    0,
    0,
    timeZone,
  );
}

function formatNumber(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat().format(Math.round(value));
}

function formatMinutes(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toFixed(1)} min`;
}

function formatTimestamp(timestamp: number, timeZone?: string): string {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) return "Unknown time";

  try {
    return new Intl.DateTimeFormat(undefined, {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "short",
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

function formatClock(timestamp: number, timeZone?: string): string {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) return "";

  try {
    return new Intl.DateTimeFormat(undefined, {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(date);
  } catch {
    return date.toLocaleTimeString();
  }
}

function computeTrend(
  current: number | null | undefined,
  previous: number | null | undefined,
  label: string,
): Trend | null {
  if (
    current == null ||
    previous == null ||
    !Number.isFinite(current) ||
    !Number.isFinite(previous) ||
    previous === 0
  ) {
    return null;
  }

  return { pct: ((current - previous) / previous) * 100, label };
}

function getConnectionLabel(status: RealtimeConnectionStatus): string {
  const labels: Record<RealtimeConnectionStatus, string> = {
    disabled: "Realtime unavailable",
    connecting: "Connecting",
    connected: "Live",
    disconnected: "Disconnected",
    error: "Connection error",
  };

  return labels[status];
}

function getConnectionStyle(status: RealtimeConnectionStatus): string {
  if (status === "connected") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "connecting") {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-slate-100 text-slate-600";
}

function TrendBadge({ trend }: { trend: Trend }) {
  const rounded = Math.round(trend.pct);

  if (rounded === 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
        No change {trend.label}
      </span>
    );
  }

  const Icon = rounded > 0 ? TrendingUp : TrendingDown;

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
      <Icon className="h-3 w-3" />
      {rounded > 0 ? "+" : "−"}
      {Math.abs(rounded)}% {trend.label}
    </span>
  );
}

function MetricCard({
  title,
  value,
  description,
  icon,
  trend,
  loading = false,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  trend?: Trend | null;
  loading?: boolean;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {loading ? (
              <span
                role="status"
                aria-label={`Loading ${title}`}
                className="inline-block h-8 w-24 animate-pulse rounded-md bg-slate-200"
              />
            ) : (
              <p className="text-2xl font-semibold tracking-tight text-slate-900">
                {value}
              </p>
            )}
            {!loading && trend && <TrendBadge trend={trend} />}
          </div>
        </div>

        <div className="rounded-lg bg-slate-100 p-2.5 text-slate-700">
          {icon}
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500">{description}</p>
    </section>
  );
}

function ChartCard({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>

        {action}
      </div>

      {children}
    </section>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-slate-200 px-5 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Something went wrong while loading dashboard data.";
}

export default function DashboardPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [range, setRange] = useState<RangeOption>("24h");

  const [data, setData] = useState<DashboardData | null>(null);
  const [sitesLoading, setSitesLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sitesError, setSitesError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const [realtimeStatus, setRealtimeStatus] =
    useState<RealtimeConnectionStatus>("connecting");

  const [liveBySite, setLiveBySite] = useState<
    Record<string, LiveOccupancyPayload>
  >({});

  const [liveSeriesBySite, setLiveSeriesBySite] = useState<
    Record<string, LiveOccupancyPoint[]>
  >({});

  const [realtimeAlerts, setRealtimeAlerts] = useState<RealtimeAlertPayload[]>(
    [],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadSites() {
      setSitesLoading(true);
      setSitesError(null);

      try {
        const result = await getSites();

        if (cancelled) return;

        setSites(result);

        setSelectedSiteId((current) => {
          if (current && result.some((site) => site.siteId === current)) {
            return current;
          }

          return result[0]?.siteId ?? "";
        });
      } catch (err) {
        if (!cancelled) {
          setSitesError(getErrorMessage(err));
        }
      } finally {
        if (!cancelled) {
          setSitesLoading(false);
        }
      }
    }

    void loadSites();

    return () => {
      cancelled = true;
    };
  }, [retryKey]);

  const selectedSite = useMemo(
    () => sites.find((site) => site.siteId === selectedSiteId),
    [sites, selectedSiteId],
  );

  useEffect(() => {
    if (!selectedSiteId || !selectedSite) {
      return;
    }

    const site = selectedSite;
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setError(null);
      setData(null);

      const { fromUtc, toUtc } = getTimeRange(range);

      const historicalRequest = {
        siteId: selectedSiteId,
        fromUtc,
        toUtc,
      };

      const now = new Date();
      const nowMs = now.getTime();
      const dayStartUtc = getSiteDayStartUtc(site.timezone, now);

      const todayFootfallRequest = {
        siteId: selectedSiteId,
        fromUtc: dayStartUtc,
        toUtc: nowMs,
      };

      const yesterdayStartUtc = getSiteDayStartUtc(
        site.timezone,
        new Date(nowMs - DAY_MS),
      );

      const yesterdayFootfallRequest = {
        siteId: selectedSiteId,
        fromUtc: yesterdayStartUtc,
        toUtc: yesterdayStartUtc + (nowMs - dayStartUtc),
      };

      const previousDwellRequest = {
        siteId: selectedSiteId,
        fromUtc: fromUtc - (toUtc - fromUtc),
        toUtc: fromUtc,
      };

      try {
        const [
          occupancy,
          footfall,
          dwell,
          demographics,
          previousFootfallResponse,
          previousDwellResponse,
        ] = await Promise.all([
          getOccupancy(historicalRequest),
          getFootfall(todayFootfallRequest),
          getDwell(historicalRequest),
          getDemographics(historicalRequest),

          getFootfall(yesterdayFootfallRequest).catch(() => null),
          getDwell(previousDwellRequest).catch(() => null),
        ]);

        if (cancelled) return;

        setData({
          occupancy,
          footfall,
          dwell,
          demographics,
          previousFootfall: previousFootfallResponse?.footfall ?? null,
          previousDwellMinutes: previousDwellResponse?.avgDwellMinutes ?? null,
        });
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err));
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [selectedSiteId, selectedSite, range, retryKey]);

  useEffect(() => {
    const cleanup = connectRealtime({
      onStatusChange: setRealtimeStatus,

      onLiveOccupancy: (payload) => {
        setLiveBySite((current) => ({
          ...current,
          [payload.siteId]: payload,
        }));

        if (Number.isFinite(payload.siteOccupancy)) {
          setLiveSeriesBySite((current) => {
            const existing = current[payload.siteId] ?? [];
            const last = existing[existing.length - 1];

            if (last && last.ts === payload.ts) return current;

            return {
              ...current,
              [payload.siteId]: [
                ...existing,
                { ts: payload.ts, occupancy: payload.siteOccupancy },
              ].slice(-LIVE_POINT_LIMIT),
            };
          });
        }
      },

      onAlert: (payload) => {
        setRealtimeAlerts((current) =>
          [
            payload,
            ...current.filter((alert) => alert.eventId !== payload.eventId),
          ].slice(0, ALERT_LIMIT),
        );
      },
    });

    return () => {
      cleanup?.();
    };
  }, []);

  const siteLiveOccupancy = liveBySite[selectedSiteId] ?? null;

  const liveOccupancyValue = siteLiveOccupancy?.siteOccupancy ?? null;

  const averageOccupancyValue = useMemo(() => {
    const buckets = data?.occupancy.buckets ?? [];

    if (buckets.length === 0) return null;

    const total = buckets.reduce((sum, bucket) => sum + bucket.avg, 0);

    return total / buckets.length;
  }, [data]);

  const occupancyChart = useMemo(() => {
    const buckets = data?.occupancy.buckets ?? [];
    const livePoints = selectedSiteId
      ? (liveSeriesBySite[selectedSiteId] ?? [])
      : [];

    const lastIndex = buckets.length - 1;

    const historical = buckets.map((bucket, index) => ({
      time: bucket.local,
      occupancy: bucket.avg as number | null,

      live: (index === lastIndex && livePoints.length > 0
        ? bucket.avg
        : null) as number | null,
    }));

    const live = livePoints.map((point) => ({
      time: formatClock(point.ts, selectedSite?.timezone),
      occupancy: null as number | null,
      live: point.occupancy as number | null,
    }));

    return [...historical, ...live];
  }, [data, liveSeriesBySite, selectedSiteId, selectedSite]);

  const hasLiveTimelinePoints =
    (liveSeriesBySite[selectedSiteId]?.length ?? 0) > 0;

  const historicalDemographicsChart = useMemo(
    () =>
      (data?.demographics.buckets ?? []).map((bucket) => ({
        time: bucket.local,
        Male: bucket.male,
        Female: bucket.female,
      })),
    [data],
  );

  const liveGenderData = siteLiveOccupancy
    ? [
        { name: "Male", value: siteLiveOccupancy.genderCount.male },
        { name: "Female", value: siteLiveOccupancy.genderCount.female },
      ]
    : [];

  const visibleAlerts = useMemo(
    () =>
      realtimeAlerts
        .filter((alert) => alert.siteId === selectedSiteId)
        .slice(0, 8),
    [realtimeAlerts, selectedSiteId],
  );

  const liveOccupancyTrend = computeTrend(
    liveOccupancyValue,
    averageOccupancyValue,
    "vs avg",
  );

  const footfallTrend = computeTrend(
    data?.footfall.footfall,
    data?.previousFootfall,
    "vs yesterday",
  );

  const dwellTrend = computeTrend(
    data?.dwell.avgDwellMinutes,
    data?.previousDwellMinutes,
    "vs prev. period",
  );

  const hasOccupancyData = occupancyChart.length > 0;

  const hasHistoricalDemographics = historicalDemographicsChart.length > 0;

  const hasAnySite = sites.length > 0;

  const isDataLoading = loading || (!!selectedSite && !data && !error);

  function retryLoading() {
    setRetryKey((current) => current + 1);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center lg:justify-end">
          <div className="flex max-w-full flex-col gap-4 xl:flex-row xl:items-center ">
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                <span className="sr-only">Select site</span>
                <select
                  value={selectedSiteId}
                  onChange={(event) => {
                    setSelectedSiteId(event.target.value);
                  }}
                  disabled={sitesLoading || !hasAnySite}
                  className="min-w-48 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-400"
                >
                  {sites.length === 0 && (
                    <option value="">No sites available</option>
                  )}

                  {sites.map((site) => (
                    <option key={site.siteId} value={site.siteId}>
                      {site.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                <span className="sr-only">Time range</span>
                <select
                  value={range}
                  onChange={(event) => {
                    setRange(event.target.value as RangeOption);
                  }}
                  className="min-w-44 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-400"
                >
                  {RANGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </header>

        {/* Site loading/error states */}
        {sitesLoading && (
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Loading sites…
          </div>
        )}

        {sitesError && (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between"
          >
            <p>Unable to load sites: {sitesError}</p>
            <button
              type="button"
              onClick={retryLoading}
              className="font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        {!sitesLoading && !sitesError && !hasAnySite && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="font-medium text-slate-800">No sites found</p>
            <p className="mt-1 text-sm text-slate-500">
              There are no sites available for this account.
            </p>
          </div>
        )}

        {selectedSite && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-800">
                  {selectedSite.name}
                </h2>
                <p className="text-sm text-slate-500">
                  {[selectedSite.city, selectedSite.country]
                    .filter(Boolean)
                    .join(", ")}
                  {" · "}
                  {selectedSite.timezone}
                </p>
              </div>

              <div
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${getConnectionStyle(realtimeStatus)}`}
              >
                {realtimeStatus === "connected" ? (
                  <Radio className="h-3.5 w-3.5" />
                ) : realtimeStatus === "connecting" ? (
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5" />
                )}

                {getConnectionLabel(realtimeStatus)}
              </div>
            </div>

            {/* Four separate KPI cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                title="Live Occupancy"
                value={
                  liveOccupancyValue == null
                    ? "—"
                    : formatNumber(liveOccupancyValue)
                }
                trend={liveOccupancyTrend}
                description={
                  siteLiveOccupancy
                    ? `${realtimeStatus === "connected" ? "Latest live update" : "Last known value"} · ${formatTimestamp(siteLiveOccupancy.ts, selectedSite.timezone)}`
                    : realtimeStatus === "connected"
                      ? "Waiting for occupancy data for this site"
                      : "Live data is currently unavailable"
                }
                icon={<Users className="h-5 w-5" />}
              />

              <MetricCard
                title="Average Occupancy"
                value={
                  averageOccupancyValue == null
                    ? "—"
                    : formatNumber(averageOccupancyValue)
                }
                description={`Average of ${range === "24h" ? "the last 24 hours" : range === "7d" ? "the last 7 days" : "the last 30 days"} of historical occupancy buckets`}
                icon={<Activity className="h-5 w-5" />}
                loading={isDataLoading}
              />

              <MetricCard
                title="Today's Footfall"
                value={data ? formatNumber(data.footfall.footfall) : "—"}
                trend={footfallTrend}
                description="Footfall from site-local midnight to the latest request"
                icon={<Footprints className="h-5 w-5" />}
                loading={isDataLoading}
              />

              <MetricCard
                title="Average Dwell Time"
                value={data ? formatMinutes(data.dwell.avgDwellMinutes) : "—"}
                trend={dwellTrend}
                description={`Average dwell time for the selected ${range === "24h" ? "24-hour" : range === "7d" ? "7-day" : "30-day"} period`}
                icon={<Clock3 className="h-5 w-5" />}
                loading={isDataLoading}
              />
            </div>

            {loading && (
              <div
                role="status"
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600"
              >
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Updating analytics…
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between"
              >
                <p>Unable to load analytics: {error}</p>
                <button
                  type="button"
                  onClick={retryLoading}
                  className="font-semibold underline"
                >
                  Retry
                </button>
              </div>
            )}

            <ChartCard
              title="Occupancy Timeline"
              description={`Historical average occupancy · ${RANGE_OPTIONS.find((option) => option.value === range)?.label}`}
              action={
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                    <span className="h-2 w-2 rounded-full bg-slate-500" />
                    Historical data
                  </span>

                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ${
                      realtimeStatus === "connected"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        realtimeStatus === "connected"
                          ? "bg-emerald-500"
                          : "bg-slate-400"
                      }`}
                    />
                    Live data
                  </span>
                </div>
              }
            >
              {isDataLoading ? (
                <EmptyChart message="Loading occupancy history…" />
              ) : hasOccupancyData ? (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={occupancyChart}
                      margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="occupancyGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#64748b"
                            stopOpacity={0.25}
                          />
                          <stop
                            offset="95%"
                            stopColor="#64748b"
                            stopOpacity={0.02}
                          />
                        </linearGradient>

                        <linearGradient
                          id="liveOccupancyGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#10b981"
                            stopOpacity={0.25}
                          />
                          <stop
                            offset="95%"
                            stopColor="#10b981"
                            stopOpacity={0.02}
                          />
                        </linearGradient>
                      </defs>

                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#e2e8f0"
                      />

                      <XAxis
                        dataKey="time"
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={24}
                      />

                      <YAxis
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        tickLine={false}
                        axisLine={false}
                        width={42}
                      />

                      <Tooltip
                        contentStyle={{
                          borderRadius: 10,
                          border: "1px solid #e2e8f0",
                        }}
                        formatter={(value, name) => [
                          formatNumber(Number(value)),
                          String(name),
                        ]}
                      />

                      <Area
                        type="monotone"
                        dataKey="occupancy"
                        name="Average occupancy"
                        stroke="#475569"
                        strokeWidth={2}
                        fill="url(#occupancyGradient)"
                        connectNulls={false}
                        isAnimationActive={false}
                      />

                      <Area
                        type="monotone"
                        dataKey="live"
                        name="Live occupancy"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="url(#liveOccupancyGradient)"
                        connectNulls={false}
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyChart message="No occupancy data is available for this site and period." />
              )}

              <p className="mt-3 text-xs text-slate-500">
                {hasLiveTimelinePoints
                  ? "Grey shows REST historical averages. Green shows live occupancy updates received during this session."
                  : "Grey shows REST historical averages. Live occupancy updates will be added to this chart as they arrive."}
              </p>
            </ChartCard>

            <ChartCard
              title="Historical Visitor Demographics Over Time"
              description="From demographics API"
            >
              {isDataLoading ? (
                <EmptyChart message="Loading demographics…" />
              ) : hasHistoricalDemographics ? (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={historicalDemographicsChart}
                      margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#e2e8f0"
                      />

                      <XAxis
                        dataKey="time"
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={24}
                      />

                      <YAxis
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        tickLine={false}
                        axisLine={false}
                        width={42}
                      />

                      <Tooltip
                        contentStyle={{
                          borderRadius: 10,
                          border: "1px solid #e2e8f0",
                        }}
                      />

                      <Legend />

                      <Area
                        type="monotone"
                        dataKey="Male"
                        stroke="#64748b"
                        fill="#64748b"
                        fillOpacity={0.12}
                        strokeWidth={2}
                        connectNulls={false}
                      />

                      <Area
                        type="monotone"
                        dataKey="Female"
                        stroke="#a78bfa"
                        fill="#a78bfa"
                        fillOpacity={0.12}
                        strokeWidth={2}
                        connectNulls={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyChart message="No historical demographics data is available for this site and period." />
              )}
            </ChartCard>

            {/* Live gender counts are deliberately separate from history. */}
            <ChartCard
              title="Live Gender Distribution"
              description="Latest male and female counts from the live occupancy event"
              action={
                siteLiveOccupancy ? (
                  <span className="text-xs text-slate-500">
                    Updated{" "}
                    {formatTimestamp(
                      siteLiveOccupancy.ts,
                      selectedSite.timezone,
                    )}
                  </span>
                ) : undefined
              }
            >
              {siteLiveOccupancy ? (
                <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-2">
                  <div className="h-56 min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={liveGenderData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={82}
                          paddingAngle={3}
                        >
                          {liveGenderData.map((entry) => (
                            <Cell
                              key={entry.name}
                              fill={
                                entry.name === "Male" ? "#64748b" : "#a78bfa"
                              }
                            />
                          ))}
                        </Pie>

                        <Tooltip
                          formatter={(value) => [
                            formatNumber(Number(value)),
                            "People",
                          ]}
                        />

                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-slate-200 p-4">
                      <p className="text-sm text-slate-500">Male</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">
                        {formatNumber(siteLiveOccupancy.genderCount.male)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Latest live count
                      </p>
                    </div>

                    <div className="rounded-lg border border-slate-200 p-4">
                      <p className="text-sm text-slate-500">Female</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">
                        {formatNumber(siteLiveOccupancy.genderCount.female)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Latest live count
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyChart message="Waiting for a live occupancy event for the selected site. Historical demographics remain available above." />
              )}
            </ChartCard>

            {/* Human-readable realtime alerts */}
            <ChartCard
              title="Recent Alert Activity"
              description="Latest realtime alerts received for the selected site"
              action={
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                  {visibleAlerts.length} recent
                </span>
              }
            >
              {visibleAlerts.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {visibleAlerts.map((alert) => (
                    <article
                      key={alert.eventId}
                      className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="mt-0.5 rounded-lg bg-slate-100 p-2 text-slate-600">
                          <AlertTriangle className="h-4 w-4" />
                        </div>

                        <div className="min-w-0">
                          <p className="font-medium text-slate-800">
                            {alert.direction.toLowerCase() === "entry"
                              ? "Entry detected"
                              : alert.direction.toLowerCase() === "exit"
                                ? "Exit detected"
                                : `Activity: ${alert.direction}`}
                          </p>

                          <p className="mt-1 break-words text-sm text-slate-600">
                            {alert.zoneName}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {alert.personName}
                            {" · "}
                            {formatTimestamp(alert.ts, selectedSite.timezone)}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`w-fit shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                          SEVERITY_STYLES[alert.severity.toLowerCase()] ??
                          "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {alert.severity}
                      </span>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyChart
                  message={
                    realtimeStatus === "connected"
                      ? "No realtime alerts have been received for this site during this session."
                      : "Realtime alerts will appear here when the socket connection is available."
                  }
                />
              )}
            </ChartCard>
          </>
        )}
      </div>
    </main>
  );
}
