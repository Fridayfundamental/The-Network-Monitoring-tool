import { useState, useEffect } from 'react';
import NocHeader from './components/NocHeader';
import ExecutiveSummary from './components/ExecutiveSummary';
import MapZambia from './components/MapZambia';
import AlertFeed from './components/AlertFeed';
import EscalationEngine from './components/EscalationEngine';
import IncidentHistoryLog from './components/IncidentHistoryLog';
import GizaAssistant from './components/GizaAssistant';
import EscalationDesigner from './components/EscalationDesigner';
import IncidentReplayDVR from './components/IncidentReplayDVR';
import DeviceInventoryGrid from './components/DeviceInventoryGrid';
import IncomingCallOverlay from './components/IncomingCallOverlay';
import OnCallRoster from './components/OnCallRoster';
import AbsaLandingPortal from './components/AbsaLandingPortal';
import { Branch, Alert, Incident, DashboardState, EscalationMilestone } from './types';
import { initialBranches, initialAlerts } from './data/branches';
import { Radio, ShieldAlert, Map, Activity, FileText, Settings2, Play, Layers, Users } from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'topology' | 'telemetry' | 'designer' | 'simulator' | 'assets' | 'history' | 'roster'>('topology');
  const [branches, setBranches] = useState<Branch[]>(initialBranches);
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  
  // Stats state
  const [slaUptime, setSlaUptime] = useState(100.00);
  const [mttr, setMttr] = useState(28);

  // Inbound call simulator overlays
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [callData, setCallData] = useState<{ branchName: string; deviceName: string; elapsedMinutes: number; incidentId: string } | null>(null);

  // Helper to dispatch Twilio voice call
  const sendTwilioVoiceCall = (branchName: string, deviceName: string, elapsedMinutes: number, incidentId: string) => {
    try {
      const sid = localStorage.getItem('absa_twilio_sid')?.trim();
      const token = localStorage.getItem('absa_twilio_token')?.trim();
      const fromNum = localStorage.getItem('absa_twilio_from')?.trim();
      const toNum = localStorage.getItem('absa_twilio_to')?.trim();

      const message = `Attention. This is an automated ABSA Bank Zambia Network Operations Centre emergency alert. A critical network outage has escalated at ${branchName}. Device ${deviceName} is offline. Active duration is ${elapsedMinutes} minutes. Incident ticket number ${incidentId} is active. Please review the live digital twin dashboard immediately.`;

      const payload: any = { message };
      if (sid) payload.accountSid = sid;
      if (token) payload.authToken = token;
      if (fromNum) payload.fromNumber = fromNum;
      if (toNum) payload.toNumber = toNum;

      fetch('/api/twilio/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          console.warn("Twilio real voice call dispatch not active or parameter invalid:", data.error || res.statusText);
        } else {
          console.log("Twilio outbound voice call successfully dispatched via API!");
        }
      })
      .catch(err => console.error("Twilio Voice call dispatch fetch failed:", err));
    } catch (e) {
      console.error(e);
    }
  };

  const triggerVoiceCallAlert = (branchName: string, deviceName: string, elapsedMinutes: number, incidentId: string) => {
    setCallData({ branchName, deviceName, elapsedMinutes, incidentId });
    setIsCallOpen(true);
    sendTwilioVoiceCall(branchName, deviceName, elapsedMinutes, incidentId);
  };


  // Derive counts
  const onlineCount = branches.filter(b => b.status === 'online').length;
  const degradedCount = branches.filter(b => b.status === 'degraded').length;
  const offlineCount = branches.filter(b => b.status === 'offline').length;
  const activeIncidentsCount = incidents.filter(i => i.status === 'open').length;

  // 1. Live Uptime SLA Fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setSlaUptime(prev => {
        // If there are offline branches, SLA drifts down. Otherwise, it drifts slightly up or stable.
        if (offlineCount > 0) {
          const delta = 0.001 * offlineCount + (Math.random() * 0.0005);
          return Math.max(99.45, prev - delta);
        } else {
          const delta = 0.0002;
          return Math.min(99.98, prev + delta);
        }
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [offlineCount]);

  // 2. Accelerated Escalation Watchdog Engine (Ticking every 3 seconds = 3 simulated minutes)
  useEffect(() => {
    const watchdog = setInterval(() => {
      setIncidents(prevIncidents => {
        return prevIncidents.map(incident => {
          if (incident.status !== 'open') return incident;

          const updatedElapsed = incident.elapsedMinutes + 3;

          // Process and update milestones
          const updatedMilestones = incident.milestones.map((m): EscalationMilestone => {
            if (updatedElapsed >= m.triggerMinutes && m.status === 'pending') {
              // Automate notification dispatch when milestone triggers
              if (m.step === 'telegram') {
                sendTelegramNotification(`🔴 *ABSA NOC AUTOMATED BREACH WARNING* 🔴\n\n*Incident ID:* ${incident.id}\n*Severity:* CRITICAL (Stage 1 - Telegram)\n*Affected Branch:* ${incident.branchName}\n*Offline Device:* ${incident.device}\n*Elapsed Outage Time:* ${updatedElapsed} mins.\n\n_Triggered automatically by SLA Watchdog Gateway._`);
              } else if (m.step === 'call') {
                triggerVoiceCallAlert(incident.branchName, incident.device, updatedElapsed, incident.id);
              } else if (m.step === 'manager') {
                sendTelegramNotification(`🔺 *ABSA SLA BREACH EXECUTIVE ESCALATION* 🔺\n\n*Incident ID:* ${incident.id}\n*Severity:* CRITICAL (Stage 4 - Manager Escalated)\n*Affected Branch:* ${incident.branchName}\n*Offline Device:* ${incident.device}\n*Elapsed Outage Time:* ${updatedElapsed} mins.\n\n_Ticket escalated to Executive SLA Committee and CIO Operations Desk._`);
              }

              return {
                ...m,
                status: 'sent',
                timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
              };
            }
            return m;
          });

          // Determine current highest escalation step
          let step: 'none' | 'telegram' | 'followup' | 'call' | 'manager' = 'none';
          if (updatedMilestones[3].status === 'sent') step = 'manager';
          else if (updatedMilestones[2].status === 'sent') step = 'call';
          else if (updatedMilestones[1].status === 'sent') step = 'followup';
          else if (updatedMilestones[0].status === 'sent') step = 'telegram';

          return {
            ...incident,
            elapsedMinutes: updatedElapsed,
            milestones: updatedMilestones,
            escalationStep: step
          };
        });
      });
    }, 3000);

    return () => clearInterval(watchdog);
  }, []);

  // Helper to dispatch telegram alerts
  const sendTelegramNotification = (message: string) => {
    try {
      const token = localStorage.getItem('absa_telegram_bot_token');
      const chat = localStorage.getItem('absa_telegram_chat_id');
      
      const payload: any = { message };
      if (token) payload.botToken = token;
      if (chat) payload.chatId = chat;

      fetch('/api/telegram/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          console.error("Telegram notification failed on server:", data.error || res.statusText);
        } else {
          console.log("Telegram notification successfully dispatched");
        }
      })
      .catch(err => console.error("Auto Telegram dispatch fetch failed:", err));
    } catch (e) {
      console.error(e);
    }
  };

  // Helper to trigger alert creation
  const handleInjectAlert = (severity: 'CRITICAL' | 'WARNING' | 'INFO') => {
    // Pick a random branch & random device
    const randomBranch = branches[Math.floor(Math.random() * branches.length)];
    const randomDevice = randomBranch.devices[Math.floor(Math.random() * randomBranch.devices.length)];

    let description = '';
    if (severity === 'CRITICAL') {
      description = `Core SNMP failure. Network interface link down. Trunk threshold breached.`;
    } else if (severity === 'WARNING') {
      description = `Power bank isolation anomaly. UPS discharging under load.`;
    } else {
      description = `Local administrative session established over SSH interface.`;
    }

    const newAlert: Alert = {
      id: `alt-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      branchId: randomBranch.id,
      branchName: randomBranch.name,
      device: randomDevice.name,
      severity: severity,
      description: description,
      status: 'open'
    };

    setAlerts(prev => [...prev, newAlert]);

    // Recalculate branch status dynamically based on injected alerts
    setBranches(prevBranches => {
      return prevBranches.map(b => {
        if (b.id === randomBranch.id) {
          // If critical, set offline, if warning, set degraded
          const newStatus = severity === 'CRITICAL' ? 'offline' : 'degraded';
          
          // Toggle the device status internally
          const updatedDevices = b.devices.map(d => {
            if (d.name === randomDevice.name) {
              return { ...d, status: severity === 'CRITICAL' ? 'offline' as const : 'online' as const };
            }
            return d;
          });

          return {
            ...b,
            status: newStatus,
            devices: updatedDevices,
            latency: severity === 'CRITICAL' ? 999 : b.latency + 15,
            lastIncident: `${severity} event on ${randomDevice.name}`
          };
        }
        return b;
      });
    });

    // If critical, spawn active incident register ticket
    if (severity === 'CRITICAL') {
      const newIncident: Incident = {
        id: `INC-${Math.floor(1000 + Math.random() * 9000)}`,
        alertId: newAlert.id,
        branchId: randomBranch.id,
        branchName: randomBranch.name,
        device: randomDevice.name,
        title: `${randomBranch.name} - MPLS WAN Failover Instability`,
        severity: 'CRITICAL',
        status: 'open',
        startTime: new Date().toISOString(),
        elapsedMinutes: 0,
        escalationStep: 'telegram',
        milestones: [
          { step: 'telegram', label: 'Telegram Sent', triggerMinutes: 0, status: 'sent', timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) },
          { step: 'followup', label: 'Follow-up Sent', triggerMinutes: 15, status: 'pending' },
          { step: 'call', label: 'Call Logged 📞', triggerMinutes: 30, status: 'pending' },
          { step: 'manager', label: 'Escalated 🔺', triggerMinutes: 45, status: 'pending' }
        ]
      };
      setIncidents(prev => [newIncident, ...prev]);
    }
  };

  // 3. User device Fail / Fix Simulator Action
  const handleSimulateDeviceToggle = (branchId: string, deviceName: string) => {
    const currentBranch = branches.find(b => b.id === branchId);
    const currentDevice = currentBranch?.devices.find(d => d.name === deviceName);
    if (currentDevice) {
      const willGoOffline = currentDevice.status === 'online';
      if (willGoOffline) {
        sendTelegramNotification(`🔴 *ABSA BANK ZAMBIA NOC ALARM* 🔴\n\n*Branch:* ${currentBranch?.name || branchId}\n*Device:* ${deviceName}\n*Status:* OFFLINE ⚠️\n*Severity:* CRITICAL (SLA Breach Risk)\n\n_Manual simulation trigger detected in Digital Twin (Topology Map)._`);
      } else {
        sendTelegramNotification(`💚 *ABSA BANK ZAMBIA NOC RESTORATION* 💚\n\n*Branch:* ${currentBranch?.name || branchId}\n*Device:* ${deviceName}\n*Status:* ONLINE ✅\n\n_System restored to green parameter baseline._`);
      }
    }

    setBranches(prevBranches => {
      return prevBranches.map(b => {
        if (b.id === branchId) {
          const updatedDevices = b.devices.map(d => {
            if (d.name === deviceName) {
              const newStatus = d.status === 'online' ? 'offline' as const : 'online' as const;
              return { ...d, status: newStatus };
            }
            return d;
          });

          // Compute new branch status based on hardware
          const offlineHardware = updatedDevices.filter(d => d.status === 'offline');
          let finalStatus: 'online' | 'degraded' | 'offline' = 'online';
          let finalLatency = 12 + Math.floor(Math.random() * 20);

          if (offlineHardware.length > 0) {
            const hasCoreOffline = updatedDevices.some(d => d.type === 'router' && d.status === 'offline');
            if (hasCoreOffline || offlineHardware.length === updatedDevices.length) {
              finalStatus = 'offline';
              finalLatency = 999;
            } else {
              finalStatus = 'degraded';
              finalLatency = 75 + Math.floor(Math.random() * 50);
            }
          }

          // Trigger associated alerts or resolutions
          if (finalStatus !== 'online') {
            const isOffline = finalStatus === 'offline';
            const alertSeverity = isOffline ? 'CRITICAL' as const : 'WARNING' as const;
            
            // Check if there's already an open alert for this device to prevent spamming
            const exists = alerts.some(a => a.branchId === branchId && a.device === deviceName && a.status === 'open');
            
            if (!exists) {
              const newAlert: Alert = {
                id: `alt-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
                timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                branchId: branchId,
                branchName: b.name,
                device: deviceName,
                severity: alertSeverity,
                description: isOffline 
                  ? `Hardware link offline: Core interface reporting down.`
                  : `Sub-system fault warning. Performance index degraded.`,
                status: 'open'
              };
              setAlerts(prev => [...prev, newAlert]);

              // If critical, spawn incident
              if (isOffline) {
                const newIncident: Incident = {
                  id: `INC-${Math.floor(1000 + Math.random() * 9000)}`,
                  alertId: newAlert.id,
                  branchId: branchId,
                  branchName: b.name,
                  device: deviceName,
                  title: `${b.name} - Core Network Component Outage`,
                  severity: 'CRITICAL',
                  status: 'open',
                  startTime: new Date().toISOString(),
                  elapsedMinutes: 0,
                  escalationStep: 'telegram',
                  milestones: [
                    { step: 'telegram', label: 'Telegram Sent', triggerMinutes: 0, status: 'sent', timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) },
                    { step: 'followup', label: 'Follow-up Sent', triggerMinutes: 15, status: 'pending' },
                    { step: 'call', label: 'Call Logged 📞', triggerMinutes: 30, status: 'pending' },
                    { step: 'manager', label: 'Escalated 🔺', triggerMinutes: 45, status: 'pending' }
                  ]
                };
                setIncidents(prev => [newIncident, ...prev]);
              }
            }
          } else {
            // It got fixed! Acknowledge and resolve alerts & open incidents for this device/branch
            setAlerts(prevAlerts => {
              return prevAlerts.map(a => {
                if (a.branchId === branchId && a.device === deviceName && a.status !== 'resolved') {
                  return { ...a, status: 'resolved' as const };
                }
                return a;
              });
            });

            setIncidents(prevIncidents => {
              return prevIncidents.map(i => {
                if (i.branchId === branchId && i.device === deviceName && i.status === 'open') {
                  return { ...i, status: 'resolved' as const };
                }
                return i;
              });
            });
          }

          return {
            ...b,
            status: finalStatus,
            devices: updatedDevices,
            latency: finalLatency,
            lastIncident: offlineHardware.length > 0 
              ? `Hardware issue: ${offlineHardware.map(h => h.name).join(", ")} failure.`
              : `All systems restored and online.`
          };
        }
        return b;
      });
    });
  };

  // 4. Alert actions
  const handleAcknowledgeAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'acknowledged' as const } : a));
  };

  const handleResolveAlert = (id: string) => {
    const targetAlert = alerts.find(a => a.id === id);
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'resolved' as const } : a));

    if (targetAlert) {
      // Restore all devices in this branch to online
      setBranches(prevBranches => {
        return prevBranches.map(b => {
          if (b.id === targetAlert.branchId) {
            const restoredDevices = b.devices.map(d => ({ ...d, status: 'online' as const }));
            return {
              ...b,
              status: 'online',
              devices: restoredDevices,
              latency: 12 + Math.floor(Math.random() * 15),
              lastIncident: 'Manually cleared via incident log override'
            };
          }
          return b;
        });
      });

      // Close associated open incidents
      setIncidents(prevIncidents => {
        return prevIncidents.map(i => {
          if (i.alertId === id && i.status === 'open') {
            return { ...i, status: 'resolved' as const };
          }
          return i;
        });
      });
    }
  };

  // 5. Incident resolving
  const handleResolveIncident = (incidentId: string) => {
    const incident = incidents.find(i => i.id === incidentId);
    setIncidents(prev => prev.map(i => i.id === incidentId ? { ...i, status: 'resolved' as const } : i));

    if (incident) {
      // Fix all hardware on this branch
      setBranches(prevBranches => {
        return prevBranches.map(b => {
          if (b.id === incident.branchId) {
            const restoredDevices = b.devices.map(d => ({ ...d, status: 'online' as const }));
            return {
              ...b,
              status: 'online',
              devices: restoredDevices,
              latency: 12 + Math.floor(Math.random() * 15),
              lastIncident: `Ticket #${incidentId} resolved manually.`
            };
          }
          return b;
        });
      });

      // Mark alert resolved too
      setAlerts(prev => prev.map(a => a.branchId === incident.branchId && a.device === incident.device && a.status !== 'resolved' ? { ...a, status: 'resolved' as const } : a));
    }
  };

  const handleSimulateOutage = (scenario: 'fiber_cut' | 'cyber_intrusion' | 'atm_blackout') => {
    if (scenario === 'fiber_cut') {
      setBranches(prev => prev.map(b => {
        if (b.id === 'ndola-main' || b.id === 'kitwe-retail') {
          const updatedDevices = b.devices.map(d => ({ ...d, status: 'offline' as const }));
          return {
            ...b,
            status: 'offline' as const,
            devices: updatedDevices,
            latency: 999,
            lastIncident: 'Primary fiber trunk split detected on Copperbelt link'
          };
        }
        return b;
      }));

      const newAlerts: Alert[] = [
        {
          id: `alt-sim-${Date.now()}-1-${Math.floor(Math.random() * 1000000)}`,
          timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          branchId: 'ndola-main',
          branchName: 'Ndola Main Branch',
          device: 'Branch Router AR-4011',
          severity: 'CRITICAL',
          description: 'Trunk WAN interface collapsed. 100% packet loss.',
          status: 'open'
        },
        {
          id: `alt-sim-${Date.now()}-2-${Math.floor(Math.random() * 1000000)}`,
          timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          branchId: 'kitwe-retail',
          branchName: 'Kitwe Retail Centre',
          device: 'Branch Router AR-4012',
          severity: 'CRITICAL',
          description: 'Trunk WAN interface collapsed. 100% packet loss.',
          status: 'open'
        }
      ];
      setAlerts(prev => [...prev, ...newAlerts]);

      const incId = `INC-${Math.floor(1000 + Math.random() * 9000)}`;
      const newIncidents: Incident[] = [
        {
          id: incId,
          alertId: newAlerts[0].id,
          branchId: 'ndola-main',
          branchName: 'Ndola Main Branch',
          device: 'Branch Router AR-4011',
          title: 'Copperbelt Fiber Trunk Down - Service Outage',
          severity: 'CRITICAL',
          status: 'open',
          startTime: new Date().toISOString(),
          elapsedMinutes: 0,
          escalationStep: 'telegram',
          milestones: [
            { step: 'telegram', label: 'Telegram Sent', triggerMinutes: 0, status: 'sent', timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) },
            { step: 'followup', label: 'Follow-up Sent', triggerMinutes: 15, status: 'pending' },
            { step: 'call', label: 'Call Logged 📞', triggerMinutes: 30, status: 'pending' },
            { step: 'manager', label: 'Escalated 🔺', triggerMinutes: 45, status: 'pending' }
          ]
        }
      ];
      setIncidents(prev => [...newIncidents, ...prev]);

      // Fire real-time telegram notification
      sendTelegramNotification(`🔴 *ABSA BANK ZAMBIA NOC ALARM* 🔴\n\n*Incident ID:* ${incId}\n*Severity:* CRITICAL (SLA Breach Risk)\n*Status:* OPEN\n*Affected:* Ndola Main & Kitwe Retail\n*Details:* Trunk WAN interface collapsed. 100% packet loss detected. Primary fiber trunk split on Copperbelt link.\n\n_Escalation Stage 1: Telegram Broadcast Dispatched to Level 2 On-Call Array_`);

    } else if (scenario === 'cyber_intrusion') {
      setBranches(prev => prev.map(b => {
        if (b.id === 'lusaka-hq') {
          const updatedDevices = b.devices.map(d => d.type === 'router' ? { ...d, status: 'offline' as const } : d);
          return {
            ...b,
            status: 'degraded' as const,
            devices: updatedDevices,
            latency: 180,
            lastIncident: 'Intrusion Protection Sweep Triggered on Cairo HQ Gateways'
          };
        }
        return b;
      }));

      const newAlert: Alert = {
        id: `alt-sim-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
        timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        branchId: 'lusaka-hq',
        branchName: 'Lusaka HQ & Retail',
        device: 'Core Router AR-9001',
        severity: 'CRITICAL',
        description: 'IPS Triggered: 2,400 concurrent failed session queries. Suspect DDoS profile.',
        status: 'open'
      };
      setAlerts(prev => [...prev, newAlert]);

      const incId = `INC-${Math.floor(1000 + Math.random() * 9000)}`;
      const newIncident: Incident = {
        id: incId,
        alertId: newAlert.id,
        branchId: 'lusaka-hq',
        branchName: 'Lusaka HQ & Retail',
        device: 'Core Router AR-9001',
        title: 'HQ Security Gateway - Multi-Host Brute-Force Block',
        severity: 'CRITICAL',
        status: 'open',
        startTime: new Date().toISOString(),
        elapsedMinutes: 0,
        escalationStep: 'telegram',
        milestones: [
          { step: 'telegram', label: 'Telegram Sent', triggerMinutes: 0, status: 'sent', timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) },
          { step: 'followup', label: 'Follow-up Sent', triggerMinutes: 15, status: 'pending' },
          { step: 'call', label: 'Call Logged 📞', triggerMinutes: 30, status: 'pending' },
          { step: 'manager', label: 'Escalated 🔺', triggerMinutes: 45, status: 'pending' }
        ]
      };
      setIncidents(prev => [newIncident, ...prev]);

      // Fire real-time telegram notification
      sendTelegramNotification(`⚠️ *ABSA BANK ZAMBIA NOC ALARM* ⚠️\n\n*Incident ID:* ${incId}\n*Severity:* HIGH (Security Intrusion Threat)\n*Status:* ACTIVE WARNING\n*Affected Systems:* Lusaka HQ Cairo Gateways\n*Details:* IPS Triggered: 2,400 concurrent failed session queries. Cisco firewall blocks active.\n\n_Escalation Stage 1: Security Operations Centre (SOC) Briefed_`);

    } else if (scenario === 'atm_blackout') {
      setBranches(prev => prev.map(b => {
        if (b.id === 'livingstone') {
          const updatedDevices = b.devices.map(d => d.type === 'atm' || d.type === 'ups' ? { ...d, status: 'offline' as const } : d);
          return {
            ...b,
            status: 'offline' as const,
            devices: updatedDevices,
            latency: 480,
            lastIncident: 'Livingstone local grid failure. Critical UPS discharging rapidly.'
          };
        }
        return b;
      }));

      const newAlert: Alert = {
        id: `alt-sim-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
        timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        branchId: 'livingstone',
        branchName: 'Livingstone Hub',
        device: 'Critical UPS Powerhouse',
        severity: 'CRITICAL',
        description: 'Primary substation collapse. Local system running on battery backup.',
        status: 'open'
      };
      setAlerts(prev => [...prev, newAlert]);

      // Fire real-time telegram notification
      sendTelegramNotification(`🔋 *ABSA BANK ZAMBIA NOC ALARM* 🔋\n\n*Severity:* CRITICAL (Power Failover)\n*Status:* ACTIVE WARNING\n*Affected Branch:* Livingstone Hub & Falls Resort ATM\n*Details:* Livingstone local grid failure. Primary substation collapsed. UPS backup engaging, critical battery depletion at 85%.\n\n_Escalation Stage 1: Facilities Power Team Dispatched_`);
    }
  };

  const handleRestoreAll = () => {
    setBranches(initialBranches);
    setAlerts([]);
    setIncidents([]);
    sendTelegramNotification(`💚 *ABSA BANK ZAMBIA NOC ALERT RESOLVED* 💚\n\nAll simulated systems have been restored to GREEN status. Network latency and SLA uptimes have returned to healthy baseline operating parameters.`);
  };

  const handleUnlock = () => {
    localStorage.setItem('absa_noc_unlocked', 'true');
    setIsAuthenticated(true);
  };

  const handleLock = () => {
    localStorage.setItem('absa_noc_unlocked', 'false');
    setIsAuthenticated(false);
  };

  // Assemble full State object for GIZA context
  const dashboardState: DashboardState = {
    branches,
    alerts,
    incidents,
    stats: {
      onlineCount,
      degradedCount,
      offlineCount,
      slaUptime,
      activeIncidentsCount,
      mttrMinutes: mttr
    }
  };

  if (!isAuthenticated) {
    return <AbsaLandingPortal onUnlock={handleUnlock} slaUptime={slaUptime} />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans selection:bg-[#DA0000] selection:text-white">
      
      {/* Dynamic Header */}
      <NocHeader 
        slaUptime={slaUptime}
        onlineCount={onlineCount}
        totalCount={branches.length}
        onLock={handleLock}
      />

      {/* Main Container */}
      <div className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 flex flex-col gap-6 overflow-visible">
        
        {/* Operations Board */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          
          {/* Executive Summary Cards */}
          <ExecutiveSummary 
            onlineCount={onlineCount}
            degradedCount={degradedCount}
            offlineCount={offlineCount}
            slaUptime={slaUptime}
            activeIncidentsCount={activeIncidentsCount}
            mttrMinutes={mttr}
          />

          {/* Alerts Warning Banner */}
          {offlineCount > 0 && (
            <div className="rounded bg-red-50 border border-red-200 px-4 py-3 text-xs flex items-center justify-between text-red-700 font-bold animate-pulse shadow-sm">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4.5 w-4.5 text-[#DA0000]" />
                <span>[CRITICAL OUTAGE] SD-WAN core connection interrupted on {branches.filter(b => b.status === 'offline').map(b => b.name).join(", ")}. Emergency dispatch logs engaged.</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Radio className="h-4 w-4 animate-spin text-[#DA0000]" />
                <span>NOC SECTOR RED</span>
              </div>
            </div>
          )}

          {/* Navigation Tab Bar */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-px">
            <button
              onClick={() => setActiveTab('topology')}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'topology'
                  ? 'border-[#DA0000] text-[#DA0000]'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Map className="h-4 w-4" />
              <span>Topology Map & Twins</span>
            </button>
            <button
              onClick={() => setActiveTab('telemetry')}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'telemetry'
                  ? 'border-[#DA0000] text-[#DA0000]'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Activity className="h-4 w-4" />
              <span>Telemetry & Alerts ({alerts.filter(a => a.status === 'open').length})</span>
            </button>
            <button
              onClick={() => setActiveTab('designer')}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'designer'
                  ? 'border-[#DA0000] text-[#DA0000]'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Settings2 className="h-4 w-4" />
              <span>Escalation Designer</span>
            </button>
            <button
              onClick={() => setActiveTab('roster')}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'roster'
                  ? 'border-[#DA0000] text-[#DA0000]'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>On-Call Roster</span>
            </button>
            <button
              onClick={() => setActiveTab('simulator')}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'simulator'
                  ? 'border-[#DA0000] text-[#DA0000]'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Play className="h-4 w-4" />
              <span>DVR Replay & Simulator</span>
            </button>
            <button
              onClick={() => setActiveTab('assets')}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'assets'
                  ? 'border-[#DA0000] text-[#DA0000]'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>Consoles & Security</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'border-[#DA0000] text-[#DA0000]'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Incident Tickets ({incidents.length})</span>
            </button>
          </div>

          {/* Render Active View Segment */}
          {activeTab === 'topology' && (
            <MapZambia 
              branches={branches}
              selectedBranchId={selectedBranchId}
              onSelectBranch={setSelectedBranchId}
              onSimulateDeviceToggle={handleSimulateDeviceToggle}
            />
          )}

          {activeTab === 'telemetry' && (
            <div className="space-y-6">
              {/* Traffic Wave Speed Graphs Panel (Step 3) */}
              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-[10px] uppercase tracking-[0.15em] text-slate-400 font-bold mb-0.5">
                      Live MPLS & SD-WAN Traffic Waves (Zambia Core)
                    </h3>
                    <p className="font-sans text-xs text-slate-600">
                      Real-time upload and download speeds on main Cairo HQ trunk loops
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-mono">
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500" /> Upload (Core): 450 Mbps</span>
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Download (Core): 1.2 Gbps</span>
                  </div>
                </div>

                {/* Styled scrolling-wave SVG chart */}
                <div className="h-28 w-full bg-slate-950 rounded-lg relative overflow-hidden border border-slate-800">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:5%_15%]"></div>
                  <svg viewBox="0 0 100 20" className="h-full w-full opacity-80" preserveAspectRatio="none">
                    {/* Blue upload wave path */}
                    <path 
                      d="M 0 10 Q 15 2 30 14 T 60 8 T 90 12 T 100 10" 
                      fill="none" 
                      stroke="#3b82f6" 
                      strokeWidth="0.45" 
                      className="animate-pulse"
                    />
                    {/* Emerald download wave path */}
                    <path 
                      d="M 0 14 Q 10 18 25 6 T 50 14 T 75 4 T 100 12" 
                      fill="none" 
                      stroke="#10b981" 
                      strokeWidth="0.55" 
                      className="animate-pulse"
                    />
                  </svg>
                  <div className="absolute bottom-2 left-3 text-[8px] font-mono text-slate-500 font-bold uppercase">
                    SYSCORE TRUNK OK • REALTIME FEED • 10s POLLING
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AlertFeed 
                  alerts={alerts}
                  onAcknowledge={handleAcknowledgeAlert}
                  onResolve={handleResolveAlert}
                  onInjectSimulatedAlert={handleInjectAlert}
                />
                <EscalationEngine 
                  activeIncidents={incidents}
                  onTriggerVoiceCall={(branch, device, elapsed, id) => {
                    triggerVoiceCallAlert(branch, device, elapsed, id);
                  }}
                />
              </div>
            </div>
          )}

          {activeTab === 'designer' && (
            <EscalationDesigner />
          )}

          {activeTab === 'roster' && (
            <OnCallRoster 
              onTriggerVoiceCall={triggerVoiceCallAlert} 
              activeIncidentsCount={activeIncidentsCount} 
            />
          )}

          {activeTab === 'simulator' && (
            <IncidentReplayDVR 
              onSimulateOutage={handleSimulateOutage}
              onRestoreAll={handleRestoreAll}
            />
          )}

          {activeTab === 'assets' && (
            <DeviceInventoryGrid />
          )}

          {activeTab === 'history' && (
            <IncidentHistoryLog 
              incidents={incidents}
              onResolveIncident={handleResolveIncident}
            />
          )}

        </div>

      </div>

      {/* Persistent Floating Absa AI Assistant */}
      <GizaAssistant 
        dashboardState={dashboardState}
      />

      {/* Dynamic Voice Call Simulator */}
      {isCallOpen && callData && (
        <IncomingCallOverlay 
          isOpen={isCallOpen}
          onClose={() => setIsCallOpen(false)}
          branchName={callData.branchName}
          deviceName={callData.deviceName}
          elapsedMinutes={callData.elapsedMinutes}
          incidentId={callData.incidentId}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-[10px] font-mono text-slate-400">
        <div>ABSA Bank Zambia PLC • Confidential NOC Internal Environment • Authorized Access Only</div>
        <div className="mt-1 text-slate-400">Telemetry engine synced via ABSA SD-WAN controllers • Copilot model Absa AI Agent v2.5</div>
      </footer>

    </div>
  );
}
