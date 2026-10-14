import React, { useState, useEffect } from 'react';

interface AssistantAvatarProps {
  isSpeaking?: boolean;
  isThinking?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function AssistantAvatar({
  isSpeaking = false,
  isThinking = false,
  size = 'md',
  className = ''
}: AssistantAvatarProps) {
  const [blink, setBlink] = useState(false);
  const [lookDirection, setLookDirection] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [mouthOpenFrame, setMouthOpenFrame] = useState(0);

  // Periodic Eye Blink
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 180);
    }, 3800);

    return () => clearInterval(blinkInterval);
  }, []);

  // Eye Look Around Animation (Slight shifting pupil gaze)
  useEffect(() => {
    const lookInterval = setInterval(() => {
      if (Math.random() > 0.4) {
        const x = (Math.random() - 0.5) * 4; // -2 to +2
        const y = (Math.random() - 0.5) * 3; // -1.5 to +1.5
        setLookDirection({ x, y });
      } else {
        setLookDirection({ x: 0, y: 0 });
      }
    }, 2400);

    return () => clearInterval(lookInterval);
  }, []);

  // Mouth Movement Animation when Speaking or Thinking
  useEffect(() => {
    if (!isSpeaking && !isThinking) {
      setMouthOpenFrame(0);
      return;
    }

    const mouthInterval = setInterval(() => {
      setMouthOpenFrame((prev) => (prev + 1) % 4);
    }, isSpeaking ? 120 : 250);

    return () => clearInterval(mouthInterval);
  }, [isSpeaking, isThinking]);

  // Size mappings
  const dimensionMap = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  // Mouth shapes based on frame
  const getMouthPath = () => {
    if (!isSpeaking && !isThinking) {
      // Gentle relaxed smile
      return 'M 42,67 Q 50,72 58,67';
    }

    switch (mouthOpenFrame) {
      case 1:
        // Slightly open "A/E"
        return 'M 43,66 Q 50,74 57,66 Q 50,70 43,66 Z';
      case 2:
        // Wider open "O"
        return 'M 44,65 C 44,75 56,75 56,65 C 56,73 44,73 44,65 Z';
      case 3:
        // Smile open "I"
        return 'M 41,66 Q 50,75 59,66 Q 50,68 41,66 Z';
      default:
        // Closed / small mouth
        return 'M 44,67 Q 50,70 56,67';
    }
  };

  return (
    <div className={`relative inline-flex items-center justify-center rounded-full bg-gradient-to-b from-[#DA0000] to-[#800000] p-1 shadow-md select-none shrink-0 ${dimensionMap[size]} ${className}`}>
      
      {/* Outer Status / Speaking Wave Ring */}
      {isSpeaking && (
        <span className="absolute -inset-1 rounded-full border-2 border-red-400 opacity-75 animate-ping pointer-events-none" />
      )}
      {isThinking && (
        <span className="absolute -inset-1 rounded-full border-2 border-amber-300 opacity-60 animate-pulse pointer-events-none" />
      )}

      {/* SVG Character Avatar */}
      <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 relative">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full transform transition-transform duration-300 hover:scale-105"
        >
          <defs>
            <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fde0dc" />
              <stop offset="100%" stopColor="#f8bbd0" />
            </linearGradient>
            <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2d132c" />
              <stop offset="100%" stopColor="#1a0003" />
            </linearGradient>
            <linearGradient id="shirtGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#DA0000" />
              <stop offset="100%" stopColor="#800000" />
            </linearGradient>
          </defs>

          {/* Background Ambient Glow */}
          <circle cx="50" cy="50" r="50" fill="#0f172a" />

          {/* Torso / Absa Uniform Shirt */}
          <path
            d="M 22,95 Q 50,80 78,95 L 82,100 L 18,100 Z"
            fill="url(#shirtGrad)"
          />
          {/* Lanyard / V-Neck accent */}
          <path d="M 44,82 L 50,92 L 56,82" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.8" />
          <rect x="47" y="91" width="6" height="8" rx="1" fill="#ffffff" opacity="0.9" />

          {/* Neck */}
          <rect x="43" y="68" width="14" height="15" fill="url(#skinGrad)" rx="2" />

          {/* Face Base */}
          <path
            d="M 31,38 C 31,23 69,23 69,38 C 69,58 62,75 50,75 C 38,75 31,58 31,38 Z"
            fill="url(#skinGrad)"
          />

          {/* Cheeks / Blush */}
          <ellipse cx="37" cy="56" rx="4" ry="2.5" fill="#f48fb1" opacity="0.45" />
          <ellipse cx="63" cy="56" rx="4" ry="2.5" fill="#f48fb1" opacity="0.45" />

          {/* Nose */}
          <path d="M 49,52 Q 50,56 52,55" fill="none" stroke="#e57373" strokeWidth="1" strokeLinecap="round" opacity="0.6" />

          {/* Eyes & Eyebrows */}
          {blink ? (
            /* Closed Eyes (Blinking) */
            <g stroke="#371b28" strokeWidth="2" strokeLinecap="round">
              <path d="M 36,46 Q 42,50 46,46" />
              <path d="M 54,46 Q 58,50 64,46" />
            </g>
          ) : (
            /* Open Eyes with pupils moving */
            <g>
              {/* Eyebrows */}
              <path d="M 34,39 Q 41,36 47,40" fill="none" stroke="#2a0812" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M 53,40 Q 59,36 66,39" fill="none" stroke="#2a0812" strokeWidth="1.8" strokeLinecap="round" />

              {/* Left Eye White */}
              <ellipse cx="41" cy="46" rx="5.5" ry="4" fill="#ffffff" />
              {/* Left Pupil */}
              <circle
                cx={41 + lookDirection.x}
                cy={46 + lookDirection.y}
                r="2.8"
                fill="#3e2723"
              />
              <circle
                cx={42.2 + lookDirection.x}
                cy={45 + lookDirection.y}
                r="1"
                fill="#ffffff"
              />

              {/* Right Eye White */}
              <ellipse cx="59" cy="46" rx="5.5" ry="4" fill="#ffffff" />
              {/* Right Pupil */}
              <circle
                cx={59 + lookDirection.x}
                cy={46 + lookDirection.y}
                r="2.8"
                fill="#3e2723"
              />
              <circle
                cx={60.2 + lookDirection.x}
                cy={45 + lookDirection.y}
                r="1"
                fill="#ffffff"
              />

              {/* Eyelashes */}
              <path d="M 35,44 Q 41,41 47,44" fill="none" stroke="#2a0812" strokeWidth="1.2" />
              <path d="M 53,44 Q 59,41 65,44" fill="none" stroke="#2a0812" strokeWidth="1.2" />
            </g>
          )}

          {/* Mouth (Open / Close depending on speaking state) */}
          <path
            d={getMouthPath()}
            fill={isSpeaking || isThinking ? '#ad1457' : 'none'}
            stroke="#ad1457"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Chic Hairstyle - Frame Top & Sides */}
          <path
            d="M 30,36 C 26,18 42,12 50,12 C 58,12 74,18 70,36 C 73,28 66,16 50,16 C 34,16 27,28 30,36 Z"
            fill="url(#hairGrad)"
          />
          {/* Side Hair Flow */}
          <path
            d="M 31,32 C 26,45 28,62 25,72 C 29,60 33,48 34,36 Z"
            fill="url(#hairGrad)"
          />
          <path
            d="M 69,32 C 74,45 72,62 75,72 C 71,60 67,48 66,36 Z"
            fill="url(#hairGrad)"
          />
          {/* Bangs */}
          <path
            d="M 32,32 Q 42,24 52,30 Q 62,24 68,32 Q 58,22 48,27 Q 38,22 32,32 Z"
            fill="url(#hairGrad)"
          />

          {/* Headset / Earpiece for NOC Operator vibe */}
          <path
            d="M 28,32 C 28,15 72,15 72,32"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {/* Earpiece Pad */}
          <rect x="25" y="34" width="4" height="12" rx="2" fill="#DA0000" />
          <rect x="71" y="34" width="4" height="12" rx="2" fill="#DA0000" />
          {/* Mic Boom curved to mouth */}
          <path
            d="M 27,42 Q 28,64 42,66"
            fill="none"
            stroke="#64748b"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <circle cx="42" cy="66" r="2" fill="#DA0000" />
        </svg>

        {/* Live Audio Indicator Badge when Speaking */}
        {isSpeaking && (
          <div className="absolute bottom-0 right-0 bg-emerald-500 border border-white text-white p-0.5 rounded-full shadow-sm">
            <span className="block h-1.5 w-1.5 rounded-full bg-white animate-ping" />
          </div>
        )}
      </div>

    </div>
  );
}
