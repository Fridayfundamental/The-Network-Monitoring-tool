import { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Volume2, ShieldAlert, Radio, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface IncomingCallOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  branchName: string;
  deviceName: string;
  elapsedMinutes: number;
  incidentId: string;
}

export default function IncomingCallOverlay({
  isOpen,
  onClose,
  branchName,
  deviceName,
  elapsedMinutes,
  incidentId
}: IncomingCallOverlayProps) {
  const [callState, setCallState] = useState<'ringing' | 'connected' | 'completed' | 'declined'>('ringing');
  const [audioMuted, setAudioMuted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechWordsSpoken, setSpeechWordsSpoken] = useState<string[]>([]);
  const ringRef = useRef<{ stop: () => void } | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const simSpeechIntervalRef = useRef<any>(null);

  // The alert text to read out
  const fullMessage = `Attention. This is an automated ABSA Bank Zambia Network Operations Center emergency alert. A critical SD-WAN network outage has escalated at ${branchName}. Device ${deviceName} is offline. Live status is unresolvable. SLA breach risk is active, with an elapsed outage duration of ${elapsedMinutes} minutes. Repeat, ${branchName} gateway is offline. Incident ticket number ${incidentId} is active. Please review the live digital twin dashboard immediately to restore baseline parameters. Dispatch complete.`;

  // 1. Synthesize telephone dual ring tone using Web Audio API
  useEffect(() => {
    if (isOpen && callState === 'ringing' && !audioMuted) {
      let active = true;
      let stopCurrentRing: (() => void) | null = null;

      const triggerRingCycle = () => {
        if (!active) return;
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (!AudioContextClass) return;

          const ctx = new AudioContextClass();
          audioCtxRef.current = ctx;

          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gainNode = ctx.createGain();

          // Standard US/Zambia ring frequencies: 440Hz + 480Hz
          osc1.frequency.value = 440;
          osc2.frequency.value = 480;

          osc1.connect(gainNode);
          osc2.connect(gainNode);
          gainNode.connect(ctx.destination);

          // Standard Ring Cadence: 1.5s ring, 3.5s silence
          gainNode.gain.setValueAtTime(0, ctx.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.1);
          gainNode.gain.setValueAtTime(0.06, ctx.currentTime + 1.6);
          gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.8);

          osc1.start();
          osc2.start();

          stopCurrentRing = () => {
            try {
              osc1.stop();
              osc2.stop();
              ctx.close();
            } catch (err) {}
          };
        } catch (e) {
          console.error("Audio Synthesis Ring failed:", e);
        }
      };

      // Play initially and schedule on a 5-second interval loop
      triggerRingCycle();
      const ringInterval = setInterval(triggerRingCycle, 5000);

      ringRef.current = {
        stop: () => {
          active = false;
          clearInterval(ringInterval);
          if (stopCurrentRing) stopCurrentRing();
        }
      };
    }

    return () => {
      if (ringRef.current) {
        ringRef.current.stop();
        ringRef.current = null;
      }
    };
  }, [isOpen, callState, audioMuted]);

  // Clean speech synthesis and intervals on close or unmount
  useEffect(() => {
    if (!isOpen) {
      // Reset state on closed
      setCallState('ringing');
      setTranscript('');
      setSpeechWordsSpoken([]);
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (simSpeechIntervalRef.current) {
        clearInterval(simSpeechIntervalRef.current);
        simSpeechIntervalRef.current = null;
      }
    }
    return () => {
      if (simSpeechIntervalRef.current) {
        clearInterval(simSpeechIntervalRef.current);
      }
    };
  }, [isOpen]);

  // Helper to run a high-fidelity word-by-word transcript scroll animation as a fallback
  const startSimulatedSpeech = () => {
    if (simSpeechIntervalRef.current) {
      clearInterval(simSpeechIntervalRef.current);
    }
    
    setTranscript("Connection established...");
    const words = fullMessage.split(' ');
    let currentWordIdx = 0;
    
    const interval = setInterval(() => {
      if (currentWordIdx < words.length) {
        const spoken = words.slice(0, currentWordIdx + 1);
        setSpeechWordsSpoken(spoken);
        setTranscript(spoken.join(' '));
        currentWordIdx++;
      } else {
        clearInterval(interval);
        simSpeechIntervalRef.current = null;
        setCallState('completed');
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    }, 180); // Speak at standard human reading pace (~330 words per minute)
    
    simSpeechIntervalRef.current = interval;
  };

  // Stop sounds and trigger TTS speech read
  const handleAnswer = () => {
    // Stop ringing tone
    if (ringRef.current) {
      ringRef.current.stop();
      ringRef.current = null;
    }

    setCallState('connected');

    if (!window.speechSynthesis) {
      startSimulatedSpeech();
      return;
    }

    // Cancel any active speech
    window.speechSynthesis.cancel();

    try {
      const utterance = new SpeechSynthesisUtterance(fullMessage);
      utteranceRef.current = utterance;

      // Use a professional English voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        v.name.includes("Google US English") || 
        v.name.includes("Microsoft Zira") || 
        v.name.includes("Alice") ||
        v.lang.startsWith("en")
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.rate = 0.95; // Speak slightly slower for NOC clarity
      utterance.pitch = 1.0;

      // Split words to animate the transcript scrolling dynamically during speech
      const words = fullMessage.split(' ');
      let charIndexMap: { char: number; wordIdx: number }[] = [];
      let accumChars = 0;
      words.forEach((w, idx) => {
        charIndexMap.push({ char: accumChars, wordIdx: idx });
        accumChars += w.length + 1; // plus space
      });

      utterance.onboundary = (event) => {
        if (event.name === 'word') {
          // Approximate which word is being spoken
          const charIdx = event.charIndex;
          const matchedWord = charIndexMap.find(m => m.char >= charIdx) || charIndexMap[charIndexMap.length - 1];
          if (matchedWord) {
            const spoken = words.slice(0, matchedWord.wordIdx + 1);
            setSpeechWordsSpoken(spoken);
            setTranscript(spoken.join(' '));
          }
        }
      };

      utterance.onstart = () => {
        setTranscript("Connection established...");
      };

      utterance.onend = () => {
        setCallState('completed');
        setTimeout(() => {
          onClose();
        }, 2000);
      };

      utterance.onerror = (err) => {
        console.info("Speech Synthesis blocked/unsupported, using high-fidelity typing fallback instead.", err.error || err);
        startSimulatedSpeech();
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.info("Speech Synthesis initialization bypassed, using typing fallback:", e);
      startSimulatedSpeech();
    }
  };

  const handleDecline = () => {
    if (ringRef.current) {
      ringRef.current.stop();
      ringRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (simSpeechIntervalRef.current) {
      clearInterval(simSpeechIntervalRef.current);
      simSpeechIntervalRef.current = null;
    }
    setCallState('declined');
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="bg-slate-950 border border-slate-800 text-white rounded-2xl max-w-md w-full max-h-[92vh] overflow-y-auto shadow-2xl relative scrollbar-none"
        >
          {/* NOC Header brand banner */}
          <div className="bg-red-950/40 border-b border-slate-800 px-4 py-3 flex items-center justify-between text-xs font-mono font-bold tracking-wider text-red-500">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse"></span>
              <span>ABSA NOC SECURE DISPATCH</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setAudioMuted(!audioMuted)}
                className="hover:text-white p-1 rounded transition-colors"
                title={audioMuted ? "Unmute Ringtone" : "Mute Ringtone"}
              >
                {audioMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4 text-emerald-400" />}
              </button>
              <span className="bg-red-900/40 text-red-400 px-2 py-0.5 rounded text-[10px]">
                {incidentId}
              </span>
            </div>
          </div>

          <div className="p-8 flex flex-col items-center text-center">
            
            {/* Phone Icon Pulsing circle */}
            <div className="relative mb-6">
              {callState === 'ringing' && (
                <>
                  <div className="absolute inset-0 bg-[#DA0000]/25 rounded-full animate-ping scale-150"></div>
                  <div className="absolute inset-0 bg-[#DA0000]/15 rounded-full animate-ping scale-200"></div>
                </>
              )}
              {callState === 'connected' && (
                <div className="absolute inset-0 bg-emerald-500/25 rounded-full animate-pulse scale-125"></div>
              )}
              
              <div className={`h-20 w-20 rounded-full flex items-center justify-center border-2 transition-colors duration-500 ${
                callState === 'ringing' ? 'bg-red-950/80 border-[#DA0000] text-red-500 animate-bounce' :
                callState === 'connected' ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400' :
                'bg-slate-800 border-slate-700 text-slate-400'
              }`}>
                <Phone className={`h-8 w-8 ${callState === 'ringing' ? 'animate-pulse' : ''}`} />
              </div>
            </div>

            {/* Caller ID Info */}
            <h4 className="text-lg font-bold tracking-tight">ABSA NOC Voice Gateway</h4>
            <p className="text-xs text-slate-400 font-mono mt-1">Lusaka Headquarters Hub IP: 10.12.0.4</p>
            
            {/* Outage Context Box */}
            <div className="mt-5 mb-6 bg-slate-900/80 border border-slate-800 rounded-lg px-4 py-3 text-left w-full text-xs">
              <div className="flex items-center gap-1.5 text-red-400 font-bold uppercase tracking-wider mb-1.5 text-[10px]">
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Level-3 Escalation Warning</span>
              </div>
              <div className="space-y-1 text-slate-300 font-mono">
                <div><span className="text-slate-500">Affected Branch:</span> <b className="text-white">{branchName}</b></div>
                <div><span className="text-slate-500">Outage Hardware:</span> <b className="text-white">{deviceName}</b></div>
                <div><span className="text-slate-500">Active Duration:</span> <b className="text-white">{elapsedMinutes} minutes</b></div>
              </div>
            </div>

            {/* Call State / Live Speech Transcript Scrolling */}
            <div className="w-full min-h-[90px] border border-dashed border-slate-800 rounded-lg p-3.5 bg-slate-950 text-left relative flex flex-col justify-between overflow-hidden">
              <div className="text-[9px] uppercase tracking-wider text-slate-500 font-mono mb-2 flex items-center justify-between">
                <span>Speech Feed Transcript</span>
                {callState === 'connected' && (
                  <span className="flex gap-1 items-end h-3">
                    <span className="w-0.5 bg-emerald-500 animate-pulse h-2"></span>
                    <span className="w-0.5 bg-emerald-500 animate-pulse h-3"></span>
                    <span className="w-0.5 bg-emerald-500 animate-pulse h-1"></span>
                    <span className="w-0.5 bg-emerald-500 animate-pulse h-3.5"></span>
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-300 font-mono leading-relaxed line-clamp-3">
                {callState === 'ringing' && "📞 System is ringing... waiting for answer."}
                {callState === 'connected' && (transcript || "Establishing Secure Audio Link...")}
                {callState === 'completed' && "✅ Call completed. Dispatch sequence logged successfully."}
                {callState === 'declined' && "❌ Call declined. Rerouting to emergency fallback paging channel."}
              </div>

              {/* Progress bar of speech */}
              {callState === 'connected' && (
                <div className="w-full bg-slate-800 h-1 mt-3 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${(speechWordsSpoken.length / fullMessage.split(' ').length) * 100}%` }}
                  ></div>
                </div>
              )}
            </div>

            {/* Calling Buttons */}
            <div className="mt-8 flex gap-4 w-full">
              {callState === 'ringing' ? (
                <>
                  <button
                    onClick={handleDecline}
                    className="flex-1 cursor-pointer py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold flex items-center justify-center gap-2 text-xs shadow-md shadow-red-950/40 transition-colors"
                  >
                    <PhoneOff className="h-4.5 w-4.5" />
                    <span>DECLINE</span>
                  </button>
                  <button
                    onClick={handleAnswer}
                    className="flex-1 cursor-pointer py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 text-xs shadow-md shadow-emerald-950/40 animate-pulse transition-colors"
                  >
                    <Phone className="h-4.5 w-4.5" />
                    <span>ANSWER CALL</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={handleDecline}
                  className="w-full cursor-pointer py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center justify-center gap-2 text-xs transition-colors"
                >
                  <PhoneOff className="h-4.5 w-4.5" />
                  <span>{callState === 'connected' ? 'END CALL' : 'CLOSE'}</span>
                </button>
              )}
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
