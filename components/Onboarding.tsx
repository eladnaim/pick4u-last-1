import React, { useState } from 'react';
import { User, CITIES, DEFAULT_COMMUNITIES } from '../types';
import { Logo } from './Logo';
import { ShieldCheck, UserPlus, LogIn } from 'lucide-react';
import { ExistingUserLogin } from './ExistingUserLogin';

interface OnboardingProps {
  onComplete: (userData: Partial<User>) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [city, setCity] = useState(CITIES[0]);
  const [community, setCommunity] = useState(DEFAULT_COMMUNITIES[CITIES[0]][0]);
  const [name, setName] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showExistingUserLogin, setShowExistingUserLogin] = useState(false);

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

  const handleExistingUserLogin = (userData: { id: string; name: string }) => {
    onComplete({
      id: userData.id,
      name: userData.name,
      city,
      community,
      hasCompletedOnboarding: true
    });
  };

  if (showExistingUserLogin) {
    return (
      <ExistingUserLogin 
        onLogin={handleExistingUserLogin}
        onBack={() => setShowExistingUserLogin(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-white overflow-y-auto" dir="rtl">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md py-8">
          
          <div className="text-center mb-6">
            <Logo className="w-20 h-20 mb-4 mx-auto" animated />
            <h1 className="text-2xl font-bold text-brand-950 mb-2">ברוכים הבאים ל-Pick4U</h1>
            <p className="text-slate-500 text-center text-sm">הקהילה שעוזרת לך לחסוך זמן בדואר.</p>
          </div>

          {/* Existing User Login Option */}
          <div className="mb-6">
            <button
              onClick={() => setShowExistingUserLogin(true)}
              className="w-full p-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl flex items-center justify-center space-x-3 hover:shadow-lg transition-all duration-300 mb-3"
            >
              <LogIn className="w-5 h-5" />
              <span className="font-semibold">התחבר כמשתמש קיים</span>
            </button>
            
            <div className="text-center">
              <span className="text-sm text-slate-500">או</span>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-brand-900">איך קוראים לך?</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-base"
                placeholder="ישראל ישראלי"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-bold text-brand-900">עיר</label>
                <select 
                  value={city}
                  onChange={e => handleCityChange(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-base"
                >
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-brand-900">שכונה/קהילה</label>
                <select 
                  value={community}
                  onChange={e => setCommunity(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-base"
                >
                  {DEFAULT_COMMUNITIES[city]?.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 mb-4">
            <div className="flex gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-brand-900 text-sm mb-1">גילוי דעת משפטי</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  אפליקציית Pick4U משמשת כפלטפורמה לחיבור בין אנשים בלבד. האחריות על העברת החבילה, התשלום וטיב השירות חלה באופן מלא ובלעדי על הצדדים.
                </p>
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2 mb-4 cursor-pointer p-2">
            <input 
              type="checkbox" 
              checked={acceptedTerms}
              onChange={e => setAcceptedTerms(e.target.checked)}
              className="w-4 h-4 accent-brand-600 rounded"
            />
            <span className="text-sm text-slate-700 font-medium">קראתי ואני מאשר/ת את התנאים</span>
          </label>

          <button 
            onClick={handleFinish}
            disabled={!name || !acceptedTerms}
            className="w-full bg-brand-600 text-white py-3 rounded-2xl font-bold text-base shadow-lg shadow-brand-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            התחל להשתמש
          </button>
        </div>
      </div>
    </div>
  );
};