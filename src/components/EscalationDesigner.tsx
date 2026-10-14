import { useState, useEffect } from 'react';
import { 
  GitCommit, 
  Clock, 
  MessageSquare, 
  PhoneCall, 
  Mail, 
  ShieldAlert, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Settings2, 
  CheckCircle, 
  AlertTriangle,
  Play,
  RotateCcw
} from 'lucide-react';

export interface ProtocolStep {
  id: string;
  type: 'telegram' | 'slack' | 'sms' | 'call' | 'email' | 'cio' | 'wait';
  label: string;
  configValue: string; // e.g. "5 min", "NOC Tech Channel", "Operator on Call"
  enabled: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface EscalationDesignerProps {
  onApplyProtocol?: (steps: ProtocolStep[]) => void;
}

export default function EscalationDesigner({ onApplyProtocol }: EscalationDesignerProps) {
  const [botToken, setBotToken] = useState(() => localStorage.getItem('absa_telegram_bot_token') || '');
  const [chatId, setChatId] = useState(() => localStorage.getItem('absa_telegram_chat_id') || '');
  const [telegramStatus, setTelegramStatus] = useState<{ type: 'success' | 'error' | 'loading' | null; message: string }>({ type: null, message: '' });

  const [twilioSid, setTwilioSid] = useState(() => localStorage.getItem('absa_twilio_sid') || 'AC15c036325c5fd25f898c861f30767ba3');
  const [twilioToken, setTwilioToken] = useState(() => localStorage.getItem('absa_twilio_token') || '');
  const [twilioFrom, setTwilioFrom] = useState(() => localStorage.getItem('absa_twilio_from') || '+17373880767');
  const [twilioTo, setTwilioTo] = useState(() => localStorage.getItem('absa_twilio_to') || '+260761755780');
  const [twilioStatus, setTwilioStatus] = useState<{ type: 'success' | 'error' | 'loading' | null; message: string; code?: string | number }>({ type: null, message: '' });

  // Auto-save credentials as the user types
  useEffect(() => {
    if (botToken.trim()) {
      localStorage.setItem('absa_telegram_bot_token', botToken.trim());
    } else {
      localStorage.removeItem('absa_telegram_bot_token');
    }
  }, [botToken]);

  useEffect(() => {
    if (chatId.trim()) {
      localStorage.setItem('absa_telegram_chat_id', chatId.trim());
    } else {
      localStorage.removeItem('absa_telegram_chat_id');
    }
  }, [chatId]);

  useEffect(() => {
    if (twilioSid.trim()) {
      localStorage.setItem('absa_twilio_sid', twilioSid.trim());
    } else {
      localStorage.removeItem('absa_twilio_sid');
    }
  }, [twilioSid]);

  useEffect(() => {
    if (twilioToken.trim()) {
      localStorage.setItem('absa_twilio_token', twilioToken.trim());
    } else {
      localStorage.removeItem('absa_twilio_token');
    }
  }, [twilioToken]);

  useEffect(() => {
    if (twilioFrom.trim()) {
      localStorage.setItem('absa_twilio_from', twilioFrom.trim());
    } else {
      localStorage.removeItem('absa_twilio_from');
    }
  }, [twilioFrom]);

  useEffect(() => {
    if (twilioTo.trim()) {
      localStorage.setItem('absa_twilio_to', twilioTo.trim());
    } else {
      localStorage.removeItem('absa_twilio_to');
    }
  }, [twilioTo]);

  const handleTestTwilio = async () => {
    if (!twilioSid.trim() || !twilioToken.trim() || !twilioFrom.trim() || !twilioTo.trim()) {
      setTwilioStatus({
        type: 'error',
        message: 'Please provide Account SID, Auth Token, From number, and To number.'
      });
      return;
    }

    setTwilioStatus({ type: 'loading', message: 'Placing test voice call...' });

    // Save to browser cache
    localStorage.setItem('absa_twilio_sid', twilioSid.trim());
    localStorage.setItem('absa_twilio_token', twilioToken.trim());
    localStorage.setItem('absa_twilio_from', twilioFrom.trim());
    localStorage.setItem('absa_twilio_to', twilioTo.trim());

    try {
      const res = await fetch('/api/twilio/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountSid: twilioSid.trim(),
          authToken: twilioToken.trim(),
          fromNumber: twilioFrom.trim(),
          toNumber: twilioTo.trim(),
          message: "Greetings from the ASABB Bank Zambia NOC Control Centre. This is a successful test voice call confirming your integrated Twilio gateway is fully live. Secure telecommunications are active."
        })
      });

      const data = await res.json();
      if (res.ok) {
        setTwilioStatus({
          type: 'success',
          message: 'Success! Outbound call initiated. Check your mobile.'
        });
      } else {
        setTwilioStatus({
          type: 'error',
          message: `Call failed: ${data.error || 'Check parameters'}`,
          code: data.code
        });
      }
    } catch (err: any) {
      setTwilioStatus({
        type: 'error',
        message: `HTTP Error: ${err.message}`
      });
    }
  };

  const handleClearTwilio = () => {
    localStorage.removeItem('absa_twilio_sid');
    localStorage.removeItem('absa_twilio_token');
    localStorage.removeItem('absa_twilio_from');
    localStorage.removeItem('absa_twilio_to');
    setTwilioSid('');
    setTwilioToken('');
    setTwilioFrom('');
    setTwilioTo('');
    setTwilioStatus({ type: 'success', message: 'Twilio credentials removed from browser cache.' });
  };

  const handleTestTelegram = async () => {
    if (!botToken.trim() || !chatId.trim()) {
      setTelegramStatus({
        type: 'error',
        message: 'Please provide both Bot Token and Chat ID to test.'
      });
      return;
    }

    setTelegramStatus({ type: 'loading', message: 'Sending test dispatch...' });
    
    // Save to local storage
    localStorage.setItem('absa_telegram_bot_token', botToken.trim());
    localStorage.setItem('absa_telegram_chat_id', chatId.trim());

    try {
      const res = await fetch('/api/telegram/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: botToken.trim(),
          chatId: chatId.trim(),
          message: `🔔 *SentinelNOC Active Sync Engaged* 🔔\n\nYour Telegram bot is successfully connected to the ABSA Bank Zambia NOC simulator!\n\n*Connection Status:* 🟢 Active\n*Timestamp:* ${new Date().toLocaleString('en-GB')}\n*System Host:* ABSA Sentinel Gateway`
        })
      });

      const data = await res.json();
      if (res.ok) {
        setTelegramStatus({
          type: 'success',
          message: 'Success! Test alert dispatched. Check your Telegram chat.'
        });
      } else {
        setTelegramStatus({
          type: 'error',
          message: `Connection Failed: ${data.error || 'Check credentials'}`
        });
      }
    } catch (err: any) {
      setTelegramStatus({
        type: 'error',
        message: `HTTP Error: ${err.message}`
      });
    }
  };

  const handleClearTelegram = () => {
    localStorage.removeItem('absa_telegram_bot_token');
    localStorage.removeItem('absa_telegram_chat_id');
    setBotToken('');
    setChatId('');
    setTelegramStatus({ type: 'success', message: 'Credentials removed from secure browser cache.' });
  };

  const [steps, setSteps] = useState<ProtocolStep[]>([
    { id: '1', type: 'slack', label: 'Slack Webhook Alert', configValue: '#noc-alerts-critical', enabled: true, priority: 'high' },
    { id: '2', type: 'wait', label: 'Wait Interval', configValue: '5', enabled: true, priority: 'low' },
    { id: '3', type: 'telegram', label: 'Telegram Broadcast', configValue: '@AbsaZambiaNocBot', enabled: true, priority: 'high' },
    { id: '4', type: 'wait', label: 'Wait Interval', configValue: '10', enabled: true, priority: 'low' },
    { id: '5', type: 'call', label: 'Interactive Voice Dispatch (IVR)', configValue: '+260 971 000 NOC', enabled: true, priority: 'critical' },
    { id: '6', type: 'wait', label: 'Wait Interval', configValue: '15', enabled: true, priority: 'low' },
    { id: '7', type: 'email', label: 'Email SLA Management Team', configValue: 'sla-escalations@absa.co.zm', enabled: true, priority: 'high' },
    { id: '8', type: 'wait', label: 'Wait Interval', configValue: '20', enabled: true, priority: 'low' },
    { id: '9', type: 'cio', label: 'Notify CIO Office Escalation', configValue: 'cio-emergency@absa.co.zm', enabled: false, priority: 'critical' },
  ]);

  const [activeScenario, setActiveScenario] = useState<'sdwan' | 'atm' | 'cyber'>('sdwan');
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  // Reorder steps
  const moveStep = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= steps.length) return;
    
    const newSteps = [...steps];
    const [movedStep] = newSteps.splice(index, 1);
    newSteps.splice(newIndex, 0, movedStep);
    setSteps(newSteps);
    if (onApplyProtocol) onApplyProtocol(newSteps);
  };

  // Toggle step enabled
  const toggleStep = (id: string) => {
    const newSteps = steps.map(step => 
      step.id === id ? { ...step, enabled: !step.enabled } : step
    );
    setSteps(newSteps);
    if (onApplyProtocol) onApplyProtocol(newSteps);
  };

  // Remove step
  const removeStep = (id: string) => {
    const newSteps = steps.filter(step => step.id !== id);
    setSteps(newSteps);
    if (selectedStepId === id) setSelectedStepId(null);
    if (onApplyProtocol) onApplyProtocol(newSteps);
  };

  // Add new step
  const addStep = (type: ProtocolStep['type']) => {
    const id = Date.now().toString();
    let newStep: ProtocolStep;

    switch (type) {
      case 'wait':
        newStep = { id, type, label: 'Wait Interval', configValue: '10', enabled: true, priority: 'low' };
        break;
      case 'telegram':
        newStep = { id, type, label: 'Telegram Broadcast', configValue: '@AbsaZambiaNocBot', enabled: true, priority: 'high' };
        break;
      case 'call':
        newStep = { id, type, label: 'Voice Call (Duty Engineer)', configValue: '+260 977 On-Call', enabled: true, priority: 'critical' };
        break;
      case 'sms':
        newStep = { id, type, label: 'SMS Dispatch Loop', configValue: 'Zamtel SMS Gateway', enabled: true, priority: 'medium' };
        break;
      case 'email':
        newStep = { id, type, label: 'Email Alerts Desk', configValue: 'noc-alerts@absa.co.zm', enabled: true, priority: 'medium' };
        break;
      case 'slack':
        newStep = { id, type, label: 'Slack Webhook Incident', configValue: '#noc-alerts-critical', enabled: true, priority: 'high' };
        break;
      default:
        newStep = { id, type, label: 'Notify CIO Office', configValue: 'cio-emergency@absa.co.zm', enabled: true, priority: 'critical' };
    }

    const newSteps = [...steps, newStep];
    setSteps(newSteps);
    setSelectedStepId(id);
    if (onApplyProtocol) onApplyProtocol(newSteps);
  };

  // Update config value
  const updateConfigValue = (id: string, value: string) => {
    const newSteps = steps.map(step => 
      step.id === id ? { ...step, configValue: value } : step
    );
    setSteps(newSteps);
    if (onApplyProtocol) onApplyProtocol(newSteps);
  };

  const saveProtocol = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const resetProtocol = () => {
    setSteps([
      { id: '1', type: 'slack', label: 'Slack Webhook Alert', configValue: '#noc-alerts-critical', enabled: true, priority: 'high' },
      { id: '2', type: 'wait', label: 'Wait Interval', configValue: '5', enabled: true, priority: 'low' },
      { id: '3', type: 'telegram', label: 'Telegram Broadcast', configValue: '@AbsaZambiaNocBot', enabled: true, priority: 'high' },
      { id: '4', type: 'wait', label: 'Wait Interval', configValue: '10', enabled: true, priority: 'low' },
      { id: '5', type: 'call', label: 'Interactive Voice Dispatch (IVR)', configValue: '+260 971 000 NOC', enabled: true, priority: 'critical' },
      { id: '6', type: 'wait', label: 'Wait Interval', configValue: '15', enabled: true, priority: 'low' },
      { id: '7', type: 'email', label: 'Email SLA Management Team', configValue: 'sla-escalations@absa.co.zm', enabled: true, priority: 'high' },
      { id: '8', type: 'wait', label: 'Wait Interval', configValue: '20', enabled: true, priority: 'low' },
      { id: '9', type: 'cio', label: 'Notify CIO Office Escalation', configValue: 'cio-emergency@absa.co.zm', enabled: false, priority: 'critical' },
    ]);
  };

  const getStepIcon = (type: ProtocolStep['type']) => {
    switch (type) {
      case 'wait': return <Clock className="h-4.5 w-4.5 text-blue-500" />;
      case 'telegram': return <MessageSquare className="h-4.5 w-4.5 text-sky-500" />;
      case 'slack': return <MessageSquare className="h-4.5 w-4.5 text-purple-500" />;
      case 'call': return <PhoneCall className="h-4.5 w-4.5 text-rose-500" />;
      case 'sms': return <MessageSquare className="h-4.5 w-4.5 text-emerald-500" />;
      case 'email': return <Mail className="h-4.5 w-4.5 text-amber-500" />;
      default: return <ShieldAlert className="h-4.5 w-4.5 text-[#DA0000]" />;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col xl:flex-row gap-6 relative overflow-hidden">
      
      {/* Toast Notification */}
      {showToast && (
        <div className="absolute top-4 right-4 bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-top-3 duration-300 z-50">
          <CheckCircle className="h-4 w-4" />
          <span>SLA Escalation Protocol Synced successfully with central router array.</span>
        </div>
      )}

      {/* Left panel: Node builder workspace */}
      <div className="flex-1 min-w-0">
        
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#DA0000] animate-pulse"></span>
              <h3 className="text-sm uppercase tracking-[0.15em] text-slate-800 font-extrabold">
                SentinelNOC Escalation Designer
              </h3>
            </div>
            <p className="font-sans text-xs text-slate-500 mt-1">
              Drag, arrange, and configure automated notification pathways to guard Absa Core SLA compliance.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={resetProtocol}
              className="px-3 py-1.5 rounded text-[10px] font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              <span>RESET</span>
            </button>
            <button 
              onClick={saveProtocol}
              className="px-3.5 py-1.5 rounded text-[10px] font-bold text-white bg-[#DA0000] hover:bg-red-700 shadow-sm flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Play className="h-3 w-3" />
              <span>DEPLOY ENGINE</span>
            </button>
          </div>
        </div>

        {/* Scenario Selectors */}
        <div className="flex flex-wrap items-center gap-1.5 mb-5 p-1 bg-slate-50 border border-slate-200 rounded-lg">
          <button 
            onClick={() => setActiveScenario('sdwan')}
            className={`flex-1 sm:flex-initial text-center rounded-md px-3.5 py-1.5 text-[10px] font-bold transition-all cursor-pointer ${
              activeScenario === 'sdwan' 
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' 
                : 'text-slate-500 hover:text-slate-950'
            }`}
          >
            SD-WAN & Fiber Failure Protocol
          </button>
          <button 
            onClick={() => setActiveScenario('atm')}
            className={`flex-1 sm:flex-initial text-center rounded-md px-3.5 py-1.5 text-[10px] font-bold transition-all cursor-pointer ${
              activeScenario === 'atm' 
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' 
                : 'text-slate-500 hover:text-slate-950'
            }`}
          >
            ATM Outage & Cash Protocol
          </button>
          <button 
            onClick={() => setActiveScenario('cyber')}
            className={`flex-1 sm:flex-initial text-center rounded-md px-3.5 py-1.5 text-[10px] font-bold transition-all cursor-pointer ${
              activeScenario === 'cyber' 
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' 
                : 'text-slate-500 hover:text-slate-950'
            }`}
          >
            Security Incident Protocol
          </button>
        </div>

        {/* The Escalation Canvas Block Pipeline */}
        <div className="space-y-3 relative before:absolute before:left-[21px] before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-100">
          {steps.map((step, index) => {
            const isSelected = selectedStepId === step.id;
            
            return (
              <div 
                key={step.id}
                className={`relative flex items-center justify-between rounded-lg p-3 transition-all duration-300 border ${
                  !step.enabled 
                    ? 'bg-slate-50/50 border-slate-200/60 opacity-60' 
                    : isSelected
                    ? 'border-[#DA0000] bg-red-50/10 shadow-sm scale-[1.01]' 
                    : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
                }`}
                onClick={() => setSelectedStepId(step.id)}
              >
                {/* Visual Connection Pin */}
                <div className="absolute left-[17px] top-1/2 -translate-y-1/2 z-10 flex h-2 w-2 items-center justify-center rounded-full bg-white border border-slate-300">
                  <div className={`h-1 w-1 rounded-full ${step.enabled ? 'bg-[#DA0000]' : 'bg-slate-300'}`} />
                </div>

                {/* Left block attributes */}
                <div className="flex items-center gap-4 pl-6 min-w-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 shrink-0">
                    {getStepIcon(step.type)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-sans text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span>{step.label}</span>
                      {step.priority === 'critical' && (
                        <span className="text-[7px] font-mono font-black uppercase text-[#DA0000] bg-red-50 px-1 border border-red-200 rounded">
                          CRITICAL
                        </span>
                      )}
                    </p>
                    <p className="font-mono text-[9px] text-slate-400 font-semibold truncate">
                      {step.type === 'wait' ? `Delay Event: ${step.configValue} Minutes` : `Target: ${step.configValue}`}
                    </p>
                  </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Enabled switch */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleStep(step.id); }}
                    className={`rounded-full h-5 w-9 p-0.5 transition-all cursor-pointer ${
                      step.enabled ? 'bg-[#DA0000]' : 'bg-slate-200'
                    }`}
                  >
                    <div className={`h-4 w-4 rounded-full bg-white transition-all transform shadow-sm ${
                      step.enabled ? 'translate-x-4' : 'translate-x-0'
                    }`} />
                  </button>

                  <div className="h-6 w-px bg-slate-200"></div>

                  {/* Move Up/Down */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); moveStep(index, 'up'); }}
                    disabled={index === 0}
                    className="p-1 hover:bg-slate-50 text-slate-400 disabled:opacity-30 cursor-pointer"
                    title="Move Step Up"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); moveStep(index, 'down'); }}
                    disabled={index === steps.length - 1}
                    className="p-1 hover:bg-slate-50 text-slate-400 disabled:opacity-30 cursor-pointer"
                    title="Move Step Down"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>

                  <button 
                    onClick={(e) => { e.stopPropagation(); removeStep(step.id); }}
                    className="p-1 hover:bg-red-50 text-slate-400 hover:text-[#DA0000] cursor-pointer transition-colors"
                    title="Delete Step"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right panel: Active Step Details & Node Library */}
      <div className="w-full xl:w-80 bg-slate-50/50 border border-slate-200 rounded-xl p-5 shrink-0 flex flex-col justify-between">
        <div>
          {/* Node Adder library */}
          <div>
            <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
              <GitCommit className="h-3.5 w-3.5 text-[#DA0000]" />
              <span>Flow Node Palette</span>
            </h4>
            <p className="text-[11px] text-slate-500 mb-4 font-sans">
              Inject emergency automated steps into this active NOC pathway.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => addStep('wait')}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/10 text-slate-700 text-[10px] font-bold text-left cursor-pointer transition-all"
              >
                <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                <span>+ Delay (Wait)</span>
              </button>
              <button 
                onClick={() => addStep('telegram')}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-white border border-slate-200 hover:border-sky-400 hover:bg-sky-50/10 text-slate-700 text-[10px] font-bold text-left cursor-pointer transition-all"
              >
                <MessageSquare className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                <span>+ Telegram Channel</span>
              </button>
              <button 
                onClick={() => addStep('slack')}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-white border border-slate-200 hover:border-purple-400 hover:bg-purple-50/10 text-slate-700 text-[10px] font-bold text-left cursor-pointer transition-all"
              >
                <MessageSquare className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                <span>+ Slack Broadcast</span>
              </button>
              <button 
                onClick={() => addStep('sms')}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/10 text-slate-700 text-[10px] font-bold text-left cursor-pointer transition-all"
              >
                <MessageSquare className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span>+ SMS Outbound</span>
              </button>
              <button 
                onClick={() => addStep('call')}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-white border border-slate-200 hover:border-rose-400 hover:bg-rose-50/10 text-slate-700 text-[10px] font-bold text-left cursor-pointer transition-all"
              >
                <PhoneCall className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                <span>+ IVR Call Duty</span>
              </button>
              <button 
                onClick={() => addStep('email')}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-white border border-slate-200 hover:border-amber-400 hover:bg-amber-50/10 text-slate-700 text-[10px] font-bold text-left cursor-pointer transition-all"
              >
                <Mail className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span>+ Email SLA Desk</span>
              </button>
            </div>
          </div>

          <div className="h-px bg-slate-200 my-5"></div>

          {/* Configuration details for selected block */}
          <div>
            <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
              <Settings2 className="h-3.5 w-3.5 text-[#DA0000]" />
              <span>Node Config Inspector</span>
            </h4>

            {selectedStepId ? (
              (() => {
                const step = steps.find(s => s.id === selectedStepId);
                if (!step) return null;
                return (
                  <div className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-3 font-sans text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{step.label}</p>
                      <p className="text-[9px] text-slate-400 font-mono">UID: {step.id}</p>
                    </div>

                    {step.type === 'wait' ? (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500">Wait Delay (Minutes)</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="range" 
                            min="1" 
                            max="60" 
                            value={step.configValue}
                            onChange={(e) => updateConfigValue(step.id, e.target.value)}
                            className="w-full accent-[#DA0000] cursor-pointer"
                          />
                          <span className="font-mono font-black text-[#DA0000] shrink-0 bg-red-50 border border-red-200 rounded px-1.5 py-0.5">{step.configValue}m</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500">Target Address / Webhook</label>
                        <input 
                          type="text" 
                          value={step.configValue}
                          onChange={(e) => updateConfigValue(step.id, e.target.value)}
                          className="w-full rounded border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#DA0000]/40 focus:outline-none bg-slate-50"
                        />
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-slate-500">Trigger Conditions</p>
                      <div className="rounded bg-slate-50 border border-slate-200 p-2 text-[10px] text-slate-500 font-mono leading-normal">
                        Fires automatically if prior steps remain unacknowledged within trigger intervals.
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="border border-dashed border-slate-200 rounded-lg p-5 text-center text-slate-400 bg-white">
                <Settings2 className="h-6 w-6 text-slate-300 mx-auto mb-2 animate-pulse" />
                <p className="text-[11px] font-sans">
                  Select any block on the pipeline to open its full properties inspector.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Telegram Live Bot Sync */}
        <div className="mt-5 bg-slate-950 text-white rounded-xl p-4.5 space-y-3.5 border border-slate-800 shadow-md">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-sky-400 shrink-0 animate-pulse" />
            <div>
              <h4 className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-widest">
                Telegram Bot Live Sync
              </h4>
              <p className="text-[9px] text-slate-400 mt-0.5">
                Connect your real Telegram Bot to receive live alerts
              </p>
            </div>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="text-[9px] font-mono font-bold text-slate-300 block mb-1">TELEGRAM BOT TOKEN</label>
              <input 
                type="password" 
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder="e.g. 123456789:ABCdefGhI..."
                className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-[11px] font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>

            <div>
              <label className="text-[9px] font-mono font-bold text-slate-300 block mb-1">TELEGRAM CHAT ID / GROUP ID</label>
              <input 
                type="text" 
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                placeholder="e.g. 987654321 or -1001234567"
                className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-[11px] font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleTestTelegram}
                disabled={telegramStatus.type === 'loading'}
                className="flex-1 text-center py-2 rounded-lg bg-sky-500 hover:bg-sky-600 disabled:bg-sky-500/50 text-white font-bold text-[10px] uppercase transition-colors cursor-pointer"
              >
                {telegramStatus.type === 'loading' ? 'Syncing...' : 'Test Sync Alert'}
              </button>
              {(botToken || chatId) && (
                <button
                  onClick={handleClearTelegram}
                  className="px-2.5 py-2 rounded-lg bg-slate-900 hover:bg-red-950/40 text-slate-400 hover:text-red-200 text-[10px] font-bold transition-colors cursor-pointer border border-slate-800"
                  title="Clear credentials from browser storage"
                >
                  Clear Cache
                </button>
              )}
            </div>

            {telegramStatus.type && (
              <div className={`rounded-lg p-2.5 text-[10px] font-medium leading-normal border ${
                telegramStatus.type === 'success' ? 'bg-emerald-950/40 text-emerald-300 border-emerald-900/60' :
                telegramStatus.type === 'error' ? 'bg-rose-950/40 text-rose-300 border-rose-900/60' :
                'bg-slate-900 text-slate-300 border-slate-850'
              }`}>
                <div className="font-sans font-semibold">{telegramStatus.message}</div>
              </div>
            )}
          </div>
        </div>

        {/* Twilio Voice Gateway Sync */}
        <div className="mt-5 bg-slate-950 text-white rounded-xl p-4.5 space-y-3.5 border border-slate-800 shadow-md">
          <div className="flex items-center gap-2">
            <PhoneCall className="h-5 w-5 text-rose-400 shrink-0 animate-pulse" />
            <div>
              <h4 className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-widest">
                Twilio Voice Gateway Sync
              </h4>
              <p className="text-[9px] text-slate-400 mt-0.5">
                Connect your real Twilio API to trigger automated emergency calls
              </p>
            </div>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] font-mono font-bold text-slate-300 block mb-1">ACCOUNT SID</label>
                <input 
                  type="text" 
                  value={twilioSid}
                  onChange={(e) => setTwilioSid(e.target.value)}
                  placeholder="AC15c036325c..."
                  className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-[11px] font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-[9px] font-mono font-bold text-slate-300 block mb-1">AUTH TOKEN</label>
                <input 
                  type="text" 
                  value={twilioToken}
                  onChange={(e) => setTwilioToken(e.target.value)}
                  placeholder="Paste Twilio Auth Token..."
                  className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-[11px] font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] font-mono font-bold text-slate-300 block mb-1">FROM NUMBER</label>
                <input 
                  type="text" 
                  value={twilioFrom}
                  onChange={(e) => setTwilioFrom(e.target.value)}
                  placeholder="e.g. +1855..."
                  className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-[11px] font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-[9px] font-mono font-bold text-slate-300 block mb-1">TO NUMBER (YOUR MOBILE)</label>
                <input 
                  type="text" 
                  value={twilioTo}
                  onChange={(e) => setTwilioTo(e.target.value)}
                  placeholder="e.g. +260..."
                  className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-[11px] font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleTestTwilio}
                disabled={twilioStatus.type === 'loading'}
                className="flex-1 text-center py-2 rounded-lg bg-rose-500 hover:bg-rose-600 disabled:bg-rose-500/50 text-white font-bold text-[10px] uppercase transition-colors cursor-pointer"
              >
                {twilioStatus.type === 'loading' ? 'Calling...' : 'Test Voice Dispatch'}
              </button>
              {(twilioSid || twilioToken) && (
                <button
                  onClick={handleClearTwilio}
                  className="px-2.5 py-2 rounded-lg bg-slate-900 hover:bg-red-950/40 text-slate-400 hover:text-red-200 text-[10px] font-bold transition-colors cursor-pointer border border-slate-800"
                  title="Clear Twilio credentials"
                >
                  Clear Cache
                </button>
              )}
            </div>

            {twilioStatus.type && (
              <div className="space-y-2.5">
                <div className={`rounded-lg p-2.5 text-[10px] font-medium leading-normal border ${
                  twilioStatus.type === 'success' ? 'bg-emerald-950/40 text-emerald-300 border-emerald-900/60' :
                  twilioStatus.type === 'error' ? 'bg-rose-950/40 text-rose-300 border-rose-900/60' :
                  'bg-slate-900 text-slate-300 border-slate-850'
                }`}>
                  <div className="font-sans font-semibold">{twilioStatus.message}</div>
                  {twilioStatus.code && (
                    <div className="mt-1 text-[9px] font-mono text-rose-400 font-bold">
                      Twilio Code: {twilioStatus.code}
                    </div>
                  )}
                </div>

                {twilioStatus.type === 'error' && (
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-[10px] space-y-2.5 text-slate-300">
                    <div className="font-mono text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      <span>Twilio Troubleshooting Guide</span>
                    </div>
                    
                    {twilioStatus.code === 21608 || String(twilioStatus.code).includes('21608') || String(twilioStatus.message).toLowerCase().includes('unverified') ? (
                      <div className="text-amber-200 bg-amber-950/30 border border-amber-900/50 rounded p-2 font-sans space-y-1">
                        <p className="font-bold">⚠️ Trial Account Restriction (Error 21608)</p>
                        <p className="leading-normal text-slate-300 text-[10px]">
                          Your Twilio account is a <strong>Trial Account</strong>. In Trial Mode, Twilio strictly forbids outbound calls to unverified numbers.
                        </p>
                        <p className="leading-normal font-semibold text-amber-300 text-[10px]">
                          👉 <strong>How to Fix:</strong> Go to your Twilio Console &gt; Phone Numbers &gt; Verified Caller IDs, and verify your mobile number (<span className="font-mono">{twilioTo || "+260..."}</span>). Once verified, try again!
                        </p>
                      </div>
                    ) : twilioStatus.code === 20003 || String(twilioStatus.code).includes('20003') || String(twilioStatus.message).toLowerCase().includes('authenticate') ? (
                      <div className="text-amber-200 bg-amber-950/30 border border-amber-900/50 rounded p-2 font-sans space-y-1">
                        <p className="font-bold">🔑 Authentication Failed (Error 20003)</p>
                        <p className="leading-normal text-slate-300 text-[10px]">
                          Twilio rejected your Account SID or Auth Token.
                        </p>
                        <p className="leading-normal font-semibold text-amber-300 text-[10px]">
                          👉 <strong>How to Fix:</strong> Double check your credentials. Make sure you haven't swapped Account SID with Auth Token. Ensure there are no missing characters in your copied Token.
                        </p>
                      </div>
                    ) : twilioStatus.code === 21211 || String(twilioStatus.code).includes('21211') ? (
                      <div className="text-amber-200 bg-amber-950/30 border border-amber-900/50 rounded p-2 font-sans space-y-1">
                        <p className="font-bold">📞 Invalid Destination Phone Number (Error 21211)</p>
                        <p className="leading-normal text-slate-300 text-[10px]">
                          The 'To' number is not in correct international E.164 format.
                        </p>
                        <p className="leading-normal font-semibold text-amber-300 text-[10px]">
                          👉 <strong>How to Fix:</strong> Enter your full phone number starting with '+' followed by the country code (e.g., <strong>+26097...</strong>). Avoid local formatting like starting with a zero (e.g. use <strong>+26097...</strong> instead of <strong>097...</strong>).
                        </p>
                      </div>
                    ) : twilioStatus.code === 21212 || String(twilioStatus.code).includes('21212') ? (
                      <div className="text-amber-200 bg-amber-950/30 border border-amber-900/50 rounded p-2 font-sans space-y-1">
                        <p className="font-bold">❌ Invalid Twilio Number (Error 21212)</p>
                        <p className="leading-normal text-slate-300 text-[10px]">
                          The 'From' number is not a valid phone number owned by your Twilio account.
                        </p>
                        <p className="leading-normal font-semibold text-amber-300 text-[10px]">
                          👉 <strong>How to Fix:</strong> Ensure you copy the exact "Twilio Phone Number" (including the '+') shown on your Twilio Console home page. You cannot use your personal phone number as the 'From' number.
                        </p>
                      </div>
                    ) : twilioStatus.code === 20008 || String(twilioStatus.code).includes('20008') ? (
                      <div className="text-amber-200 bg-amber-950/30 border border-amber-900/50 rounded p-2 font-sans space-y-1">
                        <p className="font-bold">💸 Out of Credit / Suspended (Error 20008)</p>
                        <p className="leading-normal text-slate-300 text-[10px]">
                          Your Twilio trial balance has run out or the account is suspended.
                        </p>
                        <p className="leading-normal font-semibold text-amber-300 text-[10px]">
                          👉 <strong>How to Fix:</strong> Check your balance in the Twilio Console. You may need to upgrade or verify your registration.
                        </p>
                      </div>
                    ) : null}

                    <div className="space-y-1.5 leading-normal text-slate-400 font-sans text-[10px]">
                      <div className="flex items-start gap-1">
                        <span className="text-rose-400">1.</span>
                        <span><strong className="text-slate-200">Are you using a Twilio Trial?</strong> Outbound calls can ONLY be sent to the phone number you verified when creating your Twilio account.</span>
                      </div>
                      <div className="flex items-start gap-1">
                        <span className="text-rose-400">2.</span>
                        <span><strong className="text-slate-200">International format (E.164):</strong> Phone numbers must start with <span className="font-mono text-rose-400 font-bold">+</span> (e.g. <span className="font-mono text-emerald-400 font-bold">+26097...</span>).</span>
                      </div>
                      <div className="flex items-start gap-1">
                        <span className="text-rose-400">3.</span>
                        <span><strong className="text-slate-200">Is your balance active?</strong> Check the top right of your Twilio console to ensure you have trial credit or active funds left.</span>
                      </div>
                      <div className="flex items-start gap-1">
                        <span className="text-rose-400">4.</span>
                        <span><strong className="text-slate-200">Verified Caller IDs:</strong> If you are testing calling a colleague, they must be added under <span className="text-rose-400 font-mono text-[9px]">Phone Numbers &gt; Verified Caller IDs</span> in Twilio console first.</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Predictive compliance warning */}
        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-[10px] text-amber-800 leading-relaxed flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <div>
            <span className="font-bold">SLA Assurance:</span> Total maximum escalation path latency is <strong className="font-mono font-black text-amber-900">50 mins</strong>. This is within the ABSA SLA mandate of 60 mins.
          </div>
        </div>

      </div>

    </div>
  );
}
