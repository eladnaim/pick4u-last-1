import React from 'react';
import { Bell, Menu, Share2, Settings } from 'lucide-react';
import { Logo } from './Logo';

interface HeaderProps {
  karma: number;
  userName?: string;
  onSystemTest?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ karma, userName, onSystemTest }) => {
  
  const handleShare = () => {
    const text = encodeURIComponent("היי! מצאתי אפליקציה גאונית לאיסוף חבילות בשכונה - Pick4U. בואו נעזור אחד לשני!");
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-20 bg-white/90 backdrop-blur-xl border-b border-slate-100 px-4 py-3 safe-area-top shadow-sm">
      <div className="grid grid-cols-3 items-center">
        
        {/* Left: User Stats */}
        <div className="flex justify-start">
           <div className="flex flex-col items-start">
             <span className="text-xs font-bold text-brand-950">היי, {userName || 'משתמש'}</span>
             <div className="flex items-center gap-1 text-[10px] text-slate-500 bg-brand-50 px-2 py-0.5 rounded-full mt-1">
               <span className="font-bold text-brand-600">{karma}</span> נקודות
             </div>
           </div>
        </div>

        {/* Center: Logo */}
        <div className="flex justify-center flex-col items-center">
          <Logo className="w-10 h-10" />
          <span className="text-[8px] text-slate-400 mt-1">v1.0.1</span>
        </div>
        
        {/* Right: Actions */}
        <div className="flex justify-end items-center gap-2">
          <button 
            onClick={handleShare}
            className="p-2 rounded-full hover:bg-slate-50 transition-colors text-green-600"
            title="שתף בוואטסאפ"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-full hover:bg-slate-50 transition-colors relative">
            <Bell className="w-5 h-5 text-slate-600" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full ring-1 ring-white"></span>
          </button>
          {onSystemTest && (
            <button 
              onClick={onSystemTest}
              className="p-2 rounded-full hover:bg-slate-50 transition-colors text-blue-600"
              title="בדיקת מערכת"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};