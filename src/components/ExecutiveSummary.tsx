import { Shield, ShieldAlert, Zap, BarChart3, Wifi, WifiOff, AlertTriangle } from 'lucide-react';

interface ExecutiveSummaryProps {
  onlineCount: number;
  degradedCount: number;
  offlineCount: number;
  slaUptime: number;
  activeIncidentsCount: number;
  mttrMinutes: number;
}

export default function ExecutiveSummary({
  onlineCount,
  degradedCount,
  offlineCount,
  slaUptime,
  activeIncidentsCount,
  mttrMinutes,
}: ExecutiveSummaryProps) {
  const totalCount = onlineCount + degradedCount + offlineCount;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      
      {/* SLA Status Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400 font-bold">SLA UPTIME TARGET</p>
          <Shield className="h-4.5 w-4.5 text-emerald-500" />
        </div>
        <div className="flex items-baseline gap-2">
          <p className="font-mono text-2xl sm:text-3xl font-black text-slate-900">{slaUptime.toFixed(3)}%</p>
        </div>
        <div className="mt-4">
          <div className="h-1.5 w-full rounded-full bg-slate-100">
            <div 
              className="h-1.5 rounded-full bg-emerald-500 transition-all duration-500" 
              style={{ width: `${slaUptime}%` }}
            ></div>
          </div>
          <div className="mt-2 flex justify-between text-[9px] font-mono text-slate-400 font-medium">
            <span>SLA LIMIT: 99.00%</span>
            <span>TARGET: 99.99%</span>
          </div>
        </div>
      </div>

      {/* Branch Network Ratio */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400 font-bold">BRANCH NETWORK NODES</p>
          <BarChart3 className="h-4.5 w-4.5 text-[#DA0000]" />
        </div>
        <div className="flex items-baseline gap-2">
          <p className="font-mono text-2xl sm:text-3xl font-black text-slate-900">
            {onlineCount}<span className="text-slate-300 text-lg font-normal">/{totalCount}</span>
          </p>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-[9px] font-mono font-semibold">
          <div className="flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-emerald-700 border border-emerald-200">
            <Wifi className="h-3 w-3" />
            <span>{onlineCount} OK</span>
          </div>
          {degradedCount > 0 && (
            <div className="flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-amber-700 border border-amber-200 animate-pulse">
              <AlertTriangle className="h-3 w-3" />
              <span>{degradedCount} DEG</span>
            </div>
          )}
          {offlineCount > 0 && (
            <div className="flex items-center gap-1 rounded bg-red-50 px-2 py-0.5 text-red-700 border border-red-200 animate-pulse">
              <WifiOff className="h-3 w-3" />
              <span>{offlineCount} OUT</span>
            </div>
          )}
        </div>
      </div>

      {/* Active Incidents */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm transition-all duration-300">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400 font-bold">ACTIVE REG NOC TICKETS</p>
          {activeIncidentsCount > 0 ? (
            <ShieldAlert className="h-4.5 w-4.5 text-[#DA0000] animate-bounce" />
          ) : (
            <Shield className="h-4.5 w-4.5 text-slate-300" />
          )}
        </div>
        <div className="flex items-baseline gap-2">
          <p className={`font-mono text-2xl sm:text-3xl font-black ${activeIncidentsCount > 0 ? 'text-[#DA0000]' : 'text-slate-900'}`}>
            {activeIncidentsCount.toString().padStart(2, '0')}
          </p>
        </div>
        <div className="mt-4">
          <p className={`text-[9px] font-mono tracking-wider font-bold uppercase ${activeIncidentsCount > 0 ? 'text-[#DA0000]' : 'text-slate-400'}`}>
            {activeIncidentsCount > 0 
              ? '🚨 OUTAGE TIMELINE ACTIVE' 
              : '✅ STATE COMPLIANT'}
          </p>
        </div>
      </div>

      {/* Mean Time To Resolution */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400 font-bold">MEAN TIME TO RESOLVE (MTTR)</p>
          <Zap className="h-4.5 w-4.5 text-amber-500" />
        </div>
        <div className="flex items-baseline gap-2">
          <p className="font-mono text-2xl sm:text-3xl font-black text-slate-900">{mttrMinutes}m</p>
        </div>
        <div className="mt-4">
          <p className="text-[9px] font-mono font-bold tracking-wider uppercase text-slate-400">
            SLA TARGET &lt; 45m
          </p>
        </div>
      </div>

    </div>
  );
}
