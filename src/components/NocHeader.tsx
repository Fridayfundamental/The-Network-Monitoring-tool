import { useEffect, useState } from 'react';
import { Activity, Clock, Server, Search, Globe, ChevronDown, User, Lock } from 'lucide-react';

interface NocHeaderProps {
  slaUptime: number;
  onlineCount: number;
  totalCount: number;
  onLock?: () => void;
}

export default function NocHeader({ slaUptime, onlineCount, totalCount, onLock }: NocHeaderProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const utcTime = new Date(time.getTime() + time.getTimezoneOffset() * 60000);

  const isDegraded = onlineCount < totalCount;
  const isDown = onlineCount === 0;

  return (
    <div className="flex flex-col shrink-0 sticky top-0 z-50 shadow-md">
      {/* Upper white bar: Branding & Corporate Portal Tabs */}
      <div className="min-h-14 py-2 bg-white border-b border-slate-100 flex items-center justify-between px-4 sm:px-6 gap-3 flex-wrap">
        <div className="flex items-center gap-6">
          {/* Absa Red Logo Emblem */}
          <div className="flex items-center">
            <div className="h-9 w-9 rounded-full bg-[#DA0000] flex items-center justify-center shadow-sm">
              <span className="text-white font-extrabold text-sm tracking-tight">asabb</span>
            </div>
            <div className="h-6 w-px bg-slate-200 mx-4"></div>
            <span className="text-slate-900 font-bold text-base tracking-tight">ASABB Bank Zambia NOC</span>
          </div>

          {/* Institutional tabs */}
          <nav className="hidden lg:flex items-center gap-5 text-xs font-semibold text-slate-500">
            <span className="text-[#DA0000] border-b-2 border-[#DA0000] pb-4 pt-4 px-1 cursor-pointer">
              Retail Banking Network
            </span>
            <span className="hover:text-[#DA0000] transition-colors pb-4 pt-4 px-1 cursor-pointer">
              Business Hubs
            </span>
            <span className="hover:text-[#DA0000] transition-colors pb-4 pt-4 px-1 cursor-pointer">
              Corporate & SD-WAN Controllers
            </span>
          </nav>
        </div>

        {/* Global actions and operator identity */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1 text-xs text-slate-500 font-medium bg-slate-50 border border-slate-200 rounded px-2.5 py-1">
            <Globe className="h-3.5 w-3.5 text-slate-400" />
            <span>Lusaka HQ Core</span>
          </div>
          
          <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

          {/* User profile dropdown simulator */}
          <div className="flex items-center gap-2 cursor-pointer group">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
              <User className="h-4 w-4" />
            </div>
            <div className="hidden md:block text-left">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">SECURE SESSION</div>
              <div className="text-xs font-semibold text-slate-700 group-hover:text-slate-900 transition-colors flex items-center gap-0.5">
                <span>NOC Operator ZN1</span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </div>
            </div>
          </div>

          {onLock && (
            <>
              <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
              <button
                onClick={onLock}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-slate-500 hover:text-[#DA0000] hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-lg transition-all cursor-pointer"
                title="Lock Console / Sign Out"
              >
                <Lock className="h-3.5 w-3.5 text-[#DA0000]" />
                <span className="hidden sm:inline font-sans">Lock Console</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Sub header bar: Absa Signature Maroon red background with real-time NOC metrics */}
      <div className="min-h-11 py-2 bg-[#800020] text-white flex flex-col md:flex-row md:items-center md:justify-between px-4 sm:px-6 text-xs gap-3">
        <div className="flex items-center gap-4">
          {/* NOC System Status Indicator */}
          <div className="flex items-center gap-2 bg-black/20 rounded px-3 py-1 border border-white/10">
            <div className={`w-2.5 h-2.5 rounded-full ${
              isDown ? 'bg-red-400 animate-pulse' :
              isDegraded ? 'bg-amber-400 animate-pulse' :
              'bg-emerald-400'
            }`}></div>
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              {isDown ? 'CRITICAL OUTAGE DETECTED' : isDegraded ? 'DEGRADED TRUNKS ACTIVE' : 'SYSTEM FULLY OPERATIONAL'}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-4 text-[11px] text-white/80">
            <span>• MPLS Redundancy: <strong className="text-white">Active</strong></span>
            <span>• Secondary LTE Failovers: <strong className="text-white">Ready</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Interactive Telemetry Clocks */}
          <div className="flex items-center gap-4 text-[11px]">
            <div className="text-right">
              <span className="text-white/60 text-[9px] uppercase mr-1.5">LST (LUSAKA):</span>
              <span className="font-mono font-bold text-white">{formatTime(time)}</span>
            </div>
            <div className="h-3.5 w-px bg-white/20"></div>
            <div className="text-right hidden sm:block">
              <span className="text-white/60 text-[9px] uppercase mr-1.5">GMT/UTC:</span>
              <span className="font-mono font-semibold text-white/90">{formatTime(utcTime)}</span>
            </div>
          </div>

          <div className="h-5 w-px bg-white/20 hidden sm:block"></div>

          {/* SLA Tracker */}
          <div className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded border border-white/10 font-mono text-xs text-white">
            <span className="text-white/60 text-[9px] uppercase font-bold tracking-wider">MONTHLY SLA:</span>
            <span className="font-bold">{slaUptime.toFixed(3)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
