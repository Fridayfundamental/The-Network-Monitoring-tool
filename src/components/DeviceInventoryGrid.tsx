import { useState, useEffect } from 'react';
import { 
  Server, 
  ShieldAlert, 
  Cpu, 
  Activity, 
  Search, 
  User, 
  Layers, 
  Lock, 
  Camera, 
  TrendingUp, 
  Zap, 
  Eye, 
  DollarSign, 
  CheckCircle2, 
  XCircle, 
  Download,
  AlertTriangle,
  Plus,
  RefreshCw,
  Clock,
  Radio,
  Power,
  PowerOff,
  History,
  Info,
  Smartphone
} from 'lucide-react';
import { MonitoredDevice, DeviceTimelineEvent, MonitoringHistoryRecord } from '../types';
import DeviceOnboardingModal from './DeviceOnboardingModal';
import PhoneHeartbeatModal from './PhoneHeartbeatModal';
import DeviceDetailModal from './DeviceDetailModal';

interface AssetRecord {
  name: string;
  type: 'router' | 'switch' | 'atm' | 'ups';
  ip: string;
  mac: string;
  serial: string;
  rack: string;
  warranty: string;
  slaSupport: string;
  vendor: string;
}

interface SecurityLog {
  id: string;
  timestamp: string;
  sourceIP: string;
  targetDevice: string;
  threatType: string;
  actionTaken: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
}

interface AtmTerminal {
  id: string;
  name: string;
  location: string;
  cashLevel: number;
  status: 'online' | 'offline' | 'degraded';
  doorSensor: 'closed' | 'open';
  upsBattery: number;
  cctvStatus: 'recording' | 'offline' | 'motion_detected';
}

interface EngineerProfile {
  name: string;
  role: string;
  status: 'online' | 'active_incident' | 'offline';
  assignedTickets: number;
  avgResponseMins: number;
  region: string;
}

export default function DeviceInventoryGrid() {
  const [activeSubTab, setActiveSubTab] = useState<'monitoring' | 'timeline' | 'inventory' | 'atm_cctv' | 'soc' | 'engineers'>('monitoring');
  const [searchTerm, setSearchTerm] = useState('');
  const [showReportProgress, setShowReportProgress] = useState(false);
  const [reportProgress, setReportProgress] = useState(0);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [selectedPhoneDevice, setSelectedPhoneDevice] = useState<MonitoredDevice | null>(null);
  const [inspectedDevice, setInspectedDevice] = useState<MonitoredDevice | null>(null);

  // Backend Monitoring state
  const [devices, setDevices] = useState<MonitoredDevice[]>([]);
  const [timeline, setTimeline] = useState<DeviceTimelineEvent[]>([]);
  const [history, setHistory] = useState<MonitoringHistoryRecord[]>([]);
  const [monitoringStats, setMonitoringStats] = useState({
    totalDevices: 0,
    onlineDevices: 0,
    offlineDevices: 0,
    warningDevices: 0,
    unknownDevices: 0,
    overallHealthPercent: 100,
    lastMonitoringCycle: ''
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Fetch Live Monitoring Status from Backend
  const fetchMonitoringStatus = async () => {
    try {
      const res = await fetch('/api/monitoring/status');
      if (res.ok) {
        const data = await res.json();
        setDevices(data.devices || []);
        setTimeline(data.timeline || []);
        setHistory(data.history || []);
        if (data.stats) {
          setMonitoringStats(data.stats);
        }
      }
    } catch (err) {
      console.error("Failed to fetch monitoring status:", err);
    }
  };

  useEffect(() => {
    fetchMonitoringStatus();
    const interval = setInterval(fetchMonitoringStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  // Manual Trigger Simulation
  const handleToggleSimulation = async (device: MonitoredDevice) => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/monitoring/devices/${device.id}/toggle-simulation`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        setActionFeedback(data.message);
        setTimeout(() => setActionFeedback(null), 4000);
        await fetchMonitoringStatus();
      }
    } catch (err: any) {
      setActionFeedback(`Error: ${err.message}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Toggle Monitoring
  const handleToggleMonitoring = async (device: MonitoredDevice) => {
    try {
      const res = await fetch(`/api/monitoring/devices/${device.id}/toggle-monitoring`, {
        method: 'POST'
      });
      if (res.ok) {
        await fetchMonitoringStatus();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Static Assets Registry Data
  const assets: AssetRecord[] = [
    { name: 'Core Router AR-9001', type: 'router', ip: '10.211.1.1', mac: '00:1A:2B:3C:4D:5E', serial: 'SN-ASABB-9001A', rack: 'Rack A-Row 04', warranty: 'June 2029', slaSupport: 'Cisco Gold 24/7/4', vendor: 'Cisco Systems' },
    { name: 'Distribution Switch DS-901', type: 'switch', ip: '10.211.1.2', mac: '00:1A:2B:3C:4D:5F', serial: 'SN-ASABB-901D', rack: 'Rack A-Row 05', warranty: 'Nov 2028', slaSupport: 'Cisco Gold 24/7/4', vendor: 'Cisco Systems' },
    { name: 'Branch Router AR-4011', type: 'router', ip: '10.211.2.1', mac: '00:2A:3B:4C:5D:6E', serial: 'SN-ASABB-4011B', rack: 'Rack B-Row 01', warranty: 'Jan 2028', slaSupport: 'Cisco Silver 8/5/NBD', vendor: 'Cisco Systems' },
    { name: 'Branch Router AR-4012', type: 'router', ip: '10.211.3.1', mac: '00:3A:4B:5C:6D:7E', serial: 'SN-ASABB-4012C', rack: 'Rack C-Row 02', warranty: 'Feb 2028', slaSupport: 'Cisco Silver 8/5/NBD', vendor: 'Cisco Systems' },
    { name: 'Branch Router AR-3015', type: 'router', ip: '10.211.4.1', mac: '00:4A:5B:6C:7D:8E', serial: 'SN-ASABB-3015D', rack: 'Wall Cabin Ndola', warranty: 'Mar 2027', slaSupport: 'Huawei Enterprise Care', vendor: 'Huawei' },
    { name: 'Smart UPS Pro 5000', type: 'ups', ip: '10.211.1.100', mac: '00:1B:2C:3D:4E:5F', serial: 'SN-APC-5000U', rack: 'Rack A-Row 01', warranty: 'Dec 2027', slaSupport: 'Schneider Premier Partner', vendor: 'APC Schneider' },
    { name: 'Industrial UPS 10kVA', type: 'ups', ip: '10.211.7.100', mac: '00:5B:6C:7D:8E:9F', serial: 'SN-APC-10KVA', rack: 'Mine Powerhouse Solwezi', warranty: 'Oct 2030', slaSupport: 'Schneider Platinum Support', vendor: 'APC Schneider' }
  ];

  // SOC Threat Logs
  const securityLogs: SecurityLog[] = [
    { id: 'sec-801', timestamp: '12:05:44', sourceIP: '194.22.45.112', targetDevice: 'HQ FireGate Main', threatType: 'Rapid Port Scan', actionTaken: 'IP blacklisted for 24 hours', severity: 'WARNING' },
    { id: 'sec-802', timestamp: '11:58:10', sourceIP: '45.120.33.204', targetDevice: 'Ndola Branch Gateway', threatType: 'SSH Brute Force', actionTaken: 'Access blocked by Intrusion prevention', severity: 'CRITICAL' },
    { id: 'sec-803', timestamp: '11:42:15', sourceIP: '10.211.3.60', targetDevice: 'Kitwe Retail LAN', threatType: 'Suspicious DLL execution', actionTaken: 'Host quarantined by Sentinel Endpoint', severity: 'CRITICAL' },
    { id: 'sec-804', timestamp: '11:15:00', sourceIP: '196.4.110.5', targetDevice: 'Core Router AR-9001', threatType: 'SNMP Traverses Scan', actionTaken: 'Query rejected, community name mismatch', severity: 'INFO' }
  ];

  // ATM Terminals
  const atms: AtmTerminal[] = [
    { id: 'atm-lsk-01', name: 'Cairo Rd HQ ATM Terminal #1', location: 'ASABB House, Cairo Rd, Lusaka', cashLevel: 88, status: 'online', doorSensor: 'closed', upsBattery: 99, cctvStatus: 'recording' },
    { id: 'atm-lsk-02', name: 'Cairo Rd HQ ATM Terminal #2', location: 'ASABB House, Cairo Rd, Lusaka', cashLevel: 42, status: 'online', doorSensor: 'closed', upsBattery: 98, cctvStatus: 'recording' },
    { id: 'atm-ndl-01', name: 'Ndola Main President Ave Terminal', location: 'President Avenue, Ndola', cashLevel: 12, status: 'degraded', doorSensor: 'closed', upsBattery: 92, cctvStatus: 'motion_detected' },
    { id: 'atm-lvs-01', name: 'Livingstone Falls Resort ATM', location: 'Mosi-O-Tunya Rd, Livingstone', cashLevel: 0, status: 'offline', doorSensor: 'open', upsBattery: 45, cctvStatus: 'offline' },
    { id: 'atm-sol-01', name: 'Solwezi Mine Centre ATM', location: 'Kansanshi Mine Rd, Solwezi', cashLevel: 75, status: 'online', doorSensor: 'closed', upsBattery: 100, cctvStatus: 'recording' }
  ];

  // Engineers Roster
  const engineers: EngineerProfile[] = [
    { name: 'Friday Chansa Victor', role: 'Chief Network Architect & Operator', status: 'online', assignedTickets: 2, avgResponseMins: 9, region: 'Lusaka / Central-South' },
    { name: 'Mutale Kampamba', role: 'SLA Facilities & Power Specialist', status: 'active_incident', assignedTickets: 3, avgResponseMins: 14, region: 'Copperbelt Area' },
    { name: 'Mwansa Lungu', role: 'L2 Routing & SD-WAN Engineer', status: 'online', assignedTickets: 1, avgResponseMins: 12, region: 'Lusaka Area' },
    { name: 'Nawa Sipalo', role: 'Security & IPS Response Officer', status: 'offline', assignedTickets: 0, avgResponseMins: 18, region: 'Southern Region' }
  ];

  const triggerReportGenerator = () => {
    setShowReportProgress(true);
    setReportProgress(5);
    const interval = setInterval(() => {
      setReportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setShowReportProgress(false), 1500);
          return 100;
        }
        return prev + 15;
      });
    }, 200);
  };

  const filteredDevices = devices.filter(d =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.ip.includes(searchTerm) ||
    d.branchName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col gap-5 font-sans">
      
      {/* Top Banner & Onboarding Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm uppercase tracking-[0.15em] text-slate-800 font-extrabold flex items-center gap-2">
              <Layers className="h-4.5 w-4.5 text-[#DA0000]" />
              <span>SentinelNOC Native Device Monitoring Engine</span>
            </h3>
            <span className="text-[10px] font-mono font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
              v2 ACTIVE
            </span>
          </div>
          <p className="font-sans text-xs text-slate-500 mt-1">
            Continuous background health probing across ASABB Bank Zambia network endpoints with automatic incident creation, Telegram alerts, and Twilio voice escalations.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search devices, IPs, branches..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-xl bg-slate-50 pl-9 pr-3 py-2 font-sans text-xs text-slate-800 border border-slate-200 focus:border-[#DA0000] focus:outline-none w-52"
            />
          </div>

          <button
            onClick={() => setIsOnboardingOpen(true)}
            className="rounded-xl bg-[#DA0000] hover:bg-red-700 px-3.5 py-2 text-xs font-bold text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>ONBOARD DEVICE</span>
          </button>
        </div>
      </div>

      {/* Action feedback notification if any */}
      {actionFeedback && (
        <div className="flex items-center justify-between rounded-xl bg-slate-900 border border-red-500/30 p-3 text-xs font-mono text-slate-100 animate-fade-in">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-400 animate-pulse" />
            <span>{actionFeedback}</span>
          </div>
          <button onClick={() => setActionFeedback(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Executive Monitoring Summary Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
          <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-400 block">TOTAL MONITORED</span>
          <span className="text-lg font-black text-slate-900 mt-0.5 block">{monitoringStats.totalDevices}</span>
        </div>

        <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-xl p-3">
          <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-emerald-700 block">🟢 ONLINE</span>
          <span className="text-lg font-black text-emerald-800 mt-0.5 block">{monitoringStats.onlineDevices}</span>
        </div>

        <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-3">
          <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-amber-700 block">🟡 WARNING</span>
          <span className="text-lg font-black text-amber-800 mt-0.5 block">{monitoringStats.warningDevices}</span>
        </div>

        <div className="bg-red-50/50 border border-red-200/60 rounded-xl p-3">
          <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-red-700 block">🔴 OFFLINE</span>
          <span className="text-lg font-black text-red-800 mt-0.5 block">{monitoringStats.offlineDevices}</span>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
          <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-400 block">HEALTH SCORE</span>
          <span className="text-lg font-black text-slate-900 mt-0.5 block">{monitoringStats.overallHealthPercent}%</span>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-400 block">LAST MONITOR CYCLE</span>
          <span className="text-xs font-mono font-bold text-slate-700 mt-1 flex items-center gap-1">
            <Clock className="h-3 w-3 text-slate-400" />
            <span>{monitoringStats.lastMonitoringCycle || 'Just now'}</span>
          </span>
        </div>
      </div>

      {/* Explorer Tabs Selector */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-100 pb-2">
        <button
          onClick={() => setActiveSubTab('monitoring')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'monitoring' 
              ? 'bg-[#DA0000] text-white' 
              : 'text-slate-600 hover:text-slate-900 bg-slate-50 border border-slate-200'
          }`}
        >
          <Radio className="h-3.5 w-3.5" />
          <span>Live Device Health Engine ({filteredDevices.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('timeline')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'timeline' 
              ? 'bg-[#DA0000] text-white' 
              : 'text-slate-600 hover:text-slate-900 bg-slate-50 border border-slate-200'
          }`}
        >
          <History className="h-3.5 w-3.5" />
          <span>Device Health Timeline ({timeline.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('inventory')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'inventory' 
              ? 'bg-[#DA0000] text-white' 
              : 'text-slate-600 hover:text-slate-900 bg-slate-50 border border-slate-200'
          }`}
        >
          Hard Asset Registry ({assets.length})
        </button>

        <button
          onClick={() => setActiveSubTab('atm_cctv')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'atm_cctv' 
              ? 'bg-[#DA0000] text-white' 
              : 'text-slate-600 hover:text-slate-900 bg-slate-50 border border-slate-200'
          }`}
        >
          ATM & CCTV Watch ({atms.length})
        </button>

        <button
          onClick={() => setActiveSubTab('soc')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'soc' 
              ? 'bg-[#DA0000] text-white' 
              : 'text-slate-600 hover:text-slate-900 bg-slate-50 border border-slate-200'
          }`}
        >
          SOC Threat Center
        </button>

        <button
          onClick={() => setActiveSubTab('engineers')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'engineers' 
              ? 'bg-[#DA0000] text-white' 
              : 'text-slate-600 hover:text-slate-900 bg-slate-50 border border-slate-200'
          }`}
        >
          On-Call Roster
        </button>
      </div>

      {/* Main Tab Content */}
      <div>
        
        {/* SUBTAB 1: Live SentinelNOC Active Device Monitoring Grid */}
        {activeSubTab === 'monitoring' && (
          <div className="space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDevices.map((dev) => {
                const isOnline = dev.status === 'online';
                const isWarning = dev.status === 'warning';
                const isOffline = dev.status === 'offline';
                const isUnknown = dev.status === 'unknown';

                return (
                  <div
                    key={dev.id}
                    onClick={() => setInspectedDevice(dev)}
                    className={`rounded-2xl border p-4.5 transition-all shadow-sm flex flex-col justify-between gap-4 cursor-pointer hover:shadow-lg hover:border-slate-400 group relative ${
                      isOffline 
                        ? 'bg-red-50/30 border-red-300 ring-2 ring-red-500/20' 
                        : isWarning 
                        ? 'bg-amber-50/30 border-amber-300' 
                        : isUnknown
                        ? 'bg-slate-50 border-slate-200'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest">{dev.id}</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold uppercase">{dev.category}</span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm leading-tight group-hover:text-red-700 transition-colors flex items-center gap-1.5">
                          <span>{dev.name}</span>
                        </h4>
                        <p className="text-[11px] font-mono text-slate-500">{dev.branchName}</p>
                      </div>

                      {/* Status Badge */}
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border ${
                        isOnline ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        isWarning ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' :
                        isOffline ? 'bg-red-50 text-red-700 border-red-300 animate-bounce' :
                        'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        <span className={`h-2 w-2 rounded-full ${
                          isOnline ? 'bg-emerald-500' :
                          isWarning ? 'bg-amber-500' :
                          isOffline ? 'bg-red-600' : 'bg-slate-400'
                        }`} />
                        <span>{dev.status}</span>
                      </span>
                    </div>

                    {/* Probing Details */}
                    <div 
                      className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-2 text-xs font-mono group-hover:bg-slate-100/90 transition-all"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-[10px] uppercase font-bold">IP Endpoint</span>
                        <span className="text-slate-800 font-bold">{dev.ip}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-[10px] uppercase font-bold">Protocol</span>
                        <span className="text-slate-700 font-bold text-[10px]">{dev.protocol}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-[10px] uppercase font-bold">Health Checks</span>
                        <span className={`font-bold ${dev.failureCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {dev.failureCount} / {dev.consecutiveFailureThreshold} Failures
                        </span>
                      </div>

                      <div className="pt-1.5 border-t border-slate-200/60 text-[10px] text-slate-500 truncate flex justify-between items-center">
                        <span>Status: <strong className="text-slate-700">{dev.lastResponseStatus}</strong></span>
                        <span className="text-red-700 font-bold text-[9px] group-hover:underline">OPEN TELEMETRY & METRICS →</span>
                      </div>
                    </div>

                    {/* Active Incident Warning if offline */}
                    {isOffline && dev.currentIncidentId && (
                      <div className="flex items-center gap-2 bg-red-600 text-white p-2.5 rounded-xl text-xs font-mono font-bold shadow-sm animate-pulse">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-300" />
                        <span>INCIDENT #{dev.currentIncidentId} ACTIVE</span>
                      </div>
                    )}

                    {/* Controls & Live Simulation Override Button */}
                    <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                      <span className="text-[10px] font-mono text-slate-400">
                        Interval: {dev.monitoringInterval}s
                      </span>

                      <div className="flex items-center gap-1.5">
                        {/* Live Phone Telemetry Ping Link */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPhoneDevice(dev);
                          }}
                          className="px-2 py-1.5 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer flex items-center gap-1 bg-slate-900 text-slate-100 hover:bg-slate-800 border border-slate-800"
                          title="Open Real Phone Telemetry Link & Test Physical Power Off"
                        >
                          <Smartphone className="h-3 w-3 text-emerald-400" />
                          <span>PING</span>
                        </button>

                        {/* Simulation Toggle for Live Presentation */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSimulation(dev);
                          }}
                          className={`px-2 py-1.5 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer flex items-center gap-1 ${
                            dev.manualSimulatedOffline
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                              : 'bg-red-50 border border-red-200 text-red-700 hover:bg-red-100'
                          }`}
                          title="Simulate network disconnect or power cut for live demo"
                        >
                          {dev.manualSimulatedOffline ? (
                            <>
                              <Power className="h-3 w-3" />
                              <span>RESTORE</span>
                            </>
                          ) : (
                            <>
                              <PowerOff className="h-3 w-3 text-red-600" />
                              <span>OUTAGE</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* SUBTAB 2: Visual Device Health Timeline */}
        {activeSubTab === 'timeline' && (
          <div className="space-y-4">
            <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800">
              <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-300 flex items-center gap-2">
                <History className="h-4 w-4 text-[#DA0000]" />
                <span>SentinelNOC Visual Device Health Activity Feed</span>
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Real-time chronological events logging: Online ➔ Offline ➔ Incident Created ➔ Telegram Notification ➔ Engineer Acknowledged ➔ Twilio Escalation ➔ Service Restored ➔ Incident Closed.
              </p>
            </div>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {timeline.map((evt) => {
                const isOff = evt.type === 'offline' || evt.type === 'incident_created';
                const isRestored = evt.type === 'restored' || evt.type === 'online';
                const isTg = evt.type === 'telegram_sent' || evt.type === 'twilio_escalated';

                return (
                  <div key={evt.id} className="relative flex items-start gap-4">
                    <div className={`absolute -left-6 top-1 h-5 w-5 rounded-full border-2 bg-white flex items-center justify-center shrink-0 ${
                      isOff ? 'border-red-600 text-red-600' :
                      isRestored ? 'border-emerald-600 text-emerald-600' :
                      isTg ? 'border-amber-500 text-amber-500' :
                      'border-slate-400 text-slate-500'
                    }`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex-1 shadow-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                          <span>{evt.title}</span>
                          {evt.incidentId && (
                            <span className="font-mono text-[9px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-bold">
                              #{evt.incidentId}
                            </span>
                          )}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">{evt.timestamp}</span>
                      </div>

                      <p className="text-xs text-slate-600 mt-1 font-sans">{evt.description}</p>

                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-2 pt-2 border-t border-slate-200/60">
                        <span>Device: <strong>{evt.deviceName}</strong></span>
                        <span>Actor: <strong>{evt.actor || 'System'}</strong></span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SUBTAB 3: Hard Assets Inventory Grid */}
        {activeSubTab === 'inventory' && (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left font-sans text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-bold border-b border-slate-200 text-[10px] uppercase tracking-wider">
                  <th className="p-3">Device Name</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">IP Address</th>
                  <th className="p-3">MAC Address</th>
                  <th className="p-3">Serial Key</th>
                  <th className="p-3">SLA Contract</th>
                  <th className="p-3">Warranty</th>
                  <th className="p-3 text-right">Rack Pos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {assets.map((asset) => (
                  <tr key={asset.serial} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 text-slate-800 font-bold flex items-center gap-1.5">
                      <Server className="h-3.5 w-3.5 text-[#DA0000]" />
                      <span>{asset.name}</span>
                    </td>
                    <td className="p-3 text-slate-500 font-bold uppercase text-[9px]">{asset.type}</td>
                    <td className="p-3 text-slate-600 font-mono text-[10px]">{asset.ip}</td>
                    <td className="p-3 text-slate-400 font-mono text-[10px]">{asset.mac}</td>
                    <td className="p-3 text-slate-500 font-mono text-[10px]">{asset.serial}</td>
                    <td className="p-3 text-slate-700 font-bold text-[10px]">{asset.slaSupport}</td>
                    <td className="p-3 text-slate-500">{asset.warranty}</td>
                    <td className="p-3 text-slate-700 font-bold text-right text-[10px] font-mono">{asset.rack}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* SUBTAB 4: ATM and CCTV Watch */}
        {activeSubTab === 'atm_cctv' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {atms.map((atm) => {
              const isLowCash = atm.cashLevel < 30;
              const isOffline = atm.status === 'offline';
              
              return (
                <div 
                  key={atm.id} 
                  className={`rounded-2xl border p-4 shadow-sm flex flex-col justify-between gap-4 transition-all ${
                    isOffline 
                      ? 'bg-red-50/20 border-red-200' 
                      : isLowCash 
                      ? 'bg-amber-50/20 border-amber-200' 
                      : 'bg-slate-50/50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-mono text-[9px] text-slate-400 font-bold uppercase tracking-wider">{atm.id}</p>
                      <h4 className="font-sans text-xs font-black text-slate-800 mt-0.5">{atm.name}</h4>
                      <p className="text-[10px] text-slate-500 font-sans mt-0.5">{atm.location}</p>
                    </div>

                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-wider border ${
                      atm.status === 'online' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      atm.status === 'degraded' ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' :
                      'bg-red-50 text-red-700 border-red-200 animate-pulse'
                    }`}>
                      {atm.status}
                    </span>
                  </div>

                  <div className="space-y-1 bg-white border border-slate-200/60 rounded-xl p-3">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5 text-[#DA0000]" />
                        <span>Cash Cache</span>
                      </span>
                      <span className={`font-mono font-bold ${isLowCash ? 'text-[#DA0000]' : 'text-slate-800'}`}>
                        {atm.cashLevel === 0 ? 'CRITICAL DEPLETED' : `${atm.cashLevel}% Remaining`}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${isLowCash ? 'bg-[#DA0000]' : 'bg-emerald-500'}`} style={{ width: `${atm.cashLevel}%` }}></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                    <div className="bg-white border border-slate-200/60 rounded-xl p-2.5 flex flex-col justify-between">
                      <span className="text-slate-400 font-bold uppercase text-[8px]">UPS Battery</span>
                      <p className="font-bold text-slate-800 mt-1">{atm.upsBattery}% Charge</p>
                      <div className="h-1 w-full bg-slate-100 rounded-full mt-1.5">
                        <div className="h-full bg-emerald-500" style={{ width: `${atm.upsBattery}%` }}></div>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200/60 rounded-xl p-2.5 flex flex-col justify-between">
                      <span className="text-slate-400 font-bold uppercase text-[8px]">CCTV Feed</span>
                      <p className="font-bold text-slate-800 mt-1 flex items-center gap-1">
                        <Camera className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="uppercase text-[9px]">{atm.cctvStatus.replace("_", " ")}</span>
                      </p>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* SUBTAB 5: SOC Threat Center */}
        {activeSubTab === 'soc' && (
          <div className="space-y-4">
            <div className="bg-slate-900 text-slate-100 rounded-2xl p-4.5 flex flex-col md:flex-row items-center justify-between gap-4 border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center">
                  <Lock className="h-5 w-5 text-red-500 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-sans font-bold text-xs">ASABB Zambian SOC Firewall Registry</h4>
                  <p className="font-mono text-[9px] text-slate-400">Threat blocks mapped to Level 3 IPS core filters</p>
                </div>
              </div>

              <div className="flex items-center gap-6 text-[10px] font-mono font-bold">
                <span>Failed Logins (24h): <b className="text-[#DA0000]">0.02% (Low)</b></span>
                <span>Active VPN Tunnels: <b className="text-emerald-400">84 Secure</b></span>
                <span>IPS Block Index: <b className="text-purple-400">14,212 Blocks</b></span>
              </div>
            </div>

            <div className="space-y-2">
              {securityLogs.map((log) => (
                <div 
                  key={log.id} 
                  className={`rounded-xl border p-3 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                    log.severity === 'CRITICAL' 
                      ? 'bg-red-50/20 border-red-200' 
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`h-2 w-2 rounded-full shrink-0 ${log.severity === 'CRITICAL' ? 'bg-[#DA0000]' : 'bg-amber-500'}`} />
                    <div className="text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[9px] text-slate-400 font-bold">#{log.id}</span>
                        <span className="font-mono text-[9px] font-bold text-slate-500">Source: {log.sourceIP}</span>
                      </div>
                      <p className="font-sans font-black text-slate-800 mt-1">{log.threatType}</p>
                      <p className="text-[10px] text-slate-500 font-sans mt-0.5">Target Node: {log.targetDevice}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-start md:self-auto text-right font-mono text-[10px]">
                    <div>
                      <p className="text-slate-400 uppercase text-[8px] font-bold">Mitigation</p>
                      <p className="text-emerald-700 font-bold mt-0.5">{log.actionTaken}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBTAB 6: On-Call Roster */}
        {activeSubTab === 'engineers' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {engineers.map((eng) => (
              <div key={eng.name} className="bg-slate-50/50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="h-9 w-9 rounded-xl bg-[#DA0000]/5 border border-[#DA0000]/10 flex items-center justify-center text-slate-600">
                    <User className="h-5 w-5" />
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-wider border ${
                    eng.status === 'online' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    eng.status === 'active_incident' ? 'bg-red-50 text-red-700 border-red-200 animate-pulse' :
                    'bg-slate-100 text-slate-500 border-slate-200'
                  }`}>
                    {eng.status === 'active_incident' ? 'DISPATCHED' : eng.status}
                  </span>
                </div>

                <div>
                  <h4 className="font-sans text-xs font-black text-slate-900">{eng.name}</h4>
                  <p className="font-sans text-[10px] text-slate-500 mt-0.5">{eng.role}</p>
                  <p className="font-mono text-[8px] text-[#DA0000] uppercase tracking-widest mt-1 font-bold">{eng.region}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-2 font-mono text-[10px]">
                  <div>
                    <p className="text-[8px] text-slate-400 font-bold uppercase">LOAD</p>
                    <p className="font-bold text-slate-800">{eng.assignedTickets} Active</p>
                  </div>
                  <div>
                    <p className="text-[8px] text-slate-400 font-bold uppercase">MTTR</p>
                    <p className="font-bold text-slate-800">{eng.avgResponseMins} Mins</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Onboarding Modal */}
      <DeviceOnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onDeviceCreated={fetchMonitoringStatus}
      />

      {/* Phone Live Telemetry Modal */}
      <PhoneHeartbeatModal
        isOpen={!!selectedPhoneDevice}
        onClose={() => setSelectedPhoneDevice(null)}
        device={selectedPhoneDevice}
        onToggleSimulation={handleToggleSimulation}
      />

      {/* Device Inspector & SNMP Telemetry Modal */}
      <DeviceDetailModal
        isOpen={!!inspectedDevice}
        onClose={() => setInspectedDevice(null)}
        device={inspectedDevice}
        onToggleSimulation={handleToggleSimulation}
        onTriggerVoiceCall={(dev) => {
          fetch('/api/twilio/call', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: `Emergency Alert from Sentinel NOC for device ${dev.name} at ${dev.branchName}. Immediate engineer intervention required.`
            })
          }).catch(console.error);
        }}
      />

    </div>
  );
}
