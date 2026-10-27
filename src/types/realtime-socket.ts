export type RealtimeConnectionStatus =
  | "disabled"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export interface GenderCount {
  male: number;
  female: number;
}

export interface LiveOccupancyPayload {
  ts: number;
  siteId: string;
  siteOccupancy: number;
  zoneId: string;
  zoneOccupancy: number;
  genderCount: GenderCount;
}

export interface RealtimeAlertPayload {
  ts: number;
  eventId: string;
  direction: "entry" | "exit" | string;
  personName: string;
  severity: "high" | "medium" | "low" | string;
  zoneName: string;
  zoneId: string;
  siteName: string;
  siteId: string;
  personId: string;
}

export interface RealtimeHandlers {
  onStatusChange?: (status: RealtimeConnectionStatus) => void;
  onLiveOccupancy?: (payload: LiveOccupancyPayload) => void;
  onAlert?: (payload: RealtimeAlertPayload) => void;
}
