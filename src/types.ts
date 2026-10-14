export interface Device {
  name: string;
  status: 'online' | 'offline';
  ip: string;
  type: 'router' | 'switch' | 'atm' | 'ups';
}

export type DeviceCategory = 'Router' | 'Switch' | 'Firewall' | 'Server' | 'Workstation' | 'Auto Detect';
export type DeviceStatusState = 'online' | 'warning' | 'offline' | 'unknown';
export type MonitoringProtocol = 'ICMP Ping' | 'HTTP/HTTPS Probe' | 'TCP Port Probe' | 'SNMP Poller' | 'Syslog Listener' | 'REST Telemetry';

export interface MonitoredDevice {
  id: string;
  branchId: string;
  branchName: string;
  name: string;
  description: string;
  ip: string;
  category: DeviceCategory;
  protocol: MonitoringProtocol;
  monitoringEnabled: boolean;
  monitoringInterval: number; // in seconds (default 10)
  consecutiveFailureThreshold: number; // default 3
  status: DeviceStatusState;
  lastSeen: string; // ISO / display string
  lastResponseStatus: string;
  failureCount: number;
  notes: string;
  currentIncidentId?: string | null;
  manualSimulatedOffline?: boolean; // For live demo simulation
  createdAt: string;
}

export interface DeviceTimelineEvent {
  id: string;
  deviceId: string;
  deviceName: string;
  timestamp: string;
  type: 'online' | 'warning' | 'offline' | 'incident_created' | 'telegram_sent' | 'acknowledged' | 'twilio_escalated' | 'restored' | 'closed';
  title: string;
  description: string;
  actor?: string;
  incidentId?: string | null;
}

export interface MonitoringHistoryRecord {
  id: string;
  deviceId: string;
  deviceName: string;
  timestamp: string;
  status: DeviceStatusState;
  responseResult: string;
  failureCount: number;
  incidentId?: string | null;
}

export interface AiIncidentAnalysis {
  incidentId: string;
  explanation: string;
  possibleRootCause: string;
  businessImpact: string;
  recommendedTroubleshooting: string[];
  confidenceScore: number; // e.g. 94
  analyzedAt: string;
}

export interface Branch {
  id: string;
  name: string;
  region: string;
  x: number; // visual percentage on SVG map (X: 0-100)
  y: number; // visual percentage on SVG map (Y: 0-100)
  lat: number;
  lng: number;
  status: 'online' | 'degraded' | 'offline';
  latency: number; // in ms
  uptime: number; // percentage
  devices: Device[];
  lastIncident: string;
  location: string;
}

export interface Alert {
  id: string;
  timestamp: string; // ISO string or format
  branchId: string;
  branchName: string;
  device: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  description: string;
  status: 'open' | 'acknowledged' | 'resolved';
}

export interface EscalationMilestone {
  step: 'telegram' | 'followup' | 'call' | 'manager';
  label: string;
  triggerMinutes: number;
  status: 'pending' | 'sent' | 'active';
  timestamp?: string;
}

export interface Incident {
  id: string;
  alertId: string;
  branchId: string;
  branchName: string;
  device: string;
  title: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  status: 'open' | 'acknowledged' | 'resolved';
  startTime: string; // ISO
  elapsedMinutes: number;
  escalationStep: 'none' | 'telegram' | 'followup' | 'call' | 'manager';
  milestones: EscalationMilestone[];
  notes?: string;
  restorationTime?: string;
  outageDurationFormatted?: string;
  aiAnalysis?: AiIncidentAnalysis;
}

export interface Message {
  id: string;
  sender: 'user' | 'giza';
  text: string;
  timestamp: string;
}

export interface DashboardState {
  branches: Branch[];
  alerts: Alert[];
  incidents: Incident[];
  stats: {
    onlineCount: number;
    degradedCount: number;
    offlineCount: number;
    slaUptime: number;
    activeIncidentsCount: number;
    mttrMinutes: number;
  };
}

