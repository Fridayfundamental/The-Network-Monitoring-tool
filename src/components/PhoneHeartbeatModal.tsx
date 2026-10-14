import React, { useState, useEffect } from 'react';
import { Smartphone, Zap, Radio, X, CheckCircle2, AlertTriangle, Copy, ExternalLink, ShieldAlert, WifiOff } from 'lucide-react';
import { MonitoredDevice } from '../types';

interface PhoneHeartbeatModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: MonitoredDevice | null;
  onToggleSimulation?: (device: MonitoredDevice) => void;
}

export default function PhoneHeartbeatModal({
  isOpen,
  onClose,
  device,
  onToggleSimulation
}: PhoneHeartbeatModalProps) {
  const [isPinging, setIsPinging] = useState(false);
  const [pingCount, setPingCount] = useState(0);
  const [lastPingResponse, setLastPingResponse] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Live Ping Effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isPinging && device) {
      const sendPing = async () => {
        try {
          const res = await fetch(`/api/monitoring/heartbeat?id=${encodeURIComponent(device.id)}`);
          const data = await res.json();
          if (res.ok) {
            setPingCount(prev => prev + 1);
            setLastPingResponse(`200 OK - Heartbeat #${data.deviceId} received (${data.timestamp})`);
          } else {
            setLastPingResponse(`Error: ${data.error}`);
          }
        } catch (err: any) {
          setLastPingResponse(`Network Error: ${err.message}`);
        }
      };

      // Initial ping
      sendPing();
      // Repeat every 3 seconds
      interval = setInterval(sendPing, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPinging, device]);

  if (!isOpen || !device) return null;

  const publicBaseUrl = window.location.origin.includes('ais-dev-') 
    ? window.location.origin.replace('ais-dev-', 'ais-pre-') 
    : window.location.origin;

  const pingUrl = `${publicBaseUrl}/api/monitoring/heartbeat?id=${device.id}`;
  const appShareUrl = publicBaseUrl;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(pingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto animate-fade-in font-sans">
      <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/30 text-red-500">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-white flex items-center gap-2">
                <span>Real Phone Physical Telemetry Link</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  LIVE REST AGENT
                </span>
              </h3>
              <p className="text-[11px] font-mono text-slate-400">
                Target: {device.name} ({device.ip})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* Status Banner */}
          <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
            isPinging 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
              : 'bg-slate-950 border-slate-800 text-slate-400'
          }`}>
            <div className="flex items-center gap-3">
              <Radio className={`h-6 w-6 ${isPinging ? 'text-emerald-400 animate-pulse' : 'text-slate-600'}`} />
              <div>
                <span className="text-xs font-bold block text-white">
                  {isPinging ? '🟢 Phone Telemetry Heartbeat Active' : '⚪ Telemetry Ping Standby'}
                </span>
                <span className="text-[11px] font-mono">
                  {isPinging 
                    ? `Transmitting every 3s (Total Pings: ${pingCount})` 
                    : 'Click button below or open URL on your phone browser'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsPinging(!isPinging)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md flex items-center gap-2 ${
                isPinging
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              <Zap className="h-4 w-4" />
              <span>{isPinging ? 'Stop Telemetry' : 'Start Phone Telemetry'}</span>
            </button>
          </div>

          {lastPingResponse && (
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl font-mono text-xs text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span className="truncate">{lastPingResponse}</span>
            </div>
          )}

          {/* Instructions Box for Real Phone Power-off */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-red-500" />
              <span>3 Ways to Test Physical Phone Disconnect & Emergency Call</span>
            </h4>

            {/* Method 1: QR Code & Direct Link */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg shrink-0 shadow-md">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(pingUrl)}`}
                    alt="Scan QR Code on iPhone"
                    className="w-24 h-24 object-contain"
                  />
                </div>
                <div className="space-y-1 text-xs">
                  <span className="font-bold text-emerald-400 block">METHOD 1: Scan QR Code with Phone Camera</span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Point your iPhone camera at this QR code to trigger a live telemetry ping directly from your mobile browser!
                  </p>
                  <p className="text-slate-400 text-[10px] font-mono">
                    If cloud sandbox blocks mobile browsers, use Method 2 or Method 3 below.
                  </p>
                </div>
              </div>
            </div>

            {/* Method 2: Dashboard Telemetry Agent */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
              <span className="font-bold text-amber-300 block">METHOD 2: Instant Dashboard Telemetry (Recommended)</span>
              <ol className="list-decimal pl-4 space-y-1 text-slate-300 text-[11px]">
                <li>Click the green <strong>"Start Phone Telemetry"</strong> button at the top of this modal.</li>
                <li>SentinelNOC detects your phone as <span className="text-emerald-400 font-bold">🟢 ONLINE</span>.</li>
                <li>To test turning off your phone, click <strong>"Stop Telemetry"</strong> (simulating phone shutdown/Wi-Fi loss).</li>
              </ol>
            </div>

            {/* Method 3: 1-Click Cut Power Test */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
              <span className="font-bold text-red-400 block">METHOD 3: 1-Click Outage Trigger (Instant Emergency Call)</span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Click the red button below to immediately simulate your phone turning off or losing network power:
              </p>
              {onToggleSimulation && (
                <button
                  onClick={() => {
                    setIsPinging(false);
                    onToggleSimulation(device);
                  }}
                  className="mt-1 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-red-950/50 transition-all"
                >
                  <WifiOff className="h-4 w-4" />
                  <span>⚡ Cut Phone Power Now & Trigger Emergency Call</span>
                </button>
              )}
            </div>

            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-xs text-red-300 space-y-1">
              <span className="font-bold flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                What Happens When Telemetry Stops?
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                SentinelNOC detects missing heartbeats after 15s → flips status to <strong className="text-red-400">🔴 OFFLINE</strong> → sends a Telegram Critical Alert → places an automated <strong>Twilio Voice Emergency Call</strong> to your phone!
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[10px] font-mono text-slate-500">
              SentinelNOC REST Telemetry Listener active
            </span>

            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
