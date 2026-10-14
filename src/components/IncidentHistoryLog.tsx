import { useState } from 'react';
import { Incident } from '../types';
import { Search, Filter, ShieldAlert, CheckCircle2, MessageSquare, PhoneCall, Radio, AlertTriangle } from 'lucide-react';

interface IncidentHistoryLogProps {
  incidents: Incident[];
  onResolveIncident: (id: string) => void;
}

export default function IncidentHistoryLog({ incidents, onResolveIncident }: IncidentHistoryLogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'CRITICAL' | 'WARNING' | 'INFO'>('all');

  // Filter logic
  const filteredIncidents = incidents.filter(i => {
    const matchesSearch = i.branchName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          i.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          i.device.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          i.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' ? true : i.status === statusFilter;
    const matchesSeverity = severityFilter === 'all' ? true : i.severity === severityFilter;
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
      
      {/* Title & Stats summary */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-4 mb-4">
        <div>
          <h3 className="text-[10px] uppercase tracking-[0.15em] text-slate-400 font-bold mb-1">
            NOC Incident Register & Logs
          </h3>
          <p className="font-sans text-xs text-slate-600 font-medium">
            Audit history of branch outages, routing instability, and escalated tickets
          </p>
        </div>
        <div className="flex items-center gap-2.5 font-mono text-[10px] text-slate-400 font-bold">
          <span>Active Tickets: <b className="text-[#DA0000]">{incidents.filter(i => i.status === 'open').length}</b></span>
          <span className="text-slate-200">•</span>
          <span>Resolved Logs: <b className="text-emerald-600">{incidents.filter(i => i.status === 'resolved').length}</b></span>
        </div>
      </div>

      {/* Interactive Filter Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 mb-4">
        
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search Branch, IP, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded bg-slate-50 pl-9 pr-3 py-1.5 font-sans text-xs text-slate-800 border border-slate-200 focus:border-[#DA0000] focus:outline-none"
          />
        </div>

        {/* Status Dropdown */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full rounded bg-slate-50 pl-9 pr-3 py-1.5 font-sans text-xs text-slate-800 border border-slate-200 focus:border-[#DA0000] focus:outline-none appearance-none cursor-pointer"
          >
            <option value="all">All Ticket Statuses</option>
            <option value="open">Active / Open Only</option>
            <option value="resolved">Resolved Logs</option>
          </select>
        </div>

        {/* Severity Dropdown */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as any)}
            className="w-full rounded bg-slate-50 pl-9 pr-3 py-1.5 font-sans text-xs text-slate-800 border border-slate-200 focus:border-[#DA0000] focus:outline-none appearance-none cursor-pointer"
          >
            <option value="all">All Severities</option>
            <option value="CRITICAL">CRITICAL Severity</option>
            <option value="WARNING">WARNING Severity</option>
            <option value="INFO">INFO Events</option>
          </select>
        </div>

      </div>

      {/* Incident List Rows */}
      <div className="space-y-3">
        {filteredIncidents.length > 0 ? (
          filteredIncidents.map(incident => {
            const isOpen = incident.status === 'open';
            
            return (
              <div 
                key={incident.id}
                className={`rounded border p-4 transition-all duration-300 ${
                  isOpen 
                    ? 'border-red-200 bg-red-50/20 shadow-sm' 
                    : 'border-slate-200 bg-slate-50/50 opacity-80 hover:opacity-100'
                }`}
              >
                {/* Core Header */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-[#DA0000]">
                        #{incident.id}
                      </span>
                      <span className={`rounded px-2 py-0.5 font-mono text-[9px] font-bold ${
                        incident.severity === 'CRITICAL' ? 'bg-red-100 text-red-700 border border-red-200' :
                        incident.severity === 'WARNING' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                        'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {incident.severity}
                      </span>
                      <span className="font-sans text-xs font-extrabold text-slate-900">
                        {incident.branchName}
                      </span>
                      <span className="font-mono text-[9px] text-slate-400 font-semibold">
                        ({incident.device})
                      </span>
                    </div>

                    <h4 className="mt-1.5 font-sans text-sm font-bold text-slate-900">
                      {incident.title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto mt-2 sm:mt-0 shrink-0">
                    <span className="font-mono text-[9px] text-slate-400 font-bold">
                      {new Date(incident.startTime).toLocaleTimeString()}
                    </span>
                    {isOpen ? (
                      <button
                        onClick={() => onResolveIncident(incident.id)}
                        className="rounded bg-[#DA0000] hover:bg-red-700 px-2.5 py-1 text-[9px] font-bold text-white transition-colors cursor-pointer shadow-sm"
                      >
                        CLOSE TICKET
                      </button>
                    ) : (
                      <span className="flex items-center gap-1 rounded bg-emerald-50 px-2.5 py-0.5 text-[9px] font-bold text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>CLOSED</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Simulated Escalation Status Bar */}
                <div className="mt-4 border-t border-slate-100 pt-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex flex-col md:flex-row md:items-start lg:items-center gap-2">
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                      Escalation Track:
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-mono">
                      {incident.milestones.map(m => {
                        const isSent = m.status === 'sent';
                        const isActive = m.status === 'active';
                        return (
                          <div 
                            key={m.step}
                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded border transition-colors ${
                              isSent 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : isActive
                                ? 'bg-red-50 text-[#DA0000] border-red-200 animate-pulse'
                                : 'bg-slate-50 text-slate-400 border-slate-200'
                            }`}
                          >
                            <span>{m.step === 'telegram' ? '💬' : m.step === 'followup' ? '💬' : m.step === 'call' ? '📞' : '🔺'}</span>
                            <span>{m.label.replace(" Sent", "").replace(" Logged", "")}</span>
                            <span>{isSent ? '✓' : ''}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {isOpen && (
                    <div className="flex items-center gap-1.5 rounded bg-red-50 px-2 py-0.5 text-[9px] text-[#DA0000] border border-red-200 animate-pulse self-start md:self-auto shrink-0 font-bold font-mono">
                      <Radio className="h-3 w-3" />
                      <span>Active {incident.elapsedMinutes}m</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-slate-200 rounded bg-slate-50/50">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 opacity-60" />
            <p className="mt-3 font-sans text-sm font-bold text-slate-700">
              No Incidents Found
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Try adjusting the filters to see archived logs.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
