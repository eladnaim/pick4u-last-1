
import React from 'react';
import { Home, ListFilter, UserCircle } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'home' | 'feed' | 'profile';
  setActiveTab: (tab: 'home' | 'feed' | 'profile') => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-3 pb-6 z-30 flex justify-between items-center shadow-[0_-5px_20px_rgba(0,0,0,0.03)]">
      <button 
        onClick={() => setActiveTab('feed')}
        className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'feed' ? 'text-brand-600' : 'text-slate-400'}`}
      >
        <ListFilter className={`w-6 h-6 ${activeTab === 'feed' ? 'fill-current' : ''}`} />
        <span className="text-[10px] font-medium">בקשות אחרונות</span>
      </button>

      <button 
        onClick={() => setActiveTab('home')}
        className="relative -top-5"
      >
        <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${activeTab === 'home' ? 'bg-brand-500 text-white shadow-brand-500/30' : 'bg-brand-950 text-white shadow-brand-950/30'}`}>
          <Home className="w-6 h-6" />
        </div>
      </button>

      <button 
        onClick={() => setActiveTab('profile')}
        className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'profile' ? 'text-brand-600' : 'text-slate-400'}`}
      >
        <UserCircle className={`w-6 h-6 ${activeTab === 'profile' ? 'fill-current' : ''}`} />
        <span className="text-[10px] font-medium">פרופיל</span>
      </button>
    </div>
  );
};
