import { Alert } from '../types';
import { ShieldAlert, AlertTriangle, Info, Check, Eye } from 'lucide-react';

interface AlertFeedProps {
  alerts: Alert[];
  onAcknowledge: (id: string) => void;
  onResolve: (id: string) => void;
  onInjectSimulatedAlert: (severity: 'CRITICAL' | 'WARNING' | 'INFO') => void;
}

export default function AlertFeed({
  alerts,
  onAcknowledge,
  onResolve,
  onInjectSimulatedAlert,
}: AlertFeedProps) {
  // Filter open or acknowledged alerts first, and show latest on top
  const activeAlerts = [...alerts].reverse();

  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL' && a.status !== 'resolved').length;
  const warningCount = alerts.filter(a => a.severity === 'WARNING' && a.status !== 'resolved').length;
  const infoCount = alerts.filter(a => a.severity === 'INFO' && a.status !== 'resolved').length;

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
      
      {/* Panel Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 mb-4">
        <div>
          <h3 className="text-[10px] uppercase tracking-[0.15em] text-slate-400 font-bold mb-1">
            Live Alert Feed (Syslog / SNMP)
          </h3>
          <p className="font-sans text-xs text-slate-600">
            Real-time interface logs and telemetry events
          </p>
        </div>

        {/* Quick Simulator Buttons */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">Inject State:</span>
          <button
            onClick={() => onInjectSimulatedAlert('CRITICAL')}
            className="rounded bg-red-50 hover:bg-red-100 px-2 py-1 text-[9px] font-bold text-red-700 border border-red-200 transition-all cursor-pointer"
          >
            CRITICAL
          </button>
          <button
            onClick={() => onInjectSimulatedAlert('WARNING')}
            className="rounded bg-amber-50 hover:bg-amber-100 px-2 py-1 text-[9px] font-bold text-amber-700 border border-amber-200 transition-all cursor-pointer"
          >
            WARNING
          </button>
          <button
            onClick={() => onInjectSimulatedAlert('INFO')}
            className="rounded bg-slate-50 hover:bg-slate-100 px-2 py-1 text-[9px] font-bold text-slate-700 border border-slate-200 transition-all cursor-pointer"
          >
            INFO
          </button>
        </div>
      </div>

      {/* Severity Badges Summary */}
      <div className="grid grid-cols-3 gap-3 mb-4 text-center font-mono">
        <div className="rounded bg-red-50/50 p-2 border border-red-100">
          <p className="text-[9px] uppercase font-bold text-slate-400">Critical Alerts</p>
          <p className="text-lg font-black text-red-600">{criticalCount.toString().padStart(2, '0')}</p>
        </div>
        <div className="rounded bg-amber-50/50 p-2 border border-amber-100">
          <p className="text-[9px] uppercase font-bold text-slate-400">Warnings</p>
          <p className="text-lg font-black text-amber-600">{warningCount.toString().padStart(2, '0')}</p>
        </div>
        <div className="rounded bg-slate-50/50 p-2 border border-slate-200">
          <p className="text-[9px] uppercase font-bold text-slate-400">Info Events</p>
          <p className="text-lg font-black text-slate-600">{infoCount.toString().padStart(2, '0')}</p>
        </div>
      </div>

      {/* Alert List Feed */}
      <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-200">
        {activeAlerts.length > 0 ? (
          activeAlerts.map(alert => {
            const isCritical = alert.severity === 'CRITICAL';
            const isOpen = alert.status === 'open';
            const isAck = alert.status === 'acknowledged';
            const isResolved = alert.status === 'resolved';

            let borderStyle = 'border-slate-100 bg-slate-50/45';
            let iconColor = 'text-slate-400 bg-slate-100 border-slate-200';
            let alertIcon = <Info className="h-4 w-4" />;

            if (isCritical) {
              if (isOpen) {
                borderStyle = 'border-red-200 bg-red-50/40 animate-pulse shadow-sm';
              } else {
                borderStyle = 'border-red-100 bg-red-50/10';
              }
              iconColor = 'text-red-600 bg-red-50 border-red-200';
              alertIcon = <ShieldAlert className="h-4 w-4 animate-bounce" />;
            } else if (alert.severity === 'WARNING') {
              borderStyle = 'border-amber-200 bg-amber-50/20';
              iconColor = 'text-amber-600 bg-amber-50 border-amber-200';
              alertIcon = <AlertTriangle className="h-4 w-4" />;
            }

            if (isResolved) {
              borderStyle = 'border-slate-150 bg-slate-50/30 opacity-60';
              iconColor = 'text-slate-400 bg-slate-100 border-slate-200';
            }

            return (
              <div
                key={alert.id}
                className={`relative flex flex-col md:flex-row md:items-center justify-between gap-3 rounded border p-3 transition-all duration-300 ${borderStyle}`}
              >
                {/* Alert Metadata */}
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`mt-0.5 rounded p-1 flex items-center justify-center border ${iconColor}`}>
                    {alertIcon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[9px] text-slate-400 font-semibold">{alert.timestamp}</span>
                      <span className={`rounded px-1.5 py-0.5 font-mono text-[8px] font-bold ${
                        isCritical ? 'bg-red-100 text-red-700 border border-red-200' :
                        alert.severity === 'WARNING' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                        'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {alert.severity}
                      </span>
                      <span className="font-sans text-[11px] font-extrabold text-slate-900">
                        {alert.branchName}
                      </span>
                    </div>
                    <p className="mt-1 font-sans text-xs text-slate-800">
                      <span className="text-slate-400 font-semibold">[{alert.device}]</span> {alert.description}
                    </p>
                  </div>
                </div>

                {/* Status and CTA Operations */}
                <div className="flex items-center gap-1.5 self-end md:self-center shrink-0">
                  {isResolved ? (
                    <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-[9px] font-mono font-bold text-slate-400 border border-slate-200">
                      RESOLVED
                    </span>
                  ) : (
                    <>
                      {isOpen && (
                        <button
                          onClick={() => onAcknowledge(alert.id)}
                          className="inline-flex items-center gap-1 rounded bg-white border border-slate-200 px-2.5 py-1 text-[9px] font-bold text-amber-600 hover:bg-amber-50 hover:border-amber-300 transition-colors cursor-pointer shadow-sm"
                        >
                          <Eye className="h-3 w-3" />
                          <span>ACK</span>
                        </button>
                      )}
                      {isAck && (
                        <span className="inline-flex items-center rounded bg-amber-50 border border-amber-200 px-2.5 py-1 text-[9px] font-bold text-amber-700 shadow-sm">
                          ACKNOWLEDGED
                        </span>
                      )}
                      <button
                        onClick={() => onResolve(alert.id)}
                        className="inline-flex items-center gap-1 rounded bg-[#DA0000] px-2.5 py-1 text-[9px] font-bold text-white hover:bg-red-700 transition-colors cursor-pointer shadow-sm"
                      >
                        <Check className="h-3 w-3" />
                        <span>RESOLVE</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-slate-200 rounded bg-slate-50/50">
            <Check className="h-6 w-6 text-emerald-500 opacity-60 animate-bounce" />
            <p className="mt-2 font-sans text-xs text-slate-700 font-bold">
              All Systems Operational
            </p>
            <p className="mt-0.5 text-[10px] text-slate-400">
              No active interface outages logged.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
