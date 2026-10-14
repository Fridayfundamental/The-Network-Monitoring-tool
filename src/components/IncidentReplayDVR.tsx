import { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  FastForward, 
  Activity, 
  AlertTriangle, 
  MessageSquare, 
  PhoneCall, 
  Clock, 
  ShieldCheck, 
  Server,
  Zap,
  UserCheck,
  TrendingDown
} from 'lucide-react';

export interface ReplayEvent {
  minute: number;
  timeLabel: string;
  title: string;
  desc: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO' | 'RESOLVED';
  iconType: 'outage' | 'alert' | 'telegram' | 'engineer' | 'ivr' | 'email' | 'resolve';
  metricLatency: number;
  metricPacketLoss: number;
  metricBwDown: number; // in Mbps
}

interface IncidentReplayDVRProps {
  onSimulateOutage?: (scenario: 'fiber_cut' | 'cyber_intrusion' | 'atm_blackout') => void;
  onRestoreAll?: () => void;
}

export default function IncidentReplayDVR({ onSimulateOutage, onRestoreAll }: IncidentReplayDVRProps) {
  // Scenario Events Definitions
  const fiberCutEvents: ReplayEvent[] = [
    { minute: 0, timeLabel: "14:23:00", title: "Trunk SD-WAN Link Down", desc: "Primary Copperbelt backbone fiber sheared by roadworks near Ndola.", severity: 'CRITICAL', iconType: 'outage', metricLatency: 8, metricPacketLoss: 0, metricBwDown: 100 },
    { minute: 1, timeLabel: "14:24:00", title: "Packet Loss Spike (100%)", desc: "Ndola and Kitwe branches lost core tunnel visibility; traffic flatlines.", severity: 'CRITICAL', iconType: 'outage', metricLatency: 450, metricPacketLoss: 100, metricBwDown: 0 },
    { minute: 2.5, timeLabel: "14:25:30", title: "SentinelNOC Alarm Triggered", desc: "Critical warning broadcast to operations center. Giza AI launches root-cause audit.", severity: 'CRITICAL', iconType: 'alert', metricLatency: 480, metricPacketLoss: 100, metricBwDown: 0 },
    { minute: 4, timeLabel: "14:27:00", title: "Telegram Dispatch Dispatched", desc: "Escalation pipeline dispatched Telegram alerts to Level 2 On-Call array.", severity: 'INFO', iconType: 'telegram', metricLatency: 500, metricPacketLoss: 100, metricBwDown: 0 },
    { minute: 5.5, timeLabel: "14:28:30", title: "L2 Duty Engineer Dispatched", desc: "Operator Friday acknowledged alert. LTE backup tunneling manually initialized.", severity: 'INFO', iconType: 'engineer', metricLatency: 280, metricPacketLoss: 15, metricBwDown: 8 },
    { minute: 7, timeLabel: "14:30:00", title: "IVR Emergency Call Initiated", desc: "Automated IVR call dispatched to Copperbelt regional SLA controller.", severity: 'WARNING', iconType: 'ivr', metricLatency: 140, metricPacketLoss: 10, metricBwDown: 12 },
    { minute: 8.5, timeLabel: "14:31:30", title: "Secondary Micro Link Switched", desc: "Microwave link switchover completed successfully. 100% core integrity restored.", severity: 'RESOLVED', iconType: 'resolve', metricLatency: 28, metricPacketLoss: 0, metricBwDown: 85 },
    { minute: 10, timeLabel: "14:33:00", title: "Incident Closed & Logged", desc: "SLA compliance threshold maintained. Audit trails archived securely.", severity: 'RESOLVED', iconType: 'resolve', metricLatency: 22, metricPacketLoss: 0, metricBwDown: 100 }
  ];

  const cyberIntrusionEvents: ReplayEvent[] = [
    { minute: 0, timeLabel: "03:10:00", title: "Abnormal Gateway Port Scan", desc: "Suspect external IP range performing rapid TCP sweeps on Port 443 at HQ.", severity: 'WARNING', iconType: 'alert', metricLatency: 9, metricPacketLoss: 0, metricBwDown: 99 },
    { minute: 2, timeLabel: "03:12:00", title: "Firewall Attack Blocks Triggered", desc: "Cisco IPS registers 2,400 concurrent failed session queries. System flags intrusion.", severity: 'CRITICAL', iconType: 'outage', metricLatency: 42, metricPacketLoss: 5, metricBwDown: 95 },
    { minute: 4, timeLabel: "03:14:00", title: "Automated Incident Logging", desc: "SentinelNOC engine generates isolation tickets and locks suspect IP subnets.", severity: 'CRITICAL', iconType: 'alert', metricLatency: 44, metricPacketLoss: 2, metricBwDown: 90 },
    { minute: 6, timeLabel: "03:16:00", title: "Security Team Telegram Ping", desc: "Security dispatch channel notified. NOC Operator Victor assigned to investigate.", severity: 'INFO', iconType: 'telegram', metricLatency: 24, metricPacketLoss: 0, metricBwDown: 98 },
    { minute: 8, timeLabel: "03:18:00", title: "Threat Fully Isolated", desc: "External IPs blacklisted across ABSA firewalls. Traffic metrics returned to baseline.", severity: 'RESOLVED', iconType: 'resolve', metricLatency: 8, metricPacketLoss: 0, metricBwDown: 100 },
    { minute: 10, timeLabel: "03:20:00", title: "Audit Log Filed", desc: "Security posture verified. Compliance score validated at 100%.", severity: 'RESOLVED', iconType: 'resolve', metricLatency: 8, metricPacketLoss: 0, metricBwDown: 100 }
  ];

  const atmBlackoutEvents: ReplayEvent[] = [
    { minute: 0, timeLabel: "19:40:00", title: "Livingstone Hub Grid Outage", desc: "Mosi-O-Tunya national grid feeder oscillates, resulting in local grid collapse.", severity: 'WARNING', iconType: 'alert', metricLatency: 28, metricPacketLoss: 0, metricBwDown: 100 },
    { minute: 2, timeLabel: "19:42:00", title: "Branch UPS Power Active", desc: "Critical backup system engaged. Generator diesel starter counts down.", severity: 'CRITICAL', iconType: 'outage', metricLatency: 110, metricPacketLoss: 2, metricBwDown: 98 },
    { minute: 4, timeLabel: "19:44:00", title: "ATM Terminal Drop Alert", desc: "Falls Resort ATM triggers safe-door lock and UPS battery power telemetry warning.", severity: 'CRITICAL', iconType: 'alert', metricLatency: 240, metricPacketLoss: 20, metricBwDown: 50 },
    { minute: 6, timeLabel: "19:46:00", title: "Level 1 Dispatch Broadcast", desc: "Slack SMS dispatches fired to Livingstone facilities engineers.", severity: 'INFO', iconType: 'telegram', metricLatency: 190, metricPacketLoss: 12, metricBwDown: 65 },
    { minute: 8, timeLabel: "19:48:00", title: "Diesel Gen Startup Confirmed", desc: "Generator fuel injector cycles. Local branch mini-grid fully powered.", severity: 'RESOLVED', iconType: 'resolve', metricLatency: 35, metricPacketLoss: 0, metricBwDown: 98 },
    { minute: 10, timeLabel: "19:50:00", title: "ATM Connection Re-synced", desc: "ATM terminal cash and vault modules fully online on local backup supply.", severity: 'RESOLVED', iconType: 'resolve', metricLatency: 28, metricPacketLoss: 0, metricBwDown: 100 }
  ];

  // State Management
  const [selectedScenario, setSelectedScenario] = useState<'fiber_cut' | 'cyber_intrusion' | 'atm_blackout'>('fiber_cut');
  const [currentTime, setCurrentTime] = useState<number>(0); // 0 to 10 scale
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 1x, 2x, 4x
  const [isLiveSimulating, setIsLiveSimulating] = useState<boolean>(false);
  const [simCountdown, setSimCountdown] = useState<number>(10);
  const [activeSimStep, setActiveSimStep] = useState<string>('Initialization');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Get active timeline list
  const getActiveEventsList = () => {
    if (selectedScenario === 'cyber_intrusion') return cyberIntrusionEvents;
    if (selectedScenario === 'atm_blackout') return atmBlackoutEvents;
    return fiberCutEvents;
  };

  const activeEvents = getActiveEventsList();

  // Handle Play/Pause
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= 10) {
            setIsPlaying(false);
            return 10;
          }
          return Math.min(10, +(prev + 0.1 * playbackSpeed).toFixed(2));
        });
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed]);

  // Find most recent event based on scrubbed time
  const getMostRecentEvent = () => {
    let active = activeEvents[0];
    for (const e of activeEvents) {
      if (currentTime >= e.minute) {
        active = e;
      }
    }
    return active;
  };

  const activeState = getMostRecentEvent();

  // Trigger Real-time live simulation flow
  const handleStartLiveSimulation = () => {
    setIsLiveSimulating(true);
    setSimCountdown(10);
    setActiveSimStep('SLA Outage Initialized');
    
    if (onSimulateOutage) {
      onSimulateOutage(selectedScenario);
    }

    const simFlowSteps = [
      { delay: 1500, label: 'ISP Redundancy Alarm Triggered' },
      { delay: 3000, label: 'SentinelNOC AI Diagnostics Running' },
      { delay: 4500, label: 'Slack Webhook & Telegram Fired' },
      { delay: 6000, label: 'IVR Emergency Call Queue Dispatched' },
      { delay: 8000, label: 'L3 SLA Engineer Assigned to Node' },
      { delay: 10000, label: 'Microwave Failover Route Active' }
    ];

    simFlowSteps.forEach((step, idx) => {
      setTimeout(() => {
        setActiveSimStep(step.label);
      }, step.delay);
    });

    const countdownTimer = setInterval(() => {
      setSimCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownTimer);
          setIsLiveSimulating(false);
          setActiveSimStep('All Systems Restored');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleStopLiveSimulation = () => {
    setIsLiveSimulating(false);
    if (onRestoreAll) onRestoreAll();
  };

  const renderEventIcon = (type: ReplayEvent['iconType']) => {
    switch (type) {
      case 'outage': return <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse" />;
      case 'alert': return <Activity className="h-4 w-4 text-amber-500 animate-pulse" />;
      case 'telegram': return <MessageSquare className="h-4 w-4 text-sky-500" />;
      case 'engineer': return <UserCheck className="h-4 w-4 text-emerald-500" />;
      case 'ivr': return <PhoneCall className="h-4 w-4 text-rose-500" />;
      case 'email': return <Clock className="h-4 w-4 text-purple-500" />;
      default: return <ShieldCheck className="h-4 w-4 text-emerald-500" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* LEFT: Scenario Selection and Live Simulator Trigger */}
      <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
        <div>
          <h3 className="text-xs uppercase tracking-[0.15em] text-slate-800 font-extrabold mb-1">
            SLA Failure Simulator
          </h3>
          <p className="text-[11px] text-slate-400 mb-4 font-sans leading-normal">
            Force extreme branch network collapses to stress-test your visual routing loops, predictive AI, and escalation SMS gateways in real-time.
          </p>

          <div className="space-y-2">
            <button
              onClick={() => { setSelectedScenario('fiber_cut'); setCurrentTime(0); }}
              className={`w-full text-left rounded-lg p-3 border text-xs flex items-center justify-between transition-all cursor-pointer ${
                selectedScenario === 'fiber_cut' 
                  ? 'border-red-500 bg-red-50/25 text-slate-800 font-bold' 
                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Zap className="h-4 w-4 text-red-600 shrink-0" />
                <div>
                  <p className="font-sans font-bold">Copperbelt Fiber Cut</p>
                  <p className="text-[9px] text-slate-400 font-mono">Ndola & Kitwe Down • 100% loss</p>
                </div>
              </div>
              <span className="text-[9px] font-mono bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">FIBER</span>
            </button>

            <button
              onClick={() => { setSelectedScenario('cyber_intrusion'); setCurrentTime(0); }}
              className={`w-full text-left rounded-lg p-3 border text-xs flex items-center justify-between transition-all cursor-pointer ${
                selectedScenario === 'cyber_intrusion' 
                  ? 'border-red-500 bg-red-50/25 text-slate-800 font-bold' 
                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 text-purple-600 shrink-0" />
                <div>
                  <p className="font-sans font-bold">HQ Cyber Penetration Threat</p>
                  <p className="text-[9px] text-slate-400 font-mono">Port TCP scan sweeps on Core Router</p>
                </div>
              </div>
              <span className="text-[9px] font-mono bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">CYBER</span>
            </button>

            <button
              onClick={() => { setSelectedScenario('atm_blackout'); setCurrentTime(0); }}
              className={`w-full text-left rounded-lg p-3 border text-xs flex items-center justify-between transition-all cursor-pointer ${
                selectedScenario === 'atm_blackout' 
                  ? 'border-red-500 bg-red-50/25 text-slate-800 font-bold' 
                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Server className="h-4 w-4 text-amber-600 shrink-0" />
                <div>
                  <p className="font-sans font-bold">Livingstone Power Loss</p>
                  <p className="text-[9px] text-slate-400 font-mono">UPS engaged • Falls Resort ATM drop</p>
                </div>
              </div>
              <span className="text-[9px] font-mono bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">POWER</span>
            </button>
          </div>
        </div>

        {/* Live Simulator Triggers */}
        <div className="mt-5 border-t border-slate-100 pt-4">
          {isLiveSimulating ? (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-[#DA0000] font-bold font-mono">
                  <span className="h-2 w-2 rounded-full bg-[#DA0000] animate-ping"></span>
                  <span>SIMULATING OUTAGE...</span>
                </span>
                <span className="text-xs font-black font-mono text-[#DA0000]">T-{simCountdown}s</span>
              </div>
              
              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#DA0000] transition-all duration-1000" 
                  style={{ width: `${(simCountdown / 10) * 100}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>Current Wave:</span>
                <span className="font-bold text-slate-800">{activeSimStep}</span>
              </div>

              <button
                onClick={handleStopLiveSimulation}
                className="w-full text-center py-2 rounded bg-slate-800 hover:bg-slate-900 text-white font-bold text-[10px] tracking-wide uppercase transition-all cursor-pointer"
              >
                KILL SIMULATION
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={handleStartLiveSimulation}
                className="w-full text-center py-3 rounded-lg bg-[#DA0000] hover:bg-red-700 text-white font-bold text-xs tracking-wider uppercase shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Zap className="h-4 w-4 animate-bounce" />
                <span>FIRE ACTIVE OUTAGE SIMULATOR</span>
              </button>
              <button
                onClick={onRestoreAll}
                className="w-full text-center py-2 rounded-lg bg-slate-150 hover:bg-slate-200 text-slate-700 font-bold text-[10px] tracking-wider uppercase transition-all border border-slate-200 cursor-pointer"
              >
                RESTORE ALL SYSTEMS GREEN
              </button>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: DVR Player deck and Interactive Event Timeline Scrubber */}
      <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
        
        {/* DVR Timeline Top Specs */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
            <div>
              <h3 className="text-xs uppercase tracking-[0.15em] text-slate-800 font-extrabold flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-[#DA0000]" />
                <span>NOC Incident Replay DVR Deck</span>
              </h3>
              <p className="text-[11px] text-slate-500 font-sans mt-0.5">
                Rewind network telemetry histories to inspect sub-second outages and sequence of emergency logs.
              </p>
            </div>

            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-1">
              <button 
                onClick={() => setPlaybackSpeed(1)}
                className={`px-2 py-1 text-[9px] font-mono font-bold rounded cursor-pointer ${playbackSpeed === 1 ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}
              >
                1x
              </button>
              <button 
                onClick={() => setPlaybackSpeed(2)}
                className={`px-2 py-1 text-[9px] font-mono font-bold rounded cursor-pointer ${playbackSpeed === 2 ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}
              >
                2x
              </button>
              <button 
                onClick={() => setPlaybackSpeed(4)}
                className={`px-2 py-1 text-[9px] font-mono font-bold rounded cursor-pointer ${playbackSpeed === 4 ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}
              >
                4x
              </button>
            </div>
          </div>

          {/* Active replay state detail box */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
            {/* Play state */}
            <div className="md:col-span-7 flex flex-col justify-between">
              <div>
                <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider border ${
                  activeState.severity === 'CRITICAL' ? 'bg-red-50 text-red-700 border-red-200' :
                  activeState.severity === 'WARNING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  activeState.severity === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {activeState.severity} State
                </span>
                <p className="font-sans text-sm font-extrabold text-slate-900 mt-1.5">
                  {activeState.title}
                </p>
                <p className="font-sans text-xs text-slate-600 mt-1 leading-relaxed">
                  {activeState.desc}
                </p>
              </div>

              <div className="mt-4 flex items-center gap-2 text-[10px] font-mono text-slate-400">
                <span>Timeline Marker:</span>
                <span className="font-black text-[#DA0000] bg-red-50 border border-red-100 rounded px-1.5 py-0.5">T+{currentTime.toFixed(1)} mins</span>
                <span className="text-slate-200">•</span>
                <span>Historic Time:</span>
                <span className="text-slate-700 font-bold">{activeState.timeLabel}</span>
              </div>
            </div>

            {/* Simulated Live DVR Gauges */}
            <div className="md:col-span-5 grid grid-cols-3 gap-2 shrink-0 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-4 font-mono">
              <div className="bg-white border border-slate-250 p-2 rounded-lg text-center flex flex-col justify-between">
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Latency</p>
                <p className="text-xs font-black text-slate-800 mt-1">{activeState.metricLatency}ms</p>
                <div className="h-1 w-full bg-slate-100 rounded-full mt-2 overflow-hidden">
                  <div className={`h-full ${activeState.metricLatency > 200 ? 'bg-[#DA0000]' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, (activeState.metricLatency / 500) * 100)}%` }}></div>
                </div>
              </div>

              <div className="bg-white border border-slate-250 p-2 rounded-lg text-center flex flex-col justify-between">
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Pkt Loss</p>
                <p className="text-xs font-black text-slate-800 mt-1">{activeState.metricPacketLoss}%</p>
                <div className="h-1 w-full bg-slate-100 rounded-full mt-2 overflow-hidden">
                  <div className={`h-full ${activeState.metricPacketLoss > 10 ? 'bg-[#DA0000]' : 'bg-emerald-500'}`} style={{ width: `${activeState.metricPacketLoss}%` }}></div>
                </div>
              </div>

              <div className="bg-white border border-slate-250 p-2 rounded-lg text-center flex flex-col justify-between">
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Bandwidth</p>
                <p className="text-xs font-black text-slate-800 mt-1">{activeState.metricBwDown}M</p>
                <div className="h-1 w-full bg-slate-100 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${activeState.metricBwDown}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* The DVR Player Scrubbing Controls */}
        <div className="space-y-4">
          
          {/* Timeline slider representation with marker ticks */}
          <div className="relative">
            {/* Render Ticks for events along slider track */}
            <div className="absolute inset-x-0 -top-3.5 flex justify-between pointer-events-none px-1">
              {activeEvents.map((ev, i) => {
                const tickPercent = (ev.minute / 10) * 100;
                const isPassed = currentTime >= ev.minute;
                return (
                  <div 
                    key={i} 
                    className="absolute group"
                    style={{ left: `calc(${tickPercent}% - 6px)` }}
                  >
                    <div className={`h-2 w-2 rounded-full border transition-all ${
                      isPassed ? 'bg-[#DA0000] border-white scale-110 shadow-sm' : 'bg-slate-250 border-slate-350'
                    }`} />
                    
                    {/* Tooltip on tick hover */}
                    <span className="hidden group-hover:block absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] font-mono font-bold px-1.5 py-0.5 rounded whitespace-nowrap z-50 shadow-md">
                      {ev.timeLabel} • {ev.title}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Slider track input */}
            <input 
              type="range"
              min="0"
              max="10"
              step="0.1"
              value={currentTime}
              onChange={(e) => { setCurrentTime(+e.target.value); setIsPlaying(false); }}
              className="w-full accent-[#DA0000] cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none mt-2"
            />

            <div className="flex justify-between text-[8px] font-mono text-slate-400 font-bold uppercase mt-1">
              <span>0m (Outage Incipient)</span>
              <span>2.5m</span>
              <span>5m (Dispatch Peak)</span>
              <span>7.5m</span>
              <span>10m (Resolution)</span>
            </div>
          </div>

          {/* Core Player Trigger Panel */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-slate-100 pt-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setCurrentTime(0); setIsPlaying(false); }}
                className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 transition-all cursor-pointer"
                title="Rewind to Outage Start"
              >
                <RotateCcw className="h-4 w-4" />
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition-all cursor-pointer"
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-4 w-4" />
                    <span>PAUSE PLAYBACK</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-white text-white" />
                    <span>PLAY REPLAY STREAM</span>
                  </>
                )}
              </button>

              <button
                onClick={() => { setCurrentTime(prev => Math.min(10, prev + 1)); }}
                className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 transition-all cursor-pointer"
                title="Fast Forward 1 min"
              >
                <FastForward className="h-4 w-4" />
              </button>
            </div>

            {/* Live Indicator widget */}
            <div className="flex items-center gap-2 font-mono text-[10px] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 shrink-0 self-start sm:self-auto">
              <Activity className="h-4 w-4 text-[#DA0000] shrink-0" />
              <span>DVR Status:</span>
              <span className={`font-black uppercase ${isPlaying ? 'text-red-600 animate-pulse' : 'text-slate-600'}`}>
                {isPlaying ? `STREAMING PLAYBACK (${playbackSpeed}x)` : 'PAUSED'}
              </span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
