import React, { useState } from 'react';
import { Server, Activity, ShieldCheck, Cpu, X, Plus, AlertCircle, Radio, CheckCircle2, Zap } from 'lucide-react';
import { DeviceCategory, MonitoringProtocol } from '../types';

interface DeviceOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeviceCreated: () => void;
}

export default function DeviceOnboardingModal({
  isOpen,
  onClose,
  onDeviceCreated
}: DeviceOnboardingModalProps) {
  const [branchName, setBranchName] = useState('Solwezi Mining Hub');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [ip, setIp] = useState('');
  const [category, setCategory] = useState<DeviceCategory>('Router');
  const [protocol, setProtocol] = useState<MonitoringProtocol>('ICMP Ping');
  const [monitoringEnabled, setMonitoringEnabled] = useState(true);
  const [monitoringInterval, setMonitoringInterval] = useState(10);
  const [consecutiveFailureThreshold, setConsecutiveFailureThreshold] = useState(3);
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleDiscoverAndMonitor = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim()) {
      setErrorMsg('Please enter a Device Name (e.g. Solwezi Secondary Gateway AR-3001).');
      return;
    }
    if (!ip.trim()) {
      setErrorMsg('Please enter a valid IP Address or Hostname.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/monitoring/devices/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: branchName.toLowerCase().replace(/\s+/g, '-'),
          branchName,
          name,
          description,
          ip,
          category,
          protocol,
          monitoringEnabled,
          monitoringInterval,
          consecutiveFailureThreshold,
          notes
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to onboard device');
      }

      setSuccessMsg(`🟢 Device "${data.device.name}" (${data.device.ip}) successfully onboarded and continuous health monitoring active!`);
      
      setTimeout(() => {
        onDeviceCreated();
        onClose();
        // Reset form
        setName('');
        setIp('');
        setDescription('');
        setNotes('');
        setSuccessMsg('');
      }, 1200);

    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during discovery.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DA0000]/10 border border-[#DA0000]/30 text-[#DA0000]">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-white flex items-center gap-2">
                <span>Device Onboarding Module</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">SENTINELNOC V2</span>
              </h3>
              <p className="text-[11px] font-mono text-slate-400">Register IP endpoints for continuous background health probing & SLA watchdogs</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleDiscoverAndMonitor} className="p-6 space-y-5">
          
          {errorMsg && (
            <div className="flex items-center gap-2.5 rounded-xl bg-red-500/10 border border-red-500/30 p-3.5 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 text-xs text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Branch Selection */}
            <div>
              <label className="text-[10px] font-mono uppercase font-extrabold text-slate-300 block mb-1.5">
                Target ASABB Branch
              </label>
              <select
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-[#DA0000] transition-colors"
              >
                <option value="Solwezi Mining Hub">Solwezi Mining Hub</option>
                <option value="Lusaka HQ - Cairo Rd">Lusaka HQ - Cairo Rd</option>
                <option value="Kitwe Retail Centre">Kitwe Retail Centre</option>
                <option value="Ndola Commercial Branch">Ndola Commercial Branch</option>
                <option value="Livingstone Resort">Livingstone Resort</option>
                <option value="Kabwe Commercial Centre">Kabwe Commercial Centre</option>
                <option value="Chipata Regional Gateway">Chipata Regional Gateway</option>
                <option value="Mongu Trade Hub">Mongu Trade Hub</option>
              </select>
            </div>

            {/* Device Name */}
            <div>
              <label className="text-[10px] font-mono uppercase font-extrabold text-slate-300 block mb-1.5">
                Device Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Solwezi Edge Gateway AR-3001"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#DA0000] transition-colors font-mono"
              />
            </div>

            {/* Device IP Address */}
            <div>
              <label className="text-[10px] font-mono uppercase font-extrabold text-slate-300 block mb-1.5">
                Device IP Address / Hostname <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 10.211.5.12 or router.solwezi.asabb.co.zm"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#DA0000] transition-colors font-mono"
              />
            </div>

            {/* Device Category */}
            <div>
              <label className="text-[10px] font-mono uppercase font-extrabold text-slate-300 block mb-1.5">
                Device Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DeviceCategory)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-[#DA0000] transition-colors"
              >
                <option value="Router">Router</option>
                <option value="Switch">Switch</option>
                <option value="Firewall">Firewall</option>
                <option value="Server">Server</option>
                <option value="Workstation">Workstation</option>
                <option value="Auto Detect">Auto Detect</option>
              </select>
            </div>

            {/* Monitoring Protocol */}
            <div>
              <label className="text-[10px] font-mono uppercase font-extrabold text-slate-300 block mb-1.5">
                Probing Protocol
              </label>
              <select
                value={protocol}
                onChange={(e) => setProtocol(e.target.value as MonitoringProtocol)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-[#DA0000] transition-colors"
              >
                <option value="ICMP Ping">ICMP Ping Echo</option>
                <option value="HTTP/HTTPS Probe">HTTP/HTTPS Probe</option>
                <option value="TCP Port Probe">TCP Port Probe</option>
                <option value="SNMP Poller">SNMP v3 Poller</option>
                <option value="Syslog Listener">Syslog Telemetry</option>
                <option value="REST Telemetry">REST API Stream</option>
              </select>
            </div>

            {/* Failure Threshold */}
            <div>
              <label className="text-[10px] font-mono uppercase font-extrabold text-slate-300 block mb-1.5">
                Consecutive Failure Threshold
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={consecutiveFailureThreshold}
                  onChange={(e) => setConsecutiveFailureThreshold(Number(e.target.value))}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-[#DA0000] font-mono"
                />
                <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">checks before Offline</span>
              </div>
            </div>

          </div>

          {/* Description & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-mono uppercase font-extrabold text-slate-300 block mb-1.5">
                Device Description
              </label>
              <input
                type="text"
                placeholder="e.g. Primary WAN gateway for mining payroll portal"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#DA0000]"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase font-extrabold text-slate-300 block mb-1.5">
                Notes / SLA Parameters
              </label>
              <input
                type="text"
                placeholder="e.g. Cisco Gold Support 24/7 contract #4029"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-[#DA0000]"
              />
            </div>
          </div>

          {/* Monitoring Enabled & Interval controls */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center gap-3">
              <Radio className={`h-5 w-5 ${monitoringEnabled ? 'text-emerald-400 animate-pulse' : 'text-slate-600'}`} />
              <div>
                <span className="text-xs font-bold text-white block">Background Health Monitoring</span>
                <span className="text-[10px] font-mono text-slate-400">Polled every {monitoringInterval}s with auto incident generation</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={monitoringEnabled}
                  onChange={(e) => setMonitoringEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#DA0000] text-white text-xs font-bold hover:bg-red-700 transition-colors cursor-pointer shadow-lg disabled:opacity-50"
            >
              <Zap className="h-4 w-4" />
              <span>{loading ? 'Probing Endpoint...' : 'Discover & Monitor'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
