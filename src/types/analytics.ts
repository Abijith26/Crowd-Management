export interface SiteZone {
  zoneId: string;
  name: string;
  securityLevel: "high" | "medium" | "low";
}

export interface Site {
  siteId: string;
  name: string;
  city: string;
  country: string;
  timezone: string;
  zones: SiteZone[];
}

export interface TimeRangeRequest {
  siteId: string;
  fromUtc: number;
  toUtc: number;
}

export interface OccupancyBucket {
  utc: number;
  local: string;
  avg: number;
}

export interface OccupancyResponse extends TimeRangeRequest {
  timezone: string;
  buckets: OccupancyBucket[];
}

export interface FootfallResponse extends TimeRangeRequest {
  footfall: number;
}

export interface DwellResponse extends TimeRangeRequest {
  avgDwellMinutes: number;
  dwellRecords: number;
}

export interface DemographicsBucket {
  utc: number;
  local: string;
  male: number;
  female: number;
}

export interface DemographicsResponse extends TimeRangeRequest {
  timezone: string;
  buckets: DemographicsBucket[];
}
