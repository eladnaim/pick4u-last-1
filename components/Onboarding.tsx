import React, { useState } from 'react';
import { User, CITIES, DEFAULT_COMMUNITIES } from '../types';
import { Logo } from './Logo';
import { ShieldCheck } from 'lucide-react';

interface OnboardingProps {
  onComplete: (userData: Partial<User>) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [city, setCity] = useState(CITIES[0]);
  const [community, setCommunity] = useState(DEFAULT_COMMUNITIES[CITIES[0]][0]);
  const [name, setName] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleCityChange = (newCity: string) => {
    setCity(newCity);
    setCommunity(DEFAULT_COMMUNITIES[newCity][0] || '');
  };

  const handleFinish = () => {
    if (name && acceptedTerms) {
      onComplete({
        name,
        city,
        community,
        hasCompletedOnboarding: true
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-6" dir="rtl">
      <div className="w-full max-w-md flex flex-col h-full">
        
        <div className="flex-1 flex flex-col items-center justify-center">
          <Logo className="w-24 h-24 mb-6" animated />
          <h1 className="text-3xl font-bold text-brand-950 mb-2">ברוכים הבאים ל-Pick4U</h1>
          <p className="text-slate-500 text-center mb-8">הקהילה שעוזרת לך לחסוך זמן בדואר.</p>

          <div className="w-full space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-brand-900">איך קוראים לך?</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                placeholder="ישראל ישראלי"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-brand-900">עיר</label>
                <select 
                  value={city}
                  onChange={e => handleCityChange(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                >
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-brand-900">שכונה/קהילה</label>
                <select 
                  value={community}
                  onChange={e => setCommunity(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                >
                  {DEFAULT_COMMUNITIES[city]?.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-6">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6">
            <div className="flex gap-3">
              <ShieldCheck className="w-6 h-6 text-brand-600 shrink-0" />
              <div>
                <h3 className="font-bold text-brand-900 text-sm mb-1">גילוי דעת משפטי</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  אפליקציית Pick4U משמשת כפלטפורמה לחיבור בין אנשים בלבד. האחריות על העברת החבילה, התשלום וטיב השירות חלה באופן מלא ובלעדי על הצדדים.
                </p>
              </div>
            </div>
          </div>

          <label className="flex items-center gap-3 mb-6 cursor-pointer p-2">
            <input 
              type="checkbox" 
              checked={acceptedTerms}
              onChange={e => setAcceptedTerms(e.target.checked)}
              className="w-5 h-5 accent-brand-600 rounded"
            />
            <span className="text-sm text-slate-700 font-medium">קראתי ואני מאשר/ת את התנאים</span>
          </label>

          <button 
            onClick={handleFinish}
            disabled={!name || !acceptedTerms}
            className="w-full bg-brand-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-brand-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            התחל להשתמש
          </button>
        </div>

      </div>
    </div>
  );
};