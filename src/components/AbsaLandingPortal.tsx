import React, { useState, useEffect } from 'react';
import { ChevronRight, ArrowRight, Activity, ShieldAlert, Sparkles, Loader2 } from 'lucide-react';

interface AbsaLandingPortalProps {
  onUnlock: () => void;
  slaUptime: number;
}

export default function AbsaLandingPortal({ onUnlock, slaUptime }: AbsaLandingPortalProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [timeStr, setTimeStr] = useState('');

  // Local clock for the top bar
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Africa/Lusaka',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      };
      setTimeStr(now.toLocaleTimeString('en-US', options) + ' CAT');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSignIn = () => {
    setIsAuthenticating(true);
    // Smooth transition
    setTimeout(() => {
      onUnlock();
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E20000] via-[#C0000D] to-[#680005] text-white flex flex-col justify-between font-sans relative overflow-hidden select-none">
      
      {/* Ambient Radial Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06)_0%,transparent_70%)] pointer-events-none" />

      {/* Floating Graphic Bubbles matching the actual ABSA branding style in the image */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        
        {/* Left cluster of bubbles around central area */}
        <div className="absolute left-[33%] top-[45%] w-4 h-4 rounded-full bg-purple-700/60 blur-[1px] animate-pulse" />
        <div className="absolute left-[37%] top-[40%] w-6 h-6 rounded-full border-2 border-purple-500/40" />
        <div className="absolute left-[30%] top-[48%] w-8 h-8 rounded-full border border-purple-800/50" />
        <div className="absolute left-[28%] top-[53%] w-5 h-5 rounded-full bg-pink-600/70" />
        <div className="absolute left-[31%] top-[56%] w-7 h-7 rounded-full border-2 border-pink-500/40" />
        <div className="absolute left-[33%] top-[62%] w-5 h-5 rounded-full border-2 border-pink-700/50" />
        
        {/* Bottom cluster of bubbles */}
        <div className="absolute left-[44%] top-[70%] w-6 h-6 rounded-full bg-amber-500/80" />
        <div className="absolute left-[46%] top-[74%] w-4 h-4 rounded-full border-2 border-amber-500/40" />
        <div className="absolute left-[51%] top-[76%] w-5 h-5 rounded-full bg-pink-500/80" />
        <div className="absolute left-[54%] top-[73%] w-7 h-7 rounded-full border-2 border-pink-500/40" />
        <div className="absolute left-[49%] top-[82%] w-6 h-6 rounded-full border-2 border-purple-700/50" />
        
        {/* Right side floating points */}
        <div className="absolute right-[33%] top-[50%] w-5 h-5 rounded-full bg-amber-500" />
        <div className="absolute right-[29%] top-[54%] w-4 h-4 rounded-full border-2 border-pink-500/40" />
      </div>

      {/* Header bar with sleek translucent design */}
      <header className="px-6 py-4 flex justify-between items-center z-10 border-b border-white/5 bg-white/[0.02] backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-mono font-black tracking-[0.25em] text-white/90">
            Sentinel NOC
          </span>
          <span className="h-2 w-2 rounded-full bg-white/20" />
          <span className="text-[9px] uppercase font-mono tracking-wider text-white/60">
            Zambia
          </span>
        </div>

        <div className="text-[10px] font-mono text-white/80 flex items-center gap-3">
          <span>{timeStr || '12:00:00 CAT'}</span>
          <span className="text-white/20">|</span>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold tracking-wide uppercase text-[9px] text-emerald-300">SYSTEM SECURE</span>
          </div>
        </div>
      </header>

      {/* Main Branding & Action Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 z-10 relative">
        <div className="text-center max-w-sm w-full space-y-12">
          
          {/* Custom SVG ABSA Logo perfectly resembling the user's uploaded image */}
          <div className="relative inline-block animate-fade-in">
            <svg viewBox="0 0 100 100" className="w-48 h-48 drop-shadow-2xl mx-auto">
              {/* Left Parenthesis / Arc */}
              <path 
                d="M 28 18 A 38 38 0 0 0 28 82" 
                fill="none" 
                stroke="white" 
                strokeWidth="4" 
                strokeLinecap="round" 
              />
              {/* Right Parenthesis / Arc */}
              <path 
                d="M 72 18 A 38 38 0 0 1 72 82" 
                fill="none" 
                stroke="white" 
                strokeWidth="4" 
                strokeLinecap="round" 
              />
              {/* Main Rounded lowercase logo text */}
              <text 
                x="50" 
                y="58" 
                textAnchor="middle" 
                className="fill-white font-sans text-[28px] font-black tracking-tighter"
              >
                asabb
              </text>
            </svg>
          </div>

          {/* Minimalist Portal Controls */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-lg font-black tracking-[0.12em] text-white uppercase">
                ASABB SENTINEL NOC
              </h1>
              <p className="text-xs text-white/70 font-medium max-w-xs mx-auto leading-relaxed">
                ASABB Bank Zambia native continuous device monitoring engine & automated voice escalations.
              </p>
            </div>

            {/* Direct Sign In Action with luxurious smooth hover transition */}
            <div className="pt-2">
              <button
                onClick={handleSignIn}
                disabled={isAuthenticating}
                className="w-full max-w-[240px] mx-auto py-3.5 px-6 rounded-full bg-white text-[#C0000D] hover:bg-white/95 active:scale-[0.98] transition-all duration-300 font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_10px_25px_rgba(0,0,0,0.15)] hover:shadow-[0_15px_30px_rgba(255,255,255,0.1)] cursor-pointer group disabled:opacity-85"
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Verifying Session...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </main>

      {/* Footer System Disclaimer */}
      <footer className="py-6 px-6 text-center text-[9px] font-mono text-white/50 z-10 border-t border-white/5 bg-black/10">
        <div className="max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 ASABB Bank Zambia. All rights reserved.</span>
          <span className="hidden sm:inline text-white/20">|</span>
          <span className="font-sans uppercase tracking-widest text-[8px] font-bold text-white/40">ASABB NOC Portal</span>
        </div>
      </footer>

    </div>
  );
}
