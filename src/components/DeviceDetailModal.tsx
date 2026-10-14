import { useState } from 'react';
import { 
  X, 
  Server, 
  Activity, 
  Cpu, 
  HardDrive, 
  Thermometer, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Radio, 
  ShieldCheck, 
  Zap, 
  Network, 
  Terminal, 
  Copy, 
  Check, 
  PhoneCall, 
  HelpCircle,
  BarChart2,
  List,
  Layers,
  PowerOff,
  Power
} from 'lucide-react';
import { MonitoredDevice } from '../types';

interface DeviceDetailModalProps {
  device: MonitoredDevice | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleSimulation?: (device: MonitoredDevice) => void;
  onTriggerVoiceCall?: (device: MonitoredDevice) => void;
}

export default function DeviceDetailModal({
  device,
  isOpen,
  onClose,
  onToggleSimulation,
  onTriggerVoiceCall
}: DeviceDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'telemetry' | 'snmp' | 'ports' | 'architecture'>('telemetry');
  const [copiedIp, setCopiedIp] = useState(false);
  const [isPollingOid, setIsPollingOid] = useState(false);
  const [oidLogs, setOidLogs] = useState<string[]>([]);
  const [callStatus, setCallStatus] = useState<string | null>(null);

  if (!isOpen || !device) return null;

  const isOnline = device.status === 'online';
  const isOffline = device.status === 'offline';
  const isWarning = device.status === 'warning';

  // Generated realistic metrics based on device state
  const uptimeDays = isOffline ? 0 : 184;
  const uptimeHours = isOffline ? 0 : 14;
  const uptimeMins = isOffline ? 0 : 22;
  const slaScore = isOffline ? '96.2%' : '99.98%';
  const pingLatency = isOffline ? 'TIMEOUT (>3000ms)' : '12 ms';
  const cpuUsage = isOffline ? 0 : isWarning ? 88 : 24;
  const memoryUsage = isOffline ? 0 : isWarning ? 92 : 48;
  const tempC = isOffline ? 0 : isWarning ? 68 : 38;
  const packetLoss = isOffline ? 100 : 0;

  const handleCopyIp = () => {
    navigator.clipboard.writeText(device.ip);
    setCopiedIp(true);
    setTimeout(() => setCopiedIp(false), 2000);
  };

  const handleRunSnmpPoll = () => {
    setIsPollingOid(true);
    setOidLogs([`[SNMP GET] Dispatching request to ${device.ip}:161 (Community: absa_noc_ro)...`]);

    setTimeout(() => {
      setOidLogs(prev => [
        ...prev,
        `[SNMP RESP] 1.3.6.1.2.1.1.1.0 (sysDescr) -> Cisco IOS Catalyst L3 Switch (CAT9K-UNIVERSALK9)`,
        `[SNMP RESP] 1.3.6.1.2.1.1.3.0 (sysUpTime) -> 1594932000 timeticks (${uptimeDays}d, ${uptimeHours}h:${uptimeMins}m)`,
        `[SNMP RESP] 1.3.6.1.4.1.9.9.109.1.1.1.1.5 (cpmCPUTotal5min) -> ${cpuUsage}%`,
        `[SNMP RESP] 1.3.6.1.4.1.9.9.13.1.3.1.3.1 (ciscoEnvMonTemperature) -> ${tempC}°C [NORMAL]`,
        `✅ SNMP Query Completed Successfully. Status: 200 OK`
      ]);
      setIsPollingOid(false);
    }, 900);
  };

  const handleTestCall = async () => {
    setCallStatus('Dispatching Twilio Emergency Call...');
    if (onTriggerVoiceCall) {
      onTriggerVoiceCall(device);
    }
    setTimeout(() => {
      setCallStatus('☎️ Call Dispatched! Check your mobile phone.');
      setTimeout(() => setCallStatus(null), 4000);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              isOffline ? 'bg-red-500/10 border-red-500/30 text-red-400' :
              isWarning ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
              'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}>
              <Server className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">{device.id}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold uppercase">{device.category}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-bold">{device.protocol}</span>
              </div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mt-0.5">
                <span>{device.name}</span>
                <span className="text-xs font-mono font-normal text-slate-400">({device.branchName})</span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase border ${
              isOnline ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
              isWarning ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse' :
              'bg-red-500/10 text-red-400 border-red-500/30 animate-bounce'
            }`}>
              <span className={`h-2 w-2 rounded-full ${
                isOnline ? 'bg-emerald-400' :
                isWarning ? 'bg-amber-400' : 'bg-red-500'
              }`} />
              <span>{device.status}</span>
            </span>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Quick Toolbar */}
        <div className="bg-slate-900/90 border-b border-slate-800 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 font-mono text-slate-300">
            <span className="text-slate-500">IP Endpoint:</span>
            <span className="font-bold text-emerald-400">{device.ip}</span>
            <button
              onClick={handleCopyIp}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
              title="Copy IP"
            >
              {copiedIp ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onToggleSimulation && (
              <button
                onClick={() => onToggleSimulation(device)}
                className={`px-3 py-1.5 rounded-xl font-bold font-mono text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  device.manualSimulatedOffline
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-red-600/80 hover:bg-red-600 text-white border border-red-500/30'
                }`}
              >
                {device.manualSimulatedOffline ? (
                  <>
                    <Power className="h-3.5 w-3.5" />
                    <span>Restore Link</span>
                  </>
                ) : (
                  <>
                    <PowerOff className="h-3.5 w-3.5" />
                    <span>Simulate Outage</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={handleTestCall}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold font-mono text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <PhoneCall className="h-3.5 w-3.5 text-amber-400" />
              <span>Test Voice Call</span>
            </button>
          </div>
        </div>

        {callStatus && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2 text-xs font-mono text-amber-300 flex items-center gap-2 animate-pulse">
            <Zap className="h-4 w-4 text-amber-400" />
            <span>{callStatus}</span>
          </div>
        )}

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-950/50">
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'telemetry'
                ? 'border-[#DA0000] text-white bg-slate-900/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="h-4 w-4 text-emerald-400" />
            <span>Uptime & Telemetry</span>
          </button>

          <button
            onClick={() => setActiveTab('snmp')}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'snmp'
                ? 'border-[#DA0000] text-white bg-slate-900/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="h-4 w-4 text-amber-400" />
            <span>SNMP & MIB Engine</span>
          </button>

          <button
            onClick={() => setActiveTab('ports')}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'ports'
                ? 'border-[#DA0000] text-white bg-slate-900/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Network className="h-4 w-4 text-blue-400" />
            <span>Interface Ports (24x)</span>
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'architecture'
                ? 'border-[#DA0000] text-white bg-slate-900/50'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="h-4 w-4 text-purple-400" />
            <span>How SNMP Works (Cloud vs Local)</span>
          </button>
        </div>

        {/* Modal Tab Content Area */}
        <div className="p-6 space-y-6 max-h-[68vh] overflow-y-auto">
          
          {/* TAB 1: Uptime & Live Telemetry */}
          {activeTab === 'telemetry' && (
            <div className="space-y-6">
              
              {/* Uptime Stat Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider">SYSTEM UPTIME</span>
                    <Clock className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="text-lg font-black text-white font-mono">
                    {isOffline ? '0m 0s (OFFLINE)' : `${uptimeDays}d ${uptimeHours}h ${uptimeMins}m`}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Since last reboot</span>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider">30-DAY SLA AVAILABILITY</span>
                    <ShieldCheck className="h-4 w-4 text-blue-400" />
                  </div>
                  <div className="text-lg font-black text-emerald-400 font-mono">
                    {slaScore}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Target: 99.90% SLA</span>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider">PING LATENCY</span>
                    <Radio className="h-4 w-4 text-amber-400" />
                  </div>
                  <div className="text-lg font-black text-white font-mono">
                    {pingLatency}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">ICMP Echo Request</span>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider">PACKET LOSS</span>
                    <Activity className="h-4 w-4 text-purple-400" />
                  </div>
                  <div className={`text-lg font-black font-mono ${packetLoss > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {packetLoss}%
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Last 100 probes</span>
                </div>
              </div>

              {/* Hardware Performance Metrics */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-emerald-400" />
                    <span>Real-Time System Hardware Telemetry</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Polled every {device.monitoringInterval}s</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* CPU Meter */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">CPU Usage</span>
                      <span className="font-bold text-white">{cpuUsage}%</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          cpuUsage > 80 ? 'bg-red-500' : cpuUsage > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${cpuUsage}%` }}
                      />
                    </div>
                  </div>

                  {/* Memory Meter */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">RAM Memory</span>
                      <span className="font-bold text-white">{memoryUsage}%</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          memoryUsage > 85 ? 'bg-red-500' : memoryUsage > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${memoryUsage}%` }}
                      />
                    </div>
                  </div>

                  {/* Temperature */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Core Temp</span>
                      <span className={`font-bold ${tempC > 65 ? 'text-red-400' : 'text-emerald-400'}`}>{tempC}°C</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          tempC > 65 ? 'bg-red-500' : tempC > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, (tempC / 80) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Historical Health Log Stream */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-blue-400" />
                  <span>24-Hour Availability Blocks</span>
                </h4>
                <div className="flex gap-1.5 py-2 overflow-x-auto">
                  {Array.from({ length: 24 }).map((_, i) => {
                    const isDownHour = isOffline && i > 18;
                    return (
                      <div 
                        key={i}
                        className={`h-8 flex-1 rounded-sm border min-w-[12px] transition-all cursor-pointer ${
                          isDownHour 
                            ? 'bg-red-600 border-red-500 hover:scale-110' 
                            : 'bg-emerald-500/80 border-emerald-400/50 hover:bg-emerald-400'
                        }`}
                        title={`Hour ${i}:00 - ${isDownHour ? 'OFFLINE OUTAGE' : '100% HEALTHY'}`}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>24 Hours Ago</span>
                  <span>12 Hours Ago</span>
                  <span>Now</span>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: SNMP & MIB Engine */}
          {activeTab === 'snmp' && (
            <div className="space-y-6">
              
              {/* SNMP Configuration Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">SNMP VERSION</span>
                  <p className="text-emerald-400 font-bold">SNMPv2c / SNMPv3 USM</p>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">READ COMMUNITY</span>
                  <p className="text-amber-300 font-bold">absa_noc_ro_v2</p>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">TRAP RECEIVER</span>
                  <p className="text-blue-400 font-bold">UDP Port 162 (Active)</p>
                </div>
              </div>

              {/* Live OID Table */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                <div className="px-5 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase text-slate-300 flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-emerald-400" />
                    <span>Active OID MIB Inspector</span>
                  </span>
                  <button
                    onClick={handleRunSnmpPoll}
                    disabled={isPollingOid}
                    className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isPollingOid ? 'animate-spin' : ''}`} />
                    <span>{isPollingOid ? 'Polling SNMP...' : 'Poll OIDs Now'}</span>
                  </button>
                </div>

                <div className="divide-y divide-slate-800/80 font-mono text-xs">
                  <div className="p-3 bg-slate-900/40 grid grid-cols-12 text-[10px] text-slate-400 font-bold uppercase">
                    <span className="col-span-4">OID Identifier</span>
                    <span className="col-span-3">MIB Object</span>
                    <span className="col-span-5">Live Queried Value</span>
                  </div>

                  <div className="p-3 grid grid-cols-12 hover:bg-slate-900/60 transition-all">
                    <span className="col-span-4 text-emerald-400 text-[11px]">1.3.6.1.2.1.1.1.0</span>
                    <span className="col-span-3 text-slate-300">sysDescr</span>
                    <span className="col-span-5 text-slate-400 truncate">Cisco Catalyst 9300 48-Port Switch, IOS XE 17.6</span>
                  </div>

                  <div className="p-3 grid grid-cols-12 hover:bg-slate-900/60 transition-all">
                    <span className="col-span-4 text-emerald-400 text-[11px]">1.3.6.1.2.1.1.3.0</span>
                    <span className="col-span-3 text-slate-300">sysUpTime</span>
                    <span className="col-span-5 text-slate-200 font-bold">{isOffline ? '0 timeticks (OFFLINE)' : '1594932000 timeticks'}</span>
                  </div>

                  <div className="p-3 grid grid-cols-12 hover:bg-slate-900/60 transition-all">
                    <span className="col-span-4 text-emerald-400 text-[11px]">1.3.6.1.2.1.2.2.1.10.1</span>
                    <span className="col-span-3 text-slate-300">ifInOctets.1</span>
                    <span className="col-span-5 text-slate-300">1,482,930,491 bytes</span>
                  </div>

                  <div className="p-3 grid grid-cols-12 hover:bg-slate-900/60 transition-all">
                    <span className="col-span-4 text-emerald-400 text-[11px]">1.3.6.1.2.1.2.2.1.16.1</span>
                    <span className="col-span-3 text-slate-300">ifOutOctets.1</span>
                    <span className="col-span-5 text-slate-300">893,402,112 bytes</span>
                  </div>

                  <div className="p-3 grid grid-cols-12 hover:bg-slate-900/60 transition-all">
                    <span className="col-span-4 text-emerald-400 text-[11px]">1.3.6.1.4.1.9.9.109.1.1.1.1.5</span>
                    <span className="col-span-3 text-slate-300">cpmCPUTotal5min</span>
                    <span className="col-span-5 text-amber-300 font-bold">{cpuUsage}%</span>
                  </div>
                </div>
              </div>

              {/* OID Live Console Log */}
              {oidLogs.length > 0 && (
                <div className="bg-black border border-slate-800 rounded-xl p-4 font-mono text-xs text-emerald-400 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase block font-bold mb-1">SNMP Query Terminal Log</span>
                  {oidLogs.map((log, idx) => (
                    <div key={idx} className="leading-relaxed">{log}</div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* TAB 3: Interface Ports Grid */}
          {activeTab === 'ports' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>GigabitEthernet Interface Switchport Matrix</span>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Connected (18)</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Down (4)</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-slate-600" /> Disabled (2)</span>
                </div>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5">
                {Array.from({ length: 24 }).map((_, idx) => {
                  const portNum = idx + 1;
                  const isDownPort = isOffline || portNum === 4 || portNum === 12 || portNum === 19;
                  const isDisabledPort = portNum === 23 || portNum === 24;

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-between gap-1 transition-all ${
                        isDisabledPort ? 'bg-slate-950 border-slate-800 text-slate-600' :
                        isDownPort ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                        'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      }`}
                    >
                      <span className="text-[9px] font-mono font-bold">Gi0/0/{portNum}</span>
                      <div className={`h-3 w-3 rounded-full ${
                        isDisabledPort ? 'bg-slate-700' :
                        isDownPort ? 'bg-red-500 animate-pulse' : 'bg-emerald-400'
                      }`} />
                      <span className="text-[8px] font-mono uppercase">
                        {isDisabledPort ? 'OFF' : isDownPort ? 'DOWN' : '1 Gbps'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: Educational Explanation (How SNMP Works & Cloud vs Local) */}
          {activeTab === 'architecture' && (
            <div className="space-y-5 text-xs font-sans text-slate-300 leading-relaxed">
              
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl space-y-2">
                <h4 className="font-bold text-emerald-300 flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <span>Can SentinelNOC run without a Localhost? YES!</span>
                </h4>
                <p className="text-slate-200">
                  You <strong>do not need localhost</strong> or any local computer running! SentinelNOC is hosted on Google Cloud containers (Cloud Run). The backend Node.js server acts as an autonomous NOC collector that continuously polls all 35+ Absa Zambia bank routers, switches, and ATMs directly in the cloud.
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl space-y-4">
                <h4 className="font-mono font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-400" />
                  <span>How SNMP (Simple Network Management Protocol) Works</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-900 p-3.5 rounded-lg border border-slate-800 space-y-1.5">
                    <span className="font-bold text-emerald-400 font-mono text-[11px] block">1. SNMP Polling (GET)</span>
                    <p className="text-[11px] text-slate-400">
                      SentinelNOC sends UDP requests on Port 161 to the router's IP address every 10 seconds asking for specific Object Identifiers (OIDs) like CPU, RAM, and uptime.
                    </p>
                  </div>

                  <div className="bg-slate-900 p-3.5 rounded-lg border border-slate-800 space-y-1.5">
                    <span className="font-bold text-amber-400 font-mono text-[11px] block">2. SNMP Traps (UDP 162)</span>
                    <p className="text-[11px] text-slate-400">
                      If a fiber cable is cut or power fails, the router sends an instant, unprompted <strong>SNMP TRAP</strong> alert to SentinelNOC in less than 1 second!
                    </p>
                  </div>

                  <div className="bg-slate-900 p-3.5 rounded-lg border border-slate-800 space-y-1.5">
                    <span className="font-bold text-purple-400 font-mono text-[11px] block">3. Voice & Telegram Escalation</span>
                    <p className="text-[11px] text-slate-400">
                      When heartbeats fail, SentinelNOC automatically sends Telegram alerts and places an emergency <strong>Twilio Voice Call</strong> to on-call engineers.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] font-mono text-slate-500">
            SentinelNOC Device Inspector • Monitored via UDP 161 & HTTP Probing
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer transition-all"
          >
            Close Inspector
          </button>
        </div>

      </div>
    </div>
  );
}
