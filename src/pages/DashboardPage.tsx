import { useEffect, useMemo, useState } from "react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

import {
  Activity,
  CalendarDays,
  Clock3,
  RefreshCw,
  Users,
  Footprints,
  AlertCircle,
  MapPin,
} from "lucide-react";

import MetricCard from "@/page-components/dashboard/MetricCard";
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
}

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

function formatNumber(value: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
  }).format(value);
}

function formatChartTime(
  timestamp: number,
  timezone: string,
  range: RangeOption,
) {
  const options: Intl.DateTimeFormatOptions =
    range === "24h"
      ? { hour: "2-digit", minute: "2-digit" }
      : { month: "short", day: "numeric" };

  return new Intl.DateTimeFormat("en-US", {
    ...options,
    timeZone: timezone,
  }).format(timestamp);
}

export default function DashboardPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [range, setRange] = useState<RangeOption>("24h");
  const [data, setData] = useState<DashboardData | null>(null);

  const [sitesLoading, setSitesLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [sitesError, setSitesError] = useState("");
  const [dataError, setDataError] = useState("");

  const selectedSite = useMemo(
    () => sites.find((site) => site.siteId === selectedSiteId),
    [sites, selectedSiteId],
  );

  const occupancyChartData = useMemo(
    () =>
      (data?.occupancy.buckets ?? []).map((bucket) => ({
        ...bucket,
        label: formatChartTime(
          bucket.utc,
          selectedSite?.timezone ?? "UTC",
          range,
        ),
      })),
    [data, selectedSite, range],
  );

  const demographicsChartData = useMemo(
    () =>
      (data?.demographics.buckets ?? []).map((bucket) => ({
        ...bucket,
        label: formatChartTime(
          bucket.utc,
          selectedSite?.timezone ?? "UTC",
          range,
        ),
      })),
    [data, selectedSite, range],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadSites() {
      setSitesLoading(true);
      setSitesError("");

      try {
        const result = await getSites();

        if (cancelled) return;

        setSites(result);

        if (result.length > 0) {
          setSelectedSiteId((current) =>
            current && result.some((site) => site.siteId === current)
              ? current
              : result[0].siteId,
          );
        } else {
          setSitesError("No sites are available for your account.");
        }
      } catch (error) {
        if (!cancelled) {
          setSitesError(
            error instanceof Error ? error.message : "Unable to load sites.",
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
  }, []);

  useEffect(() => {
    if (!selectedSiteId) return;

    let cancelled = false;

    async function loadDashboard() {
      setDataLoading(true);
      setDataError("");
      setData(null);

      try {
        const { fromUtc, toUtc } = getTimeRange(range);
        const request = { siteId: selectedSiteId, fromUtc, toUtc };

        const [occupancy, footfall, dwell, demographics] = await Promise.all([
          getOccupancy(request),
          getFootfall(request),
          getDwell(request),
          getDemographics(request),
        ]);

        if (cancelled) return;

        setData({ occupancy, footfall, dwell, demographics });
      } catch (error) {
        if (!cancelled) {
          setDataError(
            error instanceof Error
              ? error.message
              : "Unable to load dashboard data.",
          );
        }
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [selectedSiteId, range]);

  const latestOccupancy = data?.occupancy.buckets.at(-1)?.avg;

  const averageDwell = data?.dwell.avgDwellMinutes;

  const hasNoAnalytics =
    data &&
    data.occupancy.buckets.length === 0 &&
    data.demographics.buckets.length === 0 &&
    data.footfall.footfall === 0 &&
    data.dwell.dwellRecords === 0;

  return (
    <div className="min-h-screen min-w-0">
      <header className="border-b border-slate-200 bg-white px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-600">
              CROWD MANAGEMENT
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
              Overview
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Monitor occupancy and visitor activity at your site.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3">
              <MapPin size={17} className="shrink-0 text-slate-500" />
              <span className="sr-only">Select site</span>
              <select
                value={selectedSiteId}
                onChange={(event) => setSelectedSiteId(event.target.value)}
                disabled={sitesLoading || sites.length === 0}
                className="h-10 min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none"
              >
                {sitesLoading && <option value="">Loading sites...</option>}
                {!sitesLoading && sites.length === 0 && (
                  <option value="">No sites available</option>
                )}
                {sites.map((site) => (
                  <option key={site.siteId} value={site.siteId}>
                    {site.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3">
              <CalendarDays size={17} className="shrink-0 text-slate-500" />
              <span className="sr-only">Date range</span>
              <select
                value={range}
                onChange={(event) =>
                  setRange(event.target.value as RangeOption)
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

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
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
              onClick={() => window.location.reload()}
              className="font-semibold underline underline-offset-2"
            >
              Retry
            </button>
          </div>
        )}

        {dataError && (
          <div
            role="alert"
            className="flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle size={19} />
            <span className="flex-1">{dataError}</span>
            <button
              type="button"
              onClick={() => setRange((current) => current)}
              className="font-semibold underline underline-offset-2"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Key metrics
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {
                {
                  "24h": "Last 24 hours",
                  "7d": "Last 7 days",
                  "30d": "Last 30 days",
                }[range]
              }
            </p>
          </div>

          {dataLoading && (
            <span className="inline-flex items-center gap-2 text-sm text-slate-500">
              <RefreshCw size={15} className="animate-spin" />
              Updating metrics...
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            title="Average occupancy"
            value={
              latestOccupancy == null ? "—" : formatNumber(latestOccupancy, 1)
            }
            description="Latest hourly average in the selected range"
            icon={Activity}
            loading={dataLoading || sitesLoading}
          />

          <MetricCard
            title="Total footfall"
            value={data ? formatNumber(data.footfall.footfall) : "—"}
            description="Recorded entry events in the selected range"
            icon={Footprints}
            loading={dataLoading || sitesLoading}
          />

          <MetricCard
            title="Average dwell time"
            value={
              averageDwell == null
                ? "—"
                : `${formatNumber(averageDwell, 2)} min`
            }
            description={
              data
                ? `${formatNumber(data.dwell.dwellRecords)} dwell records`
                : "Average time spent at the site"
            }
            icon={Clock3}
            loading={dataLoading || sitesLoading}
          />
        </div>

        {hasNoAnalytics && !dataLoading && (
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-10 text-center">
            <Users className="mx-auto text-slate-400" size={28} />
            <h3 className="mt-3 font-semibold text-slate-900">
              No analytics available
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              There is no recorded activity for this site and time range.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {/* <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Occupancy over time
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Average occupancy per time bucket
                </p>
              </div>
              <Activity size={19} className="text-indigo-600" />
            </div>

            {dataLoading ? (
              <div className="mt-5 h-56 animate-pulse rounded-lg bg-slate-100" />
            ) : data?.occupancy.buckets.length ? (
              <div className="mt-5 space-y-3">
                <p className="text-sm text-slate-600">
                  {data.occupancy.buckets.length} data points received. Chart
                  visualization is the next step.
                </p>
              </div>
            ) : (
              <p className="mt-6 text-sm text-slate-500">
                Occupancy trend data is not available for this range.
              </p>
            )}
          </section> */}
          <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Occupancy over time
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Average occupancy per time bucket
                </p>
              </div>
              <Activity size={19} className="text-indigo-600" />
            </div>

            {dataLoading ? (
              <div className="mt-5 h-64 animate-pulse rounded-lg bg-slate-100" />
            ) : occupancyChartData.length > 0 ? (
              <div className="mt-5 h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={occupancyChartData}
                    margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={24}
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      width={48}
                      allowDecimals
                    />
                    <Tooltip
                      labelFormatter={(_, payload) =>
                        payload?.[0]?.payload?.local ?? ""
                      }
                      formatter={(value) => [
                        typeof value === "number"
                          ? formatNumber(value, 2)
                          : String(value),
                        "Average occupancy",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="avg"
                      name="Average occupancy"
                      stroke="#4f46e5"
                      fill="#818cf8"
                      fillOpacity={0.18}
                      strokeWidth={2}
                      connectNulls={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="mt-6 text-sm text-slate-500">
                Occupancy trend data is not available for this range.
              </p>
            )}
          </section>

          {/* <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Visitor demographics
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Male and female counts by hour
                </p>
              </div>
              <Users size={19} className="text-indigo-600" />
            </div>

            {dataLoading ? (
              <div className="mt-5 h-56 animate-pulse rounded-lg bg-slate-100" />
            ) : data?.demographics.buckets.length ? (
              <div className="mt-5 space-y-3">
                <p className="text-sm text-slate-600">
                  {data.demographics.buckets.length} data points received. Chart
                  visualization is the next step.
                </p>
              </div>
            ) : (
              <p className="mt-6 text-sm text-slate-500">
                Demographic data is not available for this range.
              </p>
            )}
          </section> */}
          <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Visitor demographics
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Male and female counts by time bucket
                </p>
              </div>
              <Users size={19} className="text-indigo-600" />
            </div>

            {dataLoading ? (
              <div className="mt-5 h-64 animate-pulse rounded-lg bg-slate-100" />
            ) : demographicsChartData.length > 0 ? (
              <div className="mt-5 h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={demographicsChartData}
                    margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={24}
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      width={48}
                    />
                    <Tooltip
                      labelFormatter={(_, payload) =>
                        payload?.[0]?.payload?.local ?? ""
                      }
                      formatter={(value, name) => [
                        typeof value === "number"
                          ? formatNumber(value)
                          : String(value),
                        String(name),
                      ]}
                    />
                    <Legend />
                    <Bar
                      dataKey="male"
                      name="Male"
                      fill="#4f46e5"
                      radius={[3, 3, 0, 0]}
                    />
                    <Bar
                      dataKey="female"
                      name="Female"
                      fill="#0d9488"
                      radius={[3, 3, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="mt-6 text-sm text-slate-500">
                Demographic data is not available for this range.
              </p>
            )}
          </section>
        </div>

        <p className="text-xs leading-5 text-slate-500">
          Analytics are provided by the connected API. Occupancy above
          represents the latest hourly average, not a live headcount.
          {selectedSite
            ? ` Times are reported for ${selectedSite.timezone}.`
            : ""}
        </p>
      </div>
    </div>
  );
}
