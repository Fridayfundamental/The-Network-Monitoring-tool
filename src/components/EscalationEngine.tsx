import { useState } from 'react';
import { Incident } from '../types';
import { Send, PhoneCall, AlertOctagon, UserCheck, ShieldCheck, Clock, Settings, CheckCircle, Radio } from 'lucide-react';

interface EscalationEngineProps {
  activeIncidents: Incident[];
  onTriggerVoiceCall: (branchName: string, deviceName: string, elapsedMinutes: number, incidentId: string) => void;
}

export default function EscalationEngine({ activeIncidents, onTriggerVoiceCall }: EscalationEngineProps) {
  const criticalOutages = activeIncidents.filter(i => i.severity === 'CRITICAL' && i.status === 'open');

  // Interactive Escalation Protocol Config State
  const [telegramContact, setTelegramContact] = useState("Tier-1 Duty Ops (@absa_tier1_noc)");
  const [followupContact, setFollowupContact] = useState("Senior SD-WAN Specialist (@absa_sr_eng)");
  const [callContact, setCallContact] = useState("NOC Manager Duty Phone (+260 971 552011)");
  const [managerContact, setManagerContact] = useState("Head of IT Infrastructure (ops_head@absa.co.zm)");

  const [telegramMin, setTelegramMin] = useState(0);
  const [followupMin, setFollowupMin] = useState(15);
  const [callMin, setCallMin] = useState(30);
  const [managerMin, setManagerMin] = useState(45);

  const [isConfiguring, setIsConfiguring] = useState(false);
  const [testNotification, setTestNotification] = useState<string | null>(null);

  const handleTriggerTestPage = async (channel: string, recipient: string) => {
    const isVoice = channel.toLowerCase().includes("voice") || channel.toLowerCase().includes("twilio") || channel.toLowerCase().includes("call");
    
    // If it's a voice call test trigger, fire real Twilio API call and open live in-app simulator
    if (isVoice) {
      const activeOutage = criticalOutages[0] || activeIncidents[0];
      const branchName = activeOutage?.branchName || "Solwezi Mining Hub";
      const deviceName = activeOutage?.device || "Industrial UPS 10kVA";
      const elapsedMins = activeOutage?.elapsedMinutes || 30;

      const savedSid = localStorage.getItem('absa_twilio_sid') || 'AC15c036325c5fd25f898c861f30767ba3';
      const savedToken = localStorage.getItem('absa_twilio_token') || '';
      const savedFrom = localStorage.getItem('absa_twilio_from') || '+17373880767';
      const savedTo = localStorage.getItem('absa_twilio_to') || '+260761755780';

      if (!savedToken) {
        setTestNotification(`⚠️ Twilio Auth Token missing! Open the "Designer" tab -> "Twilio Gateway" to enter your Auth Token.`);
        setTimeout(() => setTestNotification(null), 8000);
      } else {
        setTestNotification(`☎️ Initiating real Twilio outbound call to ${savedTo}...`);
        try {
          const res = await fetch('/api/twilio/call', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              accountSid: savedSid,
              authToken: savedToken,
              fromNumber: savedFrom,
              toNumber: savedTo,
              message: `Emergency Alert from ASABB Bank Zambia NOC. Critical network outage at ${branchName}. Device ${deviceName} is offline for ${elapsedMins} minutes. Please review dashboard immediately.`
            })
          });
          const data = await res.json();
          if (res.ok) {
            setTestNotification(`✅ Outbound call placed successfully! Call SID: ${data.callSid}`);
          } else {
            setTestNotification(`❌ Twilio Call Failed: ${data.error || 'Check Auth Token'}`);
          }
        } catch (err: any) {
          setTestNotification(`❌ Error triggering Twilio call: ${err.message}`);
        }
        setTimeout(() => setTestNotification(null), 7000);
      }

      onTriggerVoiceCall(
        branchName,
        deviceName,
        elapsedMins,
        activeOutage?.id || "INC-2041"
      );
    } else {
      setTestNotification(`☎️ Simulated test page successfully routed to [${channel}] -> Recipient: ${recipient}`);
      setTimeout(() => {
        setTestNotification(null);
      }, 4500);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
      
      {/* Header */}
      <div className="border-b border-slate-100 pb-4 mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-[10px] uppercase tracking-[0.15em] text-slate-400 font-bold mb-1">
            Escalation Watchdog & Matrix
          </h3>
          <p className="font-sans text-xs text-slate-600">
            Automated SLA watchdog and multi-channel paging timelines (T+ minutes)
          </p>
        </div>
        <button
          onClick={() => setIsConfiguring(!isConfiguring)}
          className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-bold border transition-colors cursor-pointer shadow-sm ${
            isConfiguring 
              ? 'bg-[#DA0000] text-white border-transparent' 
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Settings className="h-3.5 w-3.5" />
          <span>{isConfiguring ? 'Close Config' : 'Configure Protocol'}</span>
        </button>
      </div>

      {/* Test Page Notification Banner */}
      {testNotification && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded p-3 text-xs text-emerald-800 font-medium flex items-center gap-2 animate-pulse">
          <CheckCircle className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
          <span>{testNotification}</span>
        </div>
      )}

      {/* Live Configuration Panel Form */}
      {isConfiguring && (
        <div className="mb-6 rounded-lg bg-slate-50 p-4 border border-slate-200 transition-all">
          <p className="text-[10px] font-bold text-[#DA0000] uppercase tracking-wider mb-3">
            🔧 Setup Escalation Routing & Paging Thresholds
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Step 1 config */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Level-1 Channel (Telegram Group)</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={telegramContact} 
                  onChange={(e) => setTelegramContact(e.target.value)}
                  className="flex-1 rounded border border-slate-200 bg-white px-2 py-1 text-slate-800"
                />
                <input 
                  type="number" 
                  value={telegramMin} 
                  onChange={(e) => setTelegramMin(Number(e.target.value))}
                  className="w-12 rounded border border-slate-200 bg-white px-1 py-1 text-center font-mono"
                  title="Trigger Minutes"
                />
              </div>
            </div>

            {/* Step 2 config */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Level-2 Channel (Senior Follow-up)</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={followupContact} 
                  onChange={(e) => setFollowupContact(e.target.value)}
                  className="flex-1 rounded border border-slate-200 bg-white px-2 py-1 text-slate-800"
                />
                <input 
                  type="number" 
                  value={followupMin} 
                  onChange={(e) => setFollowupMin(Number(e.target.value))}
                  className="w-12 rounded border border-slate-200 bg-white px-1 py-1 text-center font-mono"
                />
              </div>
            </div>

            {/* Step 3 config */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Level-3 Channel (Twilio Voice Call)</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={callContact} 
                  onChange={(e) => setCallContact(e.target.value)}
                  className="flex-1 rounded border border-slate-200 bg-white px-2 py-1 text-slate-800"
                />
                <input 
                  type="number" 
                  value={callMin} 
                  onChange={(e) => setCallMin(Number(e.target.value))}
                  className="w-12 rounded border border-slate-200 bg-white px-1 py-1 text-center font-mono"
                />
              </div>
            </div>

            {/* Step 4 config */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Level-4 Channel (Executive Pager)</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={managerContact} 
                  onChange={(e) => setManagerContact(e.target.value)}
                  className="flex-1 rounded border border-slate-200 bg-white px-2 py-1 text-slate-800"
                />
                <input 
                  type="number" 
                  value={managerMin} 
                  onChange={(e) => setManagerMin(Number(e.target.value))}
                  className="w-12 rounded border border-slate-200 bg-white px-1 py-1 text-center font-mono"
                />
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500 font-medium">
            <span>✅ Adjustments save instantly in live memory simulator.</span>
            <button
              onClick={() => handleTriggerTestPage("Voice Call Gateway", callContact)}
              className="rounded bg-slate-200 text-slate-800 px-3 py-1 font-bold hover:bg-slate-300 transition-colors cursor-pointer"
            >
              Test Voice Dispatcher 📞
            </button>
          </div>
        </div>
      )}

      {/* Escalation Matrix Reference Policy */}
      <div className="mb-6 rounded-lg bg-slate-50 p-4 border border-slate-200">
        <div className="flex justify-between items-center mb-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Critical Incident Paging Protocol
          </p>
          <span className="text-[9px] font-mono font-bold text-[#DA0000]">ACTIVE MATRIX</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
          {/* Step 1 */}
          <div className="flex items-start gap-2 border-l-2 border-[#DA0000] pl-3 justify-between">
            <div>
              <div className="text-slate-400 text-[10px] font-bold">T+{telegramMin}m</div>
              <p className="font-bold text-slate-900">Telegram</p>
              <p className="text-[9px] text-slate-500 truncate max-w-[140px]">{telegramContact}</p>
            </div>
            <button 
              onClick={() => handleTriggerTestPage("Telegram API", telegramContact)}
              className="text-[9px] bg-red-50 text-[#DA0000] px-1 rounded border border-red-100 hover:bg-red-100 font-bold self-start mt-0.5"
            >
              Test
            </button>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-2 border-l-2 border-amber-500 pl-3 justify-between">
            <div>
              <div className="text-slate-400 text-[10px] font-bold">T+{followupMin}m</div>
              <p className="font-bold text-slate-900">Follow-up</p>
              <p className="text-[9px] text-slate-500 truncate max-w-[140px]">{followupContact}</p>
            </div>
            <button 
              onClick={() => handleTriggerTestPage("Email Push", followupContact)}
              className="text-[9px] bg-red-50 text-[#DA0000] px-1 rounded border border-red-100 hover:bg-red-100 font-bold self-start mt-0.5"
            >
              Test
            </button>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-2 border-l-2 border-orange-500 pl-3 justify-between">
            <div>
              <div className="text-slate-400 text-[10px] font-bold">T+{callMin}m</div>
              <p className="font-bold text-slate-900">Voice Call 📞</p>
              <p className="text-[9px] text-slate-500 truncate max-w-[140px]">{callContact}</p>
            </div>
            <button 
              onClick={() => handleTriggerTestPage("Twilio Voice Link", callContact)}
              className="text-[9px] bg-red-50 text-[#DA0000] px-1 rounded border border-red-100 hover:bg-red-100 font-bold self-start mt-0.5"
            >
              Test
            </button>
          </div>

          {/* Step 4 */}
          <div className="flex items-start gap-2 border-l-2 border-red-600 pl-3 justify-between">
            <div>
              <div className="text-slate-400 text-[10px] font-bold">T+{managerMin}m</div>
              <p className="font-bold text-slate-900">Executive 🔺</p>
              <p className="text-[9px] text-slate-500 truncate max-w-[140px]">{managerContact}</p>
            </div>
            <button 
              onClick={() => handleTriggerTestPage("SMTP Relay Alert", managerContact)}
              className="text-[9px] bg-red-50 text-[#DA0000] px-1 rounded border border-red-100 hover:bg-red-100 font-bold self-start mt-0.5"
            >
              Test
            </button>
          </div>
        </div>
      </div>

      {/* Active Escalation Timelines list */}
      <div className="space-y-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Active Timelines ({criticalOutages.length})
        </p>

        {criticalOutages.length > 0 ? (
          criticalOutages.map(incident => {
            // Calculate active stage percentage
            let percentage = 0;
            if (incident.escalationStep === 'telegram') percentage = 25;
            else if (incident.escalationStep === 'followup') percentage = 50;
            else if (incident.escalationStep === 'call') percentage = 75;
            else if (incident.escalationStep === 'manager') percentage = 100;

            return (
              <div 
                key={incident.id}
                className="rounded-lg bg-slate-50 p-4 border border-slate-200"
              >
                {/* Outage label */}
                <div className="flex items-center justify-between text-xs mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#DA0000]"></span>
                    </span>
                    <span className="font-bold text-slate-900 truncate">
                      {incident.branchName}
                    </span>
                    <span className="font-mono text-[9px] text-slate-400 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                      #{incident.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 font-mono text-slate-500 text-[10px] shrink-0">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>Elapsed: {incident.elapsedMinutes}m</span>
                  </div>
                </div>

                {/* Horizontal Progress Timeline */}
                <div className="relative mt-6 mb-4">
                  
                  {/* Background Track Line */}
                  <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -translate-y-1/2 rounded-full"></div>
                  
                  {/* Filled Track Line */}
                  <div 
                    className="absolute top-1/2 left-0 h-1 bg-[#DA0000] -translate-y-1/2 rounded-full transition-all duration-1000"
                    style={{ width: `${percentage}%` }}
                  ></div>

                  {/* Milestones circles */}
                  <div className="relative flex justify-between">
                    
                    {/* Milestone 1: Telegram */}
                    {incident.milestones.map((milestone, idx) => {
                      const isComplete = milestone.status === 'sent';
                      const isActive = milestone.status === 'active';

                      let circleBg = 'bg-white border-slate-200 text-slate-400';
                      let labelColor = 'text-slate-400';

                      if (isComplete) {
                        circleBg = 'bg-emerald-50 border-emerald-500 text-emerald-600 shadow-sm';
                        labelColor = 'text-emerald-600 font-bold';
                      } else if (isActive) {
                        circleBg = 'bg-red-50 border-red-500 text-[#DA0000] shadow-sm animate-pulse';
                        labelColor = 'text-[#DA0000] font-bold';
                      }

                      // Link current configured values
                      const configuredMin = milestone.step === 'telegram' ? telegramMin :
                                           milestone.step === 'followup' ? followupMin :
                                           milestone.step === 'call' ? callMin : managerMin;

                      return (
                        <div key={milestone.step} className="flex flex-col items-center">
                          {/* Circle Node */}
                          <div className={`z-10 flex h-7 w-7 items-center justify-center rounded-full border-[1.5px] text-xs font-bold transition-all duration-300 ${circleBg}`}>
                            {milestone.step === 'telegram' ? <Send className="h-3 w-3" /> :
                             milestone.step === 'followup' ? <Send className="h-3 w-3" /> :
                             milestone.step === 'call' ? <PhoneCall className="h-3 w-3" /> :
                             <AlertOctagon className="h-3.5 w-3.5" />}
                          </div>
                          
                          {/* Label below */}
                          <p className={`mt-2 font-mono text-[8px] uppercase tracking-wider ${labelColor}`}>
                            {milestone.label.replace(" Sent", "").replace(" Logged", "")}
                          </p>
                          <p className="font-mono text-[8px] text-slate-400 mt-0.5">
                            T+{configuredMin}m {isComplete ? '✓' : ''}
                          </p>
                        </div>
                      );
                    })}

                  </div>
                </div>

                {/* Technical System Output Line */}
                <div className="rounded bg-slate-100 px-2.5 py-1.5 font-mono text-[9px] text-slate-500 border border-slate-200">
                  <span className="text-[#DA0000] font-bold mr-1">&gt;</span> Paging sequence active on <b>{incident.escalationStep.toUpperCase()}</b> level. Contact routing functional.
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
            <ShieldCheck className="h-6 w-6 text-emerald-500 opacity-60" />
            <p className="mt-2 font-sans text-xs text-slate-700 font-bold">
              Matrix Idle
            </p>
            <p className="mt-0.5 text-[10px] text-slate-400">
              No active SLA breaches requiring escalations.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
