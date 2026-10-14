import { useState, useEffect, useRef } from 'react';
import { Branch, Device } from '../types';
import { Server, Wifi, Activity, Terminal, AlertCircle, RefreshCw, X } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapZambiaProps {
  branches: Branch[];
  selectedBranchId: string | null;
  onSelectBranch: (id: string | null) => void;
  onSimulateDeviceToggle: (branchId: string, deviceName: string) => void;
}

export default function MapZambia({
  branches,
  selectedBranchId,
  onSelectBranch,
  onSimulateDeviceToggle
}: MapZambiaProps) {
  const selectedBranch = branches.find(b => b.id === selectedBranchId) || null;

  // Star topology: connections radiate from Lusaka HQ (lusaka-hq)
  const hq = branches.find(b => b.id === 'lusaka-hq') || branches[0];

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      // Set map options to restrict panning outside Zambia region
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
        maxBounds: [[-19.0, 21.0], [-7.5, 35.0]], // Boundary of Zambia
        minZoom: 5.5,
        maxZoom: 12,
        attributionControl: false
      }).setView([-13.13, 27.84], 6); // Centered on Zambia

      // Beautiful, minimalist CartoDB Positron Map Tiles for professional styling
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(map);

      mapRef.current = map;
    }

    // Cleanup map on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        layersRef.current = null;
      }
    };
  }, []);

  // Update Map Layers whenever branches or selected status change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!layersRef.current) {
      layersRef.current = L.layerGroup().addTo(map);
    } else {
      layersRef.current.clearLayers();
    }

    const layerGroup = layersRef.current;

    // Find HQ
    const hqBranch = branches.find(b => b.id === 'lusaka-hq') || branches[0];

    // 1. Draw SD-WAN lines from HQ to individual branches
    branches.forEach(b => {
      if (b.id === 'lusaka-hq') return;

      let lineColor = '#10b981'; // Emerald-500
      let lineDash = undefined;
      
      if (b.status === 'degraded') {
        lineColor = '#f59e0b'; // Amber-500
        lineDash = '6, 6';
      } else if (b.status === 'offline') {
        lineColor = '#ef4444'; // Red-500
        lineDash = '4, 4';
      }

      // Draw standard line backing (wide & transparent for high contrast glow)
      L.polyline(
        [[hqBranch.lat, hqBranch.lng], [b.lat, b.lng]],
        {
          color: lineColor,
          weight: 6,
          opacity: 0.12,
        }
      ).addTo(layerGroup);

      // Draw interactive polyline path
      const polyline = L.polyline(
        [[hqBranch.lat, hqBranch.lng], [b.lat, b.lng]],
        {
          color: lineColor,
          weight: 2,
          opacity: 0.85,
          dashArray: lineDash,
        }
      ).addTo(layerGroup);

      // Attach tooltip
      polyline.bindTooltip(
        `<span class="font-mono text-[10px] font-bold text-slate-800">
          HQ ⟷ ${b.name.replace(" Branch", "")} (${b.status.toUpperCase()})
         </span>`,
        { sticky: true, className: 'custom-link-tooltip' }
      );
    });

    // 2. Draw beautiful customized CSS DivIcons on branches
    branches.forEach(b => {
      const isSelected = b.id === selectedBranchId;
      
      let colorClass = 'bg-emerald-500';
      let pingClass = '';
      
      if (b.status === 'degraded') {
        colorClass = 'bg-amber-500 animate-pulse';
        pingClass = 'border-amber-400 animate-ping';
      } else if (b.status === 'offline') {
        colorClass = 'bg-[#DA0000]';
        pingClass = 'border-red-500 animate-ping';
      }

      // Construct a highly polished CSS custom marker wrapper
      const customIcon = L.divIcon({
        className: 'custom-branch-icon',
        html: `
          <div class="relative flex items-center justify-center w-8 h-8 -translate-x-1/2 -translate-y-1/2">
            <!-- Ripple/breathing ring for abnormal status -->
            ${pingClass ? `<span class="absolute w-7 h-7 rounded-full border-2 ${pingClass} opacity-75"></span>` : ''}
            
            <!-- Glow background -->
            <span class="absolute w-4 h-4 rounded-full ${colorClass} opacity-15 blur-[2px]"></span>

            <!-- Core point -->
            <span class="relative flex h-3.5 w-3.5 rounded-full border border-white shadow-[0_1px_3px_rgba(0,0,0,0.2)] ${colorClass} ${isSelected ? 'scale-125 border-slate-900 border-2 shadow-lg' : ''}"></span>
            
            <!-- Selection halo -->
            ${isSelected ? `<span class="absolute w-8 h-8 rounded-full border border-[#DA0000] scale-110 opacity-80 animate-pulse"></span>` : ''}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [0, 0]
      });

      const marker = L.marker([b.lat, b.lng], { icon: customIcon }).addTo(layerGroup);

      // On Marker Click, notify parent App to select this branch
      marker.on('click', () => {
        onSelectBranch(b.id === selectedBranchId ? null : b.id);
      });

      // Bind simple professional Leaflet popup
      const popupContent = `
        <div class="font-sans p-1 min-w-[150px]">
          <div class="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5 mb-1.5">
            <strong class="text-[11px] text-slate-900">${b.name}</strong>
            <span class="text-[8px] uppercase font-mono font-extrabold px-1.5 py-0.2 rounded border ${
              b.status === 'online' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
              b.status === 'degraded' ? 'bg-amber-50 border-amber-100 text-amber-800' :
              'bg-red-50 border-red-100 text-red-800'
            }">${b.status}</span>
          </div>
          <div class="space-y-1 text-[10px] text-slate-500 font-mono">
            <div class="flex justify-between"><span>Region:</span><span class="font-bold text-slate-700">${b.region}</span></div>
            <div class="flex justify-between"><span>Latency:</span><span class="font-bold text-slate-700">${b.status === 'offline' ? '—' : `${b.latency}ms`}</span></div>
            <div class="flex justify-between"><span>Uptime:</span><span class="font-bold text-slate-700">${b.uptime}%</span></div>
          </div>
        </div>
      `;
      marker.bindPopup(popupContent, { closeButton: false, offset: [0, -6] });

      // If this branch is currently selected in state, pan to it and trigger the popup automatically!
      if (isSelected) {
        map.panTo([b.lat, b.lng]);
        setTimeout(() => {
          marker.openPopup();
        }, 120);
      }
    });
  }, [branches, selectedBranchId]);

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      
      {/* Map Card */}
      <div className="relative flex-1 overflow-hidden bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-[10px] uppercase tracking-[0.15em] text-slate-400 font-bold mb-1">
              SD-WAN & Fiber Topology Map
            </h3>
            <p className="font-sans text-xs text-slate-600">
              Real-time geographic digital twins on interactive OpenStreetMap
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono">
            <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Online</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-600 font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span>Degraded</span>
            </div>
            <div className="flex items-center gap-1.5 text-red-600 font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span>Outage</span>
            </div>
          </div>
        </div>

        {/* Real Interactive Map Workspace */}
        <div className="relative h-[480px] w-full rounded-lg bg-slate-100 border border-slate-200 overflow-hidden">
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Map Overlay Tip */}
          <div className="absolute bottom-3 left-3 rounded bg-white/95 px-2.5 py-1 text-[10px] text-slate-500 border border-slate-200 font-mono shadow-sm z-10">
            🖱️ Drag map, scroll to zoom & click markers to inspect
          </div>
        </div>
      </div>

      {/* Selected Node Inspector / Details Panel */}
      <div className={`w-full lg:w-96 bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between transition-all duration-300 ${
        selectedBranch ? 'shadow-md border-slate-300' : 'opacity-90 shadow-sm'
      }`}>
        {selectedBranch ? (
          <div className="flex h-full flex-col justify-between gap-4">
            <div>
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider border ${
                    selectedBranch.status === 'online' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    selectedBranch.status === 'degraded' ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' :
                    'bg-red-50 text-red-700 border-red-200 animate-pulse'
                  }`}>
                    {selectedBranch.status}
                  </span>
                  <h4 className="mt-1 font-sans text-sm font-black text-slate-900 leading-tight">
                    {selectedBranch.name}
                  </h4>
                  <p className="font-sans text-[10px] text-slate-400 mt-0.5 font-medium">
                    {selectedBranch.location}
                  </p>
                </div>
                <button 
                  onClick={() => onSelectBranch(null)}
                  className="rounded p-1 hover:bg-slate-100 text-slate-400 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Status Specs Grid */}
              <div className="grid grid-cols-2 gap-2 my-3 rounded bg-slate-50 p-2.5 border border-slate-200 font-mono text-[10px]">
                <div>
                  <p className="text-[8px] text-slate-400 uppercase tracking-wider font-bold">Chassis Temp</p>
                  <p className={`font-black ${selectedBranch.status === 'offline' ? 'text-slate-500' : 'text-slate-800'}`}>
                    {selectedBranch.status === 'offline' ? '0' : selectedBranch.status === 'degraded' ? '41' : '32'}°C
                  </p>
                </div>
                <div>
                  <p className="text-[8px] text-slate-400 uppercase tracking-wider font-bold">Fans Status</p>
                  <p className={`font-black ${selectedBranch.status === 'online' ? 'text-emerald-600' : 'text-red-600 animate-pulse'}`}>
                    {selectedBranch.status === 'online' ? '3,200 RPM' : 'STALLED'}
                  </p>
                </div>
              </div>

              {/* Digital Twin Cabinet Slide-out */}
              <div className="mt-2 space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                    Digital Twin Server Cabinet (A-4)
                  </span>
                  <span className="text-[8px] font-mono text-[#DA0000] font-black uppercase animate-pulse">SLA ACTIVE</span>
                </div>

                {/* Animated Hardware Chassis visual rows */}
                <div className="rounded-xl border border-slate-250 bg-slate-950 p-3 space-y-3 shadow-inner">
                  
                  {selectedBranch.devices.map((d, index) => {
                    const isOnline = d.status === 'online';
                    
                    return (
                      <div 
                        key={d.ip} 
                        className={`rounded border px-2.5 py-2 relative overflow-hidden transition-all duration-300 ${
                          isOnline 
                            ? 'border-slate-800 bg-black/45' 
                            : 'border-red-900 bg-red-950/20'
                        }`}
                      >
                        {/* Rack Mounting ears visual */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-800/80 rounded-l" />
                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-slate-800/80 rounded-r" />

                        {/* Chassis internal header */}
                        <div className="flex items-center justify-between text-[9px] font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-[#DA0000] animate-ping'}`} />
                            <span className="font-bold text-slate-200">{d.name}</span>
                          </div>
                          <span className="text-slate-500 text-[8px]">{d.ip}</span>
                        </div>

                        {/* Sub-system details */}
                        <div className="mt-1.5 flex items-center justify-between gap-2 border-t border-slate-900/60 pt-1.5">
                          {/* Left: Port Blinker Matrix for Routers/Switches */}
                          {d.type === 'router' || d.type === 'switch' ? (
                            <div className="flex items-center gap-1 bg-black/60 p-1 rounded border border-slate-900">
                              <span className="text-[7px] font-mono text-slate-500 mr-1">PORTS</span>
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5, 6].map(p => (
                                  <span 
                                    key={p} 
                                    className={`h-1.5 w-1.5 rounded-sm ${
                                      !isOnline 
                                        ? 'bg-red-800' 
                                        : p === 5 
                                        ? 'bg-amber-400 animate-pulse'
                                        : p % 2 === 0 
                                        ? 'bg-emerald-400 animate-pulse' 
                                        : 'bg-emerald-500'
                                    }`} 
                                  />
                                ))}
                              </div>
                            </div>
                          ) : d.type === 'ups' ? (
                            /* Battery Level animation for UPS */
                            <div className="flex items-center gap-2 bg-black/60 px-1.5 py-1 rounded border border-slate-900 w-full justify-between">
                              <span className="text-[7px] font-mono text-slate-500">UPS CORE</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[8px] font-mono text-emerald-400 font-bold">{isOnline ? '100% STABLE' : '45% DRAIN'}</span>
                                <div className="h-2 w-8 bg-slate-800 rounded-sm overflow-hidden border border-slate-700/50">
                                  <div className={`h-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-[#DA0000] animate-pulse'}`} style={{ width: isOnline ? '100%' : '45%' }} />
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* Cash Capacity status bar for ATMs */
                            <div className="flex items-center gap-2 bg-black/60 px-1.5 py-1 rounded border border-slate-900 w-full justify-between">
                              <span className="text-[7px] font-mono text-slate-500">VAULT SAFE</span>
                              <div className="flex items-center gap-1">
                                <span className={`text-[8px] font-mono font-bold ${isOnline ? 'text-emerald-400' : 'text-red-500'}`}>{isOnline ? '88% SECURE' : 'VAULT COMPROMISE'}</span>
                                <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-[#DA0000] animate-ping'}`} />
                              </div>
                            </div>
                          )}

                          {/* Right side: Interactive FAIL/FIX buttons */}
                          <button
                            onClick={(e) => { e.stopPropagation(); onSimulateDeviceToggle(selectedBranch.id, d.name); }}
                            className={`px-1.5 py-0.5 text-[8px] font-mono font-bold rounded border transition-colors cursor-pointer shrink-0 ${
                              isOnline 
                                ? 'bg-white text-red-600 border-red-900 hover:bg-red-50' 
                                : 'bg-emerald-600 text-white border-transparent hover:bg-emerald-500'
                            }`}
                          >
                            {isOnline ? 'PULL' : 'REBOOT'}
                          </button>
                        </div>
                      </div>
                    );
                  })}

                </div>
              </div>
            </div>

            {/* Bottom logs & Live status summaries */}
            <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-400 font-semibold bg-slate-50 border border-slate-200 rounded px-2.5 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                <span className="truncate">Active Logs: {selectedBranch.lastIncident}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center py-10 text-center">
            <Wifi className="h-8 w-8 text-slate-300 animate-pulse" />
            <h4 className="mt-3 text-[10px] uppercase tracking-[0.15em] text-slate-400 font-extrabold">
              No Asset Selected
            </h4>
            <p className="mt-1 max-w-[200px] font-sans text-xs text-slate-500 leading-normal">
              Select any branch node on the schematic topology map to review nested sub-systems, toggle device power, and inspect diagnostic charts.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
