import React from 'react';

interface LogoProps {
  className?: string;
  animated?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-10 h-10", animated = false }) => {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="brandGradient" x1="10" y1="10" x2="90" y2="90">
          <stop offset="0%" stopColor="#38bdf8" /> {/* brand-400 Light Blue */}
          <stop offset="100%" stopColor="#007AFF" /> {/* brand-500 Vibrant Blue */}
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {/* Background Glow */}
      <circle cx="50" cy="50" r="35" fill="url(#brandGradient)" opacity="0.2" filter="url(#glow)" className={animated ? "animate-pulse" : ""} />

      {/* Main Shape: Abstract Package / Location Pin / 'P' */}
      <path
        d="M30 40 C30 25, 70 25, 70 40 C70 55, 50 85, 50 85 C50 85, 30 55, 30 40 Z"
        fill="url(#brandGradient)"
        className={`drop-shadow-md ${animated ? "animate-bounce" : ""}`}
      />
      
      {/* Inner Cutout - Smile / Box Opening */}
      <path
        d="M40 40 C40 45, 60 45, 60 40"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        className={animated ? "animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]" : ""}
        opacity="0.9"
      />
      
      {/* Top Dot */}
      <circle cx="62" cy="30" r="4" fill="#f0f9ff" className={animated ? "animate-ping" : ""} />
    </svg>
  );
};