import { useState, useRef, useEffect } from 'react';
import { Message, DashboardState } from '../types';
import { MessageSquare, Send, Sparkles, Terminal, Cpu, Loader2, X, Volume2, VolumeX } from 'lucide-react';
import AssistantAvatar from './AssistantAvatar';

interface GizaAssistantProps {
  dashboardState: DashboardState;
}

export default function GizaAssistant({ dashboardState }: GizaAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'giza-welcome',
      sender: 'giza',
      text: "👋 **Hello Engineer, I am Giza, your ASABB NOC Assistant.**\n\nI am synchronized directly with all **8 branch SD-WAN controllers**, telemetry syslogs, and automated escalation watchdogs. \n\nHow can I assist with your regional network telemetry today?",
      timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Speech Synthesis Helper
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window) || !voiceEnabled) return;
    try {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*_#`~]/g, '').slice(0, 300).trim();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.05;
      utterance.pitch = 1.15; // Natural female pitch

      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(v => 
        v.name.includes('Female') || 
        v.name.includes('Samantha') || 
        v.name.includes('Google UK English Female') || 
        v.name.includes('Zira') || 
        v.name.includes('Karen') || 
        v.name.includes('Victoria')
      );
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch {
      setIsSpeaking(false);
    }
  };

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, loading, isOpen]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    const userMsg: Message = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.sender,
        text: m.text
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: history,
          dashboardState: dashboardState
        })
      });

      const data = await response.json();

      if (response.ok) {
        const gizaMsg: Message = {
          id: `msg-${Date.now()}-giza`,
          sender: 'giza',
          text: data.text,
          timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, gizaMsg]);
        speakText(data.text);
      } else {
        throw new Error(data.error || "Absa AI Agent was offline.");
      }
    } catch (err: any) {
      const errorText = `🚨 **Absa AI Error**: ${err.message || 'Unable to process request.'}`;
      const errorMsg: Message = {
        id: `msg-${Date.now()}-error`,
        sender: 'giza',
        text: errorText,
        timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    { label: "🔍 Outage Duration", text: "Which branch has been offline or degraded the longest? Provide a timeline analysis." },
    { label: "📊 SLA Status Report", text: "What is our current network SLA uptime status? Does it comply with our SLA limit?" },
    { label: "📜 Summarize Outages", text: "Summarize all active and resolved critical incidents logged in our NOC register right now." },
    { label: "✍️ Draft ATM Incident Report", text: "Draft a formal corporate incident report for our ATM failures based on our current network state." }
  ];

  return (
    <>
      {/* Floating Trigger Button with Animated Avatar */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 z-10">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-[#DA0000] text-[8px] font-bold text-white items-center justify-center">1</span>
          </span>
        )}
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 border-2 border-[#DA0000] text-white hover:scale-105 active:scale-95 transition-all shadow-xl cursor-pointer focus:outline-none overflow-hidden group p-0.5"
          title="Open Giza - Absa AI Assistant"
        >
          {isOpen ? (
            <div className="bg-[#DA0000] w-full h-full rounded-full flex items-center justify-center">
              <X className="h-6 w-6 text-white" />
            </div>
          ) : (
            <AssistantAvatar isSpeaking={isSpeaking} isThinking={loading} size="md" className="w-full h-full" />
          )}
        </button>
      </div>

      {/* Floating Chat Container */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] sm:w-[420px] max-w-[calc(100vw-2rem)] flex h-[540px] flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-6 duration-300">
          
          {/* Header with Avatar & Voice Toggle */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-950 text-white px-4 py-3">
            <div className="flex items-center gap-3">
              <AssistantAvatar isSpeaking={isSpeaking} isThinking={loading} size="sm" />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-sans text-sm font-bold text-white">Giza</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 bg-red-500/20 text-red-400 border border-red-500/30 rounded font-bold">ABSA AI</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>
                <p className="font-mono text-[8px] text-slate-400 uppercase tracking-widest">Absa NOC AI Copilot</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Voice toggle button */}
              <button
                onClick={() => {
                  const next = !voiceEnabled;
                  setVoiceEnabled(next);
                  if (!next && window.speechSynthesis) window.speechSynthesis.cancel();
                }}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  voiceEnabled ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 hover:text-slate-300'
                }`}
                title={voiceEnabled ? 'Voice Output Active' : 'Voice Output Muted'}
              >
                {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>

              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white rounded p-1.5 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-200 bg-slate-50/50">
            {messages.map((m) => {
              const isGiza = m.sender === 'giza';
              return (
                <div 
                  key={m.id} 
                  className={`flex flex-col ${isGiza ? 'items-start' : 'items-end'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    {isGiza ? (
                      <AssistantAvatar isSpeaking={false} size="sm" className="w-5 h-5" />
                    ) : null}
                    <span className="text-[9px] font-mono text-slate-400">{m.timestamp}</span>
                    <span className="text-[10px] font-bold text-slate-500 font-mono">
                      {isGiza ? 'Giza AI' : 'Operator'}
                    </span>
                  </div>
                  <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed border shadow-sm ${
                    isGiza 
                      ? 'bg-white text-slate-800 border-slate-200' 
                      : 'bg-[#DA0000] text-white border-transparent font-semibold'
                  }`}>
                    <p className="whitespace-pre-line">
                      {m.text}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-2 mb-1">
                  <AssistantAvatar isThinking={true} size="sm" className="w-5 h-5" />
                  <span className="text-[10px] font-bold text-slate-400 font-mono">Giza is processing telemetry...</span>
                  <Loader2 className="h-3 w-3 animate-spin text-[#DA0000]" />
                </div>
                <div className="max-w-[150px] rounded-xl bg-white border border-slate-200 px-3.5 py-2.5 text-slate-400">
                  <div className="flex gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#DA0000] animate-bounce"></span>
                    <span className="h-1.5 w-1.5 rounded-full bg-[#DA0000] animate-bounce [animation-delay:0.2s]"></span>
                    <span className="h-1.5 w-1.5 rounded-full bg-[#DA0000] animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div className="bg-white p-2.5 border-t border-slate-100">
            <p className="text-[9px] font-mono font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-1 tracking-widest">
              <Sparkles className="h-3 w-3 text-[#DA0000]" />
              <span>Quick Copilot Prompts</span>
            </p>
            <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
              {quickPrompts.map((p) => (
                <button
                  key={p.label}
                  onClick={() => handleSendMessage(p.text)}
                  disabled={loading}
                  className="rounded-lg bg-slate-50 hover:bg-[#DA0000]/5 hover:text-[#DA0000] hover:border-[#DA0000]/30 border border-slate-200 px-2 py-1 text-[9px] text-slate-600 font-bold transition-all text-left truncate max-w-full cursor-pointer disabled:opacity-50"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input Form */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }}
            className="flex items-center gap-2 border-t border-slate-100 bg-slate-50 p-2.5"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              placeholder="Ask Giza to analyze SLA, draft report..."
              className="flex-1 rounded-lg bg-white px-3 py-2 text-xs text-slate-800 border border-slate-200 focus:border-[#DA0000]/40 focus:outline-none disabled:opacity-50 font-medium"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#DA0000] text-white hover:bg-red-700 transition-colors cursor-pointer disabled:bg-slate-100 disabled:text-slate-300 shadow-sm"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>

        </div>
      )}
    </>
  );
}

