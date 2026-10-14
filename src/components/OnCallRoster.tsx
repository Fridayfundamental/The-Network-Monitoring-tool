import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Phone, 
  Send, 
  Mail, 
  Check, 
  ToggleLeft, 
  ToggleRight, 
  ShieldCheck, 
  Radio, 
  Plus, 
  Trash2, 
  AlertTriangle,
  UserCheck,
  Shield,
  Briefcase,
  Clock,
  ExternalLink
} from 'lucide-react';

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  level: 1 | 2 | 3 | 4; // 1: NOC Tech, 2: Specialist, 3: Manager, 4: Executive
  status: 'on-duty' | 'standby' | 'off-duty';
  phone: string;
  telegram: string;
  email: string;
  avatarColor: string;
}

interface OnCallRosterProps {
  onTriggerVoiceCall: (branchName: string, deviceName: string, elapsedMinutes: number, incidentId: string) => void;
  activeIncidentsCount: number;
}

export default function OnCallRoster({ onTriggerVoiceCall, activeIncidentsCount }: OnCallRosterProps) {
  // Local storage persistence so adjustments stick during live demos and browser refreshes
  const [staff, setStaff] = useState<StaffMember[]>(() => {
    const cached = localStorage.getItem('absa_noc_staff_roster');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error("Failed to parse cached staff roster", e);
      }
    }
    return [
      {
        id: '1',
        name: 'Mwansa Mwape',
        role: 'Lead NOC Controller (Shift Alpha)',
        level: 1,
        status: 'on-duty',
        phone: '+260 971 112233',
        telegram: '@mwansa_ops',
        email: 'm.mwape@absa.co.zm',
        avatarColor: 'bg-emerald-600'
      },
      {
        id: '2',
        name: 'Chileshe Mulenga',
        role: 'Junior NOC Specialist (Tier-1)',
        level: 1,
        status: 'standby',
        phone: '+260 971 445566',
        telegram: '@chileshe_ops',
        email: 'c.mulenga@absa.co.zm',
        avatarColor: 'bg-blue-600'
      },
      {
        id: '3',
        name: 'Sampa Banda',
        role: 'Systems Telemetry Assistant',
        level: 1,
        status: 'off-duty',
        phone: '+260 971 778899',
        telegram: '@sampa_ops',
        email: 's.banda@absa.co.zm',
        avatarColor: 'bg-slate-500'
      },
      {
        id: '4',
        name: 'Kabaso Musonda',
        role: 'Senior SD-WAN & Cisco Expert',
        level: 2,
        status: 'on-duty',
        phone: '+260 975 221144',
        telegram: '@kabaso_sdwan',
        email: 'k.musonda@absa.co.zm',
        avatarColor: 'bg-violet-600'
      },
      {
        id: '5',
        name: 'Sibajene Mudenda',
        role: 'Fiber Optical Lines Consultant',
        level: 2,
        status: 'standby',
        phone: '+260 975 558877',
        telegram: '@sibajene_net',
        email: 's.mudenda@absa.co.zm',
        avatarColor: 'bg-amber-600'
      },
      {
        id: '6',
        name: 'Victor Chansa',
        role: 'Duty Incident Commander & NOC Lead',
        level: 3,
        status: 'on-duty',
        phone: '+260 977 552011',
        telegram: '@victor_absa',
        email: 'victor.chansa@absa.co.zm',
        avatarColor: 'bg-rose-700 font-extrabold'
      },
      {
        id: '7',
        name: 'Mutale Chilufya',
        role: 'NOC Manager / Incident Manager',
        level: 3,
        status: 'standby',
        phone: '+260 977 990011',
        telegram: '@mutale_incidents',
        email: 'm.chilufya@absa.co.zm',
        avatarColor: 'bg-indigo-600'
      },
      {
        id: '8',
        name: 'Dr. Clement Phiri',
        role: 'Chief Information Officer (CIO)',
        level: 4,
        status: 'on-duty',
        phone: '+260 966 881122',
        telegram: '@clement_phiri_cio',
        email: 'clement.phiri@absa.co.zm',
        avatarColor: 'bg-red-700'
      },
      {
        id: '9',
        name: 'Nasilele Mwanamwambwa',
        role: 'Head of IT Infrastructure & Cyber',
        level: 4,
        status: 'standby',
        phone: '+260 966 554433',
        telegram: '@nasilele_ops',
        email: 'n.mwanamwambwa@absa.co.zm',
        avatarColor: 'bg-cyan-600'
      }
    ];
  });

  // Save changes to localStorage on change
  useEffect(() => {
    localStorage.setItem('absa_noc_staff_roster', JSON.stringify(staff));
  }, [staff]);

  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | '1' | '2' | '3' | '4'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'on-duty' | 'standby' | 'off-duty'>('all');

  // Form State for Adding New staff
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newLevel, setNewLevel] = useState<1 | 2 | 3 | 4>(1);
  const [newStatus, setNewStatus] = useState<'on-duty' | 'standby' | 'off-duty'>('on-duty');
  const [newPhone, setNewPhone] = useState('');
  const [newTelegram, setNewTelegram] = useState('');
  const [newEmail, setNewEmail] = useState('');

  // Dispatch simulations
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Quick Action: Add staff member
  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newRole.trim()) {
      alert("Name and Role fields are required.");
      return;
    }

    const colorPresets = [
      'bg-red-600', 'bg-emerald-600', 'bg-blue-600', 'bg-purple-600', 
      'bg-amber-600', 'bg-indigo-600', 'bg-teal-600', 'bg-rose-600'
    ];
    const randomColor = colorPresets[Math.floor(Math.random() * colorPresets.length)];

    const newMember: StaffMember = {
      id: Date.now().toString(),
      name: newName.trim(),
      role: newRole.trim(),
      level: newLevel,
      status: newStatus,
      phone: newPhone.trim() || '+260 97' + Math.floor(1000000 + Math.random() * 9000000),
      telegram: newTelegram.trim().startsWith('@') ? newTelegram.trim() : newTelegram.trim() ? '@' + newTelegram.trim() : '@absa_user',
      email: newEmail.trim() || `${newName.trim().toLowerCase().replace(' ', '.')}@absa.co.zm`,
      avatarColor: randomColor
    };

    setStaff(prev => [...prev, newMember]);
    
    // Auto-update Escalation Designer credentials in localStorage if they added a Twilio target phone
    if (newLevel === 3 && newStatus === 'on-duty' && newPhone.trim()) {
      localStorage.setItem('absa_twilio_to', newPhone.trim());
      triggerToast(`👤 Added ${newName} & synced as active on-call Voice Commander phone: ${newPhone}`);
    } else {
      triggerToast(`👤 Added team member: ${newName}`);
    }

    // Reset Form
    setNewName('');
    setNewRole('');
    setNewLevel(1);
    setNewStatus('on-duty');
    setNewPhone('');
    setNewTelegram('');
    setNewEmail('');
    setIsAdding(false);
  };

  // Quick Action: Delete staff member
  const handleDeleteStaff = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove ${name} from the NOC On-Call Roster?`)) {
      setStaff(prev => prev.filter(s => s.id !== id));
      triggerToast(`🗑️ Removed ${name} from on-call roster.`);
    }
  };

  // Change individual duty status
  const handleToggleStatus = (id: string, currentStatus: StaffMember['status']) => {
    const nextStatusMap: Record<StaffMember['status'], StaffMember['status']> = {
      'on-duty': 'standby',
      'standby': 'off-duty',
      'off-duty': 'on-duty'
    };
    const nextStatus = nextStatusMap[currentStatus];
    
    setStaff(prev => prev.map(s => {
      if (s.id === id) {
        // If switching to on-duty for Level 3, sync their phone with the Twilio dialer!
        if (nextStatus === 'on-duty' && s.level === 3) {
          localStorage.setItem('absa_twilio_to', s.phone);
          // Highlight this active sync
          setTimeout(() => {
            triggerToast(`🔄 Synced active on-call commander voice target: ${s.name} (${s.phone})`);
          }, 100);
        }
        return { ...s, status: nextStatus };
      }
      return s;
    }));
  };

  // Test dispatches
  const handleTestCall = async (member: StaffMember) => {
    triggerToast(`📞 Testing voice dispatch to ${member.name} (${member.phone})...`);

    // Fetch live credentials if cached to attempt a real Twilio call
    const sid = localStorage.getItem('absa_twilio_sid')?.trim();
    const token = localStorage.getItem('absa_twilio_token')?.trim();
    const fromNum = localStorage.getItem('absa_twilio_from')?.trim();
    const toNum = member.phone; // Direct call to this engineer!

    if (sid && token && fromNum) {
      try {
        const res = await fetch('/api/twilio/call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accountSid: sid,
            authToken: token,
            fromNumber: fromNum,
            toNumber: toNum,
            message: `Greetings ${member.name}. This is an urgent Sentinel NOC alert for Absa Bank Zambia. Multiple router interfaces have collapsed. Your immediate attendance is required to verify core transaction flow status.`
          })
        });
        const data = await res.json();
        if (res.ok) {
          triggerToast(`🟢 Live Twilio outbound call triggered successfully to ${member.name}!`);
          return;
        } else {
          console.error("Twilio live call failed from roster", data);
        }
      } catch (err) {
        console.error("HTTP error triggering call", err);
      }
    }

    // Fallback to our gorgeous UI call simulator overlay!
    onTriggerVoiceCall(
      "Cairo HQ Data Loop",
      "Core Gateway SD-WAN Router",
      45,
      `INC-${Math.floor(1000 + Math.random() * 9000)}`
    );
  };

  const handleTestTelegram = async (member: StaffMember) => {
    triggerToast(`💬 Dispatched emergency Telegram notification to handle ${member.telegram}...`);
    
    const botToken = localStorage.getItem('absa_telegram_bot_token')?.trim();
    const chatId = localStorage.getItem('absa_telegram_chat_id')?.trim();

    if (botToken && chatId) {
      try {
        const res = await fetch('/api/telegram/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            botToken: botToken,
            chatId: chatId,
            message: `⚡ *NOC DIRECT PAGE TO SPECIALIST* ⚡\n\n*Recipient:* ${member.name} (${member.role})\n*Level:* On-Call Level ${member.level}\n*Status:* ${member.status.toUpperCase()}\n*Message:* Please check the Absa Zambia central SD-WAN digital twins. High packet loss detected on regional lines.\n\n_Dispatched via Enterprise Roster Console_`
          })
        });
        if (res.ok) {
          triggerToast(`🟢 Telegram live alert pushed successfully to group synced with ${member.name}!`);
          return;
        }
      } catch (err) {
        console.error("Telegram error", err);
      }
    }

    // Mock confirmation if not fully connected
    setTimeout(() => {
      triggerToast(`✓ Simulated Telegram alert dispatched to [${member.telegram}]`);
    }, 1000);
  };

  const handleTestEmail = (member: StaffMember) => {
    triggerToast(`✉️ Drafted SLA Incident Briefing sent to [${member.email}]`);
  };

  // Filter staff members
  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          member.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          member.phone.includes(searchQuery) ||
                          member.telegram.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = levelFilter === 'all' || member.level.toString() === levelFilter;
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;

    return matchesSearch && matchesLevel && matchesStatus;
  });

  const getLevelLabel = (level: 1 | 2 | 3 | 4) => {
    switch (level) {
      case 1: return { name: 'Level 1: NOC Technicians', color: 'text-emerald-700 bg-emerald-50 border-emerald-100' };
      case 2: return { name: 'Level 2: Systems Specialists', color: 'text-blue-700 bg-blue-50 border-blue-100' };
      case 3: return { name: 'Level 3: Shift Duty Managers', color: 'text-amber-700 bg-amber-50 border-amber-100' };
      case 4: return { name: 'Level 4: CIO / Executive Director', color: 'text-rose-700 bg-rose-50 border-rose-100' };
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative overflow-visible">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 bg-slate-900 border border-slate-800 text-white text-xs font-mono font-semibold px-4 py-3 rounded-lg flex items-center gap-2.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <Radio className="h-4 w-4 text-[#DA0000] animate-pulse shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Roster Header and Meta */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="bg-[#DA0000]/10 p-1.5 rounded-lg border border-[#DA0000]/20">
              <Users className="h-5 w-5 text-[#DA0000]" />
            </div>
            <div>
              <h3 className="text-sm uppercase tracking-[0.15em] text-slate-800 font-extrabold flex items-center gap-2">
                <span>Enterprise On-Call & Incident Roster</span>
                <span className="text-[10px] bg-[#DA0000] text-white px-1.5 py-0.2 rounded font-mono font-bold tracking-normal animate-pulse">
                  PRESENTER MODE
                </span>
              </h3>
              <p className="font-sans text-xs text-slate-500 mt-1">
                Absa Zambia corporate dispatch directory. Staff toggled "On-Duty" are dynamically routed for emergency system escalations.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold text-white bg-[#DA0000] hover:bg-red-700 transition-colors shadow-sm cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            <span>{isAdding ? 'Close Roster Add' : 'Add Personnel'}</span>
          </button>
        </div>
      </div>

      {/* Corporate Summary of On-Duty Roles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((levelNum) => {
          const levelInfo = getLevelLabel(levelNum as 1 | 2 | 3 | 4);
          const onDutyInLevel = staff.filter(s => s.level === levelNum && s.status === 'on-duty');
          const totalInLevel = staff.filter(s => s.level === levelNum).length;

          return (
            <div key={levelNum} className="rounded-lg bg-slate-50/70 border border-slate-200/85 p-3.5 flex flex-col justify-between font-sans">
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                  On Duty L{levelNum}
                </p>
                <p className="text-xl font-bold font-mono text-slate-900 mt-1">
                  {onDutyInLevel.length} <span className="text-slate-400 text-xs">/ {totalInLevel} Total</span>
                </p>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-200/50 flex items-center justify-between">
                <span className="text-[9px] text-slate-500 font-medium truncate max-w-[120px]">
                  {onDutyInLevel.length > 0 ? onDutyInLevel[0].name : "None assigned (Alert!)"}
                </span>
                <span className={`h-2 w-2 rounded-full ${onDutyInLevel.length > 0 ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Roster Add Form Segment */}
      {isAdding && (
        <form onSubmit={handleAddStaff} className="mb-6 rounded-xl bg-slate-50 border border-slate-200 p-5 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 mb-2">
            <h4 className="text-[11px] font-mono font-bold text-[#DA0000] uppercase tracking-wider flex items-center gap-1.5">
              <UserPlus className="h-4 w-4" />
              <span>Register New Corporate Telecommunications Target</span>
            </h4>
            <span className="text-[9px] font-mono text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded font-bold">ABSA NOC ID ENROLLMENT</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Full Name</label>
              <input 
                type="text" 
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Victor Chansa Jr"
                className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:border-[#DA0000]/40 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Organizational Title / Role</label>
              <input 
                type="text" 
                required
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                placeholder="e.g. Cisco Routing Lead"
                className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:border-[#DA0000]/40 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Escalation Group / Level</label>
              <select 
                value={newLevel}
                onChange={(e) => setNewLevel(Number(e.target.value) as 1 | 2 | 3 | 4)}
                className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:border-[#DA0000]/40 focus:outline-none"
              >
                <option value={1}>Level 1: NOC Technical Operator (Telegram)</option>
                <option value={2}>Level 2: Systems Specialist Architect</option>
                <option value={3}>Level 3: Shift Duty Commander (Twilio Calls)</option>
                <option value={4}>Level 4: CIO / Executive Stakeholder</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Phone Number (International Format)</label>
              <input 
                type="text" 
                value={newPhone}
                onChange={(newVal) => setNewPhone(newVal.target.value)}
                placeholder="e.g. +260977552011"
                className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-slate-800 font-mono focus:border-[#DA0000]/40 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Telegram Handle (Including @)</label>
              <input 
                type="text" 
                value={newTelegram}
                onChange={(newVal) => setNewTelegram(newVal.target.value)}
                placeholder="e.g. @victor_absa"
                className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-slate-800 font-mono focus:border-[#DA0000]/40 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Enterprise Email Address</label>
              <input 
                type="email" 
                value={newEmail}
                onChange={(newVal) => setNewEmail(newVal.target.value)}
                placeholder="e.g. v.chansa@absa.co.zm"
                className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-slate-800 font-mono focus:border-[#DA0000]/40 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-200">
            <span className="text-[10px] text-slate-500 font-medium">💡 Toggling Level-3 commanders to on-duty auto-updates active Twilio phone lines for real test calls.</span>
            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 rounded text-xs font-bold text-slate-700 bg-slate-200 hover:bg-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 rounded text-xs font-bold text-white bg-[#DA0000] hover:bg-red-700 transition-colors shadow-sm cursor-pointer"
              >
                Enroll Member
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Roster Filters and Search controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-5 bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search staff name, handle, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#DA0000]/40 font-sans"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto items-center">
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
            <button 
              onClick={() => setLevelFilter('all')}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-colors cursor-pointer ${levelFilter === 'all' ? 'bg-[#DA0000] text-white' : 'text-slate-500 hover:text-slate-900'}`}
            >
              All Levels
            </button>
            {[1, 2, 3, 4].map(num => (
              <button 
                key={num}
                onClick={() => setLevelFilter(num.toString() as any)}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-colors cursor-pointer ${levelFilter === num.toString() ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'}`}
                title={`Level ${num}`}
              >
                L{num}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
            <button 
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-colors cursor-pointer ${statusFilter === 'all' ? 'bg-[#DA0000] text-white' : 'text-slate-500 hover:text-slate-900'}`}
            >
              All Duty
            </button>
            <button 
              onClick={() => setStatusFilter('on-duty')}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-colors cursor-pointer ${statusFilter === 'on-duty' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-900'}`}
            >
              On Duty
            </button>
            <button 
              onClick={() => setStatusFilter('standby')}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-colors cursor-pointer ${statusFilter === 'standby' ? 'bg-amber-600 text-white' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Standby
            </button>
          </div>
        </div>
      </div>

      {/* Roster Listing Grid */}
      {filteredStaff.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStaff.map((member) => {
            const levelObj = getLevelLabel(member.level);
            
            return (
              <div 
                key={member.id}
                className={`rounded-xl border p-4.5 font-sans relative flex flex-col justify-between transition-all duration-300 hover:shadow-md ${
                  member.status === 'on-duty' 
                    ? 'border-emerald-500/40 bg-emerald-50/5' 
                    : member.status === 'standby'
                    ? 'border-amber-500/20 bg-amber-50/5'
                    : 'border-slate-200 bg-white opacity-85 hover:opacity-100'
                }`}
              >
                
                {/* Upper Avatar and Meta info */}
                <div>
                  <div className="flex items-start justify-between gap-2.5 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar */}
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-black font-mono shrink-0 select-none shadow-sm ${member.avatarColor}`}>
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-slate-900 text-sm truncate flex items-center gap-1.5">
                          <span>{member.name}</span>
                          {member.status === 'on-duty' && (
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                          )}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-medium truncate flex items-center gap-1 mt-0.5">
                          <Briefcase className="h-3 w-3 text-slate-400 shrink-0" />
                          <span>{member.role}</span>
                        </p>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleDeleteStaff(member.id, member.name)}
                      className="p-1.5 hover:bg-red-50 text-slate-300 hover:text-[#DA0000] rounded transition-colors self-start cursor-pointer"
                      title="Remove Staff"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Level Tag */}
                  <div className="mb-4">
                    <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-md border ${levelObj?.color}`}>
                      {levelObj?.name}
                    </span>
                  </div>

                  {/* Contact channels lists */}
                  <div className="space-y-2 mb-4.5 text-xs font-mono border-t border-b border-slate-100 py-3.5 bg-slate-50/50 -mx-4.5 px-4.5">
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="flex items-center gap-1.5 text-slate-400 font-sans text-[11px]">
                        <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>Phone:</span>
                      </span>
                      <span className="font-semibold text-[11px]">{member.phone}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="flex items-center gap-1.5 text-slate-400 font-sans text-[11px]">
                        <Send className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>Telegram:</span>
                      </span>
                      <span className="font-semibold text-[11px] text-sky-600 hover:underline">{member.telegram}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="flex items-center gap-1.5 text-slate-400 font-sans text-[11px]">
                        <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>Email:</span>
                      </span>
                      <span className="font-semibold text-[11px] truncate max-w-[170px]" title={member.email}>{member.email}</span>
                    </div>
                  </div>
                </div>

                {/* Duty toggle actions and Dispatch tests */}
                <div className="space-y-3.5 pt-1">
                  {/* Status switcher */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-sans text-slate-500 font-semibold flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>Shift State:</span>
                    </span>

                    <button 
                      onClick={() => handleToggleStatus(member.id, member.status)}
                      className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full cursor-pointer transition-colors ${
                        member.status === 'on-duty'
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : member.status === 'standby'
                          ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                      title="Click to cycle status: On-Duty -> Standby -> Off-Duty"
                    >
                      {member.status === 'on-duty' ? '🟢 ON DUTY' : member.status === 'standby' ? '🟡 STANDBY' : '⚪ OFF DUTY'}
                    </button>
                  </div>

                  {/* Paging dispatcher tests */}
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                    {member.level === 3 ? (
                      <button 
                        onClick={() => handleTestCall(member)}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[10px] font-bold bg-rose-50 border border-rose-100 text-[#DA0000] hover:bg-rose-100 transition-colors cursor-pointer shadow-sm"
                        title="Simulates outbound call alert (Twilio voice / call screen)"
                      >
                        <Phone className="h-3 w-3 shrink-0" />
                        <span>Simulate Call</span>
                      </button>
                    ) : member.level === 1 ? (
                      <button 
                        onClick={() => handleTestTelegram(member)}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[10px] font-bold bg-sky-50 border border-sky-100 text-sky-600 hover:bg-sky-100 transition-colors cursor-pointer shadow-sm"
                      >
                        <Send className="h-3 w-3 shrink-0" />
                        <span>Telegram Page</span>
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleTestEmail(member)}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer shadow-sm border border-slate-200"
                      >
                        <Mail className="h-3 w-3 shrink-0" />
                        <span>Email Dispatch</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/40">
          <AlertTriangle className="h-8 w-8 text-slate-300 animate-bounce mb-3" />
          <p className="font-sans text-sm text-slate-700 font-bold">No Personnel Found</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            We couldn't find any team members matching your filter choices. Try clearing search or selecting "All Levels".
          </p>
        </div>
      )}

      {/* SLA Alert Context Banner */}
      <div className="mt-6 rounded-xl border border-red-100 bg-red-50/30 p-4 leading-relaxed flex items-start gap-3 text-xs text-slate-600 font-sans">
        <ShieldCheck className="h-5 w-5 text-[#DA0000] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-900">ABSA Incident Command Redundancy Protocol:</span> When an outage is flagged in the digital twins, SentinelNOC queries this local roster database for **Level 3 (Shift Duty Managers)** who are flagged as <strong className="text-emerald-700">🟢 ON-DUTY</strong>. Outbound Twilio alarms will sequentially dial their phone lines. Toggle managers' state above to dynamically swap the primary responder in live presentations.
        </div>
      </div>

    </div>
  );
}
