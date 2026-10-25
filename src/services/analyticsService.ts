import { apiRequest } from "@/services/api";
import type {
  Site,
  TimeRangeRequest,
  OccupancyResponse,
  FootfallResponse,
  DwellResponse,
  DemographicsResponse,
} from "@/types/analytics";

export function getSites(): Promise<Site[]> {
  return apiRequest<Site[]>("/api/sites");
}

export function getSiteById(siteId: string): Promise<Site> {
  return apiRequest<Site>(`/api/sites/${encodeURIComponent(siteId)}`);
}

export function getOccupancy(
  params: TimeRangeRequest,
): Promise<OccupancyResponse> {
  return apiRequest<OccupancyResponse>("/api/analytics/occupancy", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export function getFootfall(
  params: TimeRangeRequest,
): Promise<FootfallResponse> {
  return apiRequest<FootfallResponse>("/api/analytics/footfall", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export function getDwell(params: TimeRangeRequest): Promise<DwellResponse> {
  return apiRequest<DwellResponse>("/api/analytics/dwell", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export function getDemographics(
  params: TimeRangeRequest,
): Promise<DemographicsResponse> {
  return apiRequest<DemographicsResponse>("/api/analytics/demographics", {
    method: "POST",
    body: JSON.stringify(params),
  });
}
