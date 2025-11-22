
import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { RequestCard } from './components/RequestCard';
import { CameraModal } from './components/CameraModal';
import { BottomNav } from './components/BottomNav';
import { Profile } from './components/Profile';
import { ChatModal } from './components/ChatModal';
import { Logo } from './components/Logo';
import { PackageRequest, PackageType, RequestStatus, ScanResult, User } from './types';
import { getAiPriceRecommendation, shouldShowRequestToUser, analyzeUserRisk } from './services/aiSmartService';
import { ScanLine, CheckCircle2, MapPin, ArrowDown, Bike, BellRing, X, Sparkles, Globe2, Loader2, ShieldCheck } from 'lucide-react';

// Mock User
const CURRENT_USER: User = {
  id: 'me',
  name: 'עמית ישראלי',
  phone: '054-1234567',
  bio: 'גר בכרמית, עובד מהבית. זמין לאיסופים בשעות הצהריים.',
  avatar: 'https://picsum.photos/100/100?random=99',
  karma: 1250,
  rating: 4.95,
  collectorRating: 5.0,
  requesterRating: 4.8,
  city: 'מיתר',
  community: 'כרמית',
  isCollectorMode: false,
  isUniversalCollector: false
};

// Mock Data
const MOCK_REQUESTS: PackageRequest[] = [
  {
    id: '1',
    requester: {
      id: 'u1',
      name: 'רונית כהן',
      avatar: 'https://picsum.photos/100/100?random=1',
      karma: 950,
      rating: 4.98,
      collectorRating: 4.9,
      requesterRating: 5.0,
      city: 'מיתר',
      community: 'כרמית',
      isCollectorMode: false,
      isUniversalCollector: false
    },
    location: 'דואר מרכז מסחרי מיתר',
    distance: '300 מ׳ ממך',
    reward: 25,
    deadline: 'היום עד 18:00',
    type: PackageType.MEDIUM,
    status: RequestStatus.PENDING,
    isHidden: true,
    trackingNumber: 'RR123456789IL',
    isAiVerified: true
  },
  {
    id: '2',
    requester: {
      id: 'u2',
      name: 'יוסי לוי',
      avatar: 'https://picsum.photos/100/100?random=2',
      karma: 120,
      rating: 4.5,
      collectorRating: 4.2,
      requesterRating: 4.8,
      city: 'מיתר',
      community: 'כרמית',
      isCollectorMode: false,
      isUniversalCollector: false
    },
    location: 'לוקר כניסה לכרמית',
    distance: '5 דק׳ נסיעה',
    reward: 35,
    deadline: 'מחר בבוקר',
    type: PackageType.SMALL,
    status: RequestStatus.PENDING,
    isHidden: true,
    trackingNumber: 'LP987654321IL',
    isAiVerified: false
  }
];

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'feed' | 'profile'>('home');
  const [showCamera, setShowCamera] = useState(false); // Closed by default
  const [scannedData, setScannedData] = useState<ScanResult | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<User>(CURRENT_USER);
  const [showPushPrompt, setShowPushPrompt] = useState(false);
  const [hotZoneAlert, setHotZoneAlert] = useState(false);
  
  // Chat State
  const [activeChatRequest, setActiveChatRequest] = useState<PackageRequest | null>(null);
  
  // Collection Request State
  const [isRequestingCollection, setIsRequestingCollection] = useState(false);
  const notificationSound = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'));

  // AI State
  const [aiPriceSuggestion, setAiPriceSuggestion] = useState<number>(0);
  const [aiPriceReason, setAiPriceReason] = useState<string>('');
  
  // Mode Toggle
  const [userMode, setUserMode] = useState<'requester' | 'collector'>('requester');

  const SIMULATED_CURRENT_CITY = 'מיתר'; 

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showSplash) {
      const hasSeenPrompt = localStorage.getItem('push_prompt_seen');
      if (!hasSeenPrompt) {
        const timer = setTimeout(() => setShowPushPrompt(true), 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [showSplash]);

  useEffect(() => {
    if (userMode === 'collector' && (currentUser.isCollectorMode || currentUser.isUniversalCollector)) {
      const timer = setTimeout(() => {
        setHotZoneAlert(true);
        setTimeout(() => setHotZoneAlert(false), 8000);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setHotZoneAlert(false);
    }
  }, [userMode, currentUser.isCollectorMode, currentUser.isUniversalCollector]);

  const handleScanSuccess = (data: ScanResult) => {
    setScannedData(data);
    const recommendation = getAiPriceRecommendation(PackageType.MEDIUM, 1);
    setAiPriceSuggestion(recommendation.price);
    setAiPriceReason(recommendation.reason);
    setShowSuccessModal(true);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
  };

  const handlePushPermission = (allow: boolean) => {
    setShowPushPrompt(false);
    localStorage.setItem('push_prompt_seen', 'true');
    if (allow) console.log("Notification permission requested");
  };

  const handleCollectRequest = (request: PackageRequest) => {
    setIsRequestingCollection(true);
    try {
      notificationSound.current.play().catch(e => console.log("Sound play blocked", e));
    } catch (e) { console.error("Audio play failed", e); }

    setTimeout(() => {
      setIsRequestingCollection(false);
      setActiveChatRequest(request);
    }, 2000);
  };

  // Filter requests
  const filteredRequests = MOCK_REQUESTS.filter(req => {
    if (req.status === RequestStatus.COMPLETED && req.completedAt) {
      const oneDay = 24 * 60 * 60 * 1000;
      if (Date.now() - req.completedAt > oneDay) return false;
    }
    const riskAnalysis = analyzeUserRisk(req.requester);
    if (riskAnalysis.riskLevel === 'HIGH') return false;
    return shouldShowRequestToUser(
      currentUser,
      req.requester.community,
      req.requester.city,
      SIMULATED_CURRENT_CITY
    );
  });

  if (showSplash) {
    return (
      <div className="fixed inset-0 z-[100] bg-brand-50 flex flex-col items-center justify-center animate-out fade-out duration-500 delay-[2000ms]">
        <div className="relative">
          <Logo className="w-32 h-32 mb-6" animated />
          <div className="absolute -inset-10 bg-brand-500/20 blur-3xl rounded-full -z-10 animate-pulse"></div>
        </div>
        <h1 className="text-3xl font-bold text-brand-600 tracking-tight mb-2">Pick4U</h1>
        <p className="text-slate-500 text-sm font-medium tracking-widest">THE SOCIAL WOLT</p>
      </div>
    );
  }

  const renderHome = () => (
    <div className="pt-24 px-4 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Info & Toggle */}
      <div className="mb-8 text-center flex flex-col items-center">
        <h2 className="text-2xl font-bold text-brand-950 mb-2">שלום {currentUser.name.split(' ')[0]},</h2>
        
        {/* Mode Toggle */}
        <div className="bg-white p-1 rounded-full border border-slate-200 shadow-sm flex gap-1 mb-4">
           <button 
             onClick={() => setUserMode('requester')}
             className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${userMode === 'requester' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
           >
             אני מבקש
           </button>
           <button 
             onClick={() => setUserMode('collector')}
             className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${userMode === 'collector' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
           >
             אני מאסף
           </button>
        </div>

        <p className="text-slate-500 text-sm">קהילת {currentUser.community} ב{currentUser.city} פעילה!</p>
        {currentUser.isUniversalCollector && userMode === 'collector' && (
          <p className="text-purple-600 text-xs font-bold mt-2 inline-flex items-center gap-1 bg-purple-50 px-3 py-1 rounded-full border border-purple-100 shadow-sm">
             <Globe2 className="w-3 h-3" />
             מצב אוניברסלי פעיל
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5">
        {/* Card 1: Request Pickup */}
        <button 
          onClick={() => setShowCamera(true)}
          className={`relative overflow-hidden group bg-white p-6 rounded-[2rem] border shadow-xl shadow-slate-200/50 transition-all active:scale-[0.98] text-right ${userMode === 'requester' ? 'border-brand-500 ring-4 ring-brand-50' : 'border-slate-100'}`}
        >
          <div className="absolute top-0 left-0 w-32 h-32 bg-brand-50 rounded-br-full -translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="relative z-10 flex justify-between items-center">
            <div>
              <div className="bg-brand-100 w-14 h-14 rounded-2xl flex items-center justify-center mb-4 text-brand-600 shadow-sm">
                <ScanLine className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-brand-950">אני צריך איסוף</h3>
              <p className="text-slate-500 text-sm mt-1 max-w-[200px] leading-relaxed">
                סריקת חבילה או הזנה ידנית.
                <br/>
                <span className="text-brand-600 font-medium text-xs flex items-center gap-1 mt-1">
                  <ShieldCheck className="w-3 h-3" />
                  פרטיות מובטחת
                </span>
              </p>
            </div>
            <div className="bg-slate-50 p-3 rounded-full border border-slate-100 group-hover:bg-white transition-colors">
              <ArrowDown className="w-6 h-6 text-brand-500 -rotate-90" />
            </div>
          </div>
        </button>

        {/* Card 2: I'm Collecting (Vibrant Blue) */}
        <button 
          onClick={() => setActiveTab('feed')}
          className={`relative overflow-hidden group bg-brand-600 p-6 rounded-[2rem] shadow-xl shadow-brand-600/30 transition-all active:scale-[0.98] text-right ${userMode === 'collector' ? 'ring-4 ring-brand-200' : ''}`}
        >
            <div className="absolute top-0 left-0 w-40 h-40 bg-brand-500 rounded-br-full -translate-x-10 -translate-y-10 opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
            <div className="relative z-10 flex justify-between items-center">
            <div>
              <div className="bg-brand-500 w-14 h-14 rounded-2xl flex items-center justify-center mb-4 text-white border border-brand-400 shadow-inner">
                <Bike className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white">אני בדרך לדואר</h3>
              <p className="text-brand-100 text-sm mt-1 max-w-[200px]">
                 {currentUser.isUniversalCollector ? 'רואה בקשות מכל האזור' : 'עזור לשכנים שלך בקהילה'}
              </p>
            </div>
            <div className="bg-brand-500 p-3 rounded-full border border-brand-400">
              <ArrowDown className="w-6 h-6 text-brand-100" />
            </div>
          </div>
        </button>
      </div>

      <div className="mt-8">
        <div className="flex justify-between items-center mb-4 px-2">
            <h4 className="font-bold text-brand-900">
               {currentUser.isUniversalCollector ? 'בקשות סביבך' : `בקשות ב${currentUser.community}`}
            </h4>
            <button onClick={() => setActiveTab('feed')} className="text-brand-600 text-sm font-bold">הכל</button>
        </div>
        <div className="opacity-60 scale-95 origin-top pointer-events-none">
            {filteredRequests[0] && (
              <RequestCard 
                request={filteredRequests[0]} 
                onChatClick={() => setActiveChatRequest(filteredRequests[0])} 
                onCollectClick={() => handleCollectRequest(filteredRequests[0])}
              />
            )}
        </div>
      </div>
    </div>
  );

  const renderFeed = () => (
    <div className="pt-24 px-4 pb-24 animate-in fade-in duration-300">
       <div className="flex justify-between items-center mb-6">
         <h3 className="text-xl font-bold text-brand-900 flex items-center gap-2">
           {currentUser.isUniversalCollector ? (
              <>
                <Globe2 className="w-5 h-5 text-purple-500" />
                רדיוס אוניברסלי
              </>
           ) : (
              <>
                <MapPin className="w-5 h-5 text-brand-500" />
                {currentUser.city} - {currentUser.community}
              </>
           )}
         </h3>
         <span className="text-xs font-medium bg-brand-100 text-brand-700 px-3 py-1.5 rounded-full">
            {filteredRequests.length} בקשות
         </span>
       </div>

       <div className="space-y-4">
          {filteredRequests.length > 0 ? (
            filteredRequests.map(request => (
               <RequestCard 
                 key={request.id} 
                 request={request} 
                 onChatClick={() => setActiveChatRequest(request)}
                 onCollectClick={() => handleCollectRequest(request)}
               />
            ))
          ) : (
             <div className="text-center py-10">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                   <Bike className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-500">אין בקשות כרגע.</p>
             </div>
          )}
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Header karma={currentUser.karma} />

      {activeTab === 'home' && renderHome()}
      {activeTab === 'feed' && renderFeed()}
      {activeTab === 'profile' && <Profile user={currentUser} onUpdateUser={handleUpdateUser} />}

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Chat Modal */}
      {activeChatRequest && (
        <ChatModal 
          currentUser={currentUser} 
          request={activeChatRequest}
          onClose={() => setActiveChatRequest(null)} 
        />
      )}

      {/* Success Modal */}
      {showSuccessModal && scannedData && (
         <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative animate-in slide-in-from-bottom-10 duration-300">
               <button onClick={() => setShowSuccessModal(false)} className="absolute top-4 left-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors">
                  <X className="w-5 h-5" />
               </button>

               <div className="flex flex-col items-center text-center mt-2">
                 <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-500 mb-4">
                    <CheckCircle2 className="w-8 h-8" />
                 </div>
                 <h2 className="text-xl font-bold text-slate-800 mb-2">הבקשה נוצרה בהצלחה!</h2>
                 <p className="text-slate-500 text-sm px-4 mb-6">
                   הבקשה תפורסם לקהילה. הפרטים החסויים ייחשפו למאסף רק לאחר סגירת דיל בצ'אט.
                 </p>

                 <div className="bg-slate-50 rounded-xl p-4 w-full mb-6 border border-slate-100">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-3">
                        <span className="text-slate-500 text-sm">מיקום (ציבורי)</span>
                        <span className="font-bold text-slate-900">{scannedData.location || currentUser.city}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-sm flex items-center gap-1">
                           <ShieldCheck className="w-3 h-3 text-green-500" />
                           פרטים חסויים
                        </span>
                        <span className="font-mono text-slate-900 tracking-widest bg-slate-200 px-2 rounded text-xs">**********</span>
                    </div>
                 </div>

                 <div className="w-full bg-brand-50 border border-brand-100 rounded-xl p-3 mb-4 text-right">
                    <div className="flex items-center gap-2 mb-1">
                       <Sparkles className="w-4 h-4 text-brand-600" />
                       <span className="text-xs font-bold text-brand-700">המלצת AI</span>
                    </div>
                    <p className="text-sm text-brand-900">{aiPriceReason}</p>
                 </div>

                 <button onClick={() => setShowSuccessModal(false)} className="w-full bg-brand-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-brand-700 shadow-lg shadow-brand-500/30 transition-all active:scale-95">
                    פרסם בקשה (₪{aiPriceSuggestion})
                 </button>
               </div>
            </div>
         </div>
      )}

      {/* Loading / Approval Overlay */}
      {isRequestingCollection && (
          <div className="fixed inset-0 z-[60] bg-brand-900/60 backdrop-blur-sm flex flex-col items-center justify-center text-white animate-in fade-in">
              <div className="bg-brand-950 p-8 rounded-3xl flex flex-col items-center shadow-2xl border border-brand-800">
                 <Loader2 className="w-12 h-12 text-brand-400 animate-spin mb-4" />
                 <h3 className="text-xl font-bold mb-2">שולח בקשה...</h3>
                 <p className="text-brand-200 text-sm text-center">ממתין לאישור המבקש<br/>לפתיחת צ'אט מאובטח</p>
              </div>
          </div>
      )}

      {/* Hot Zone Alert */}
      {hotZoneAlert && (
        <div onClick={() => setActiveTab('feed')} className="fixed top-20 left-4 right-4 z-40 bg-gradient-to-r from-brand-600 to-brand-500 text-white p-4 rounded-xl shadow-lg shadow-brand-600/30 animate-in slide-in-from-top-4 cursor-pointer flex items-center justify-between border border-brand-400">
           <div className="flex items-center gap-3">
             <div className="bg-white/20 p-2 rounded-full animate-pulse">
               {currentUser.isUniversalCollector ? <Globe2 className="w-5 h-5"/> : <MapPin className="w-5 h-5" />}
             </div>
             <div>
               <h4 className="font-bold text-sm">
                 {currentUser.isUniversalCollector ? 'אזור חם (אוניברסלי)' : 'אזור חם זוהה!'}
               </h4>
               <p className="text-xs text-brand-100">נמצאו חבילות לאיסוף בקרבתך.</p>
             </div>
           </div>
           <ArrowDown className="w-5 h-5 -rotate-90" />
        </div>
      )}

      {/* Push Notification Prompt */}
      {showPushPrompt && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-brand-950 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-top-4">
           <div className="bg-brand-500 p-2.5 rounded-xl">
             <BellRing className="w-6 h-6 text-white" />
           </div>
           <div className="flex-1">
             <h4 className="font-bold text-sm">לא לפספס הזדמנויות!</h4>
             <p className="text-xs text-brand-200">קבל התראה כששכן ב{currentUser.community} צריך עזרה.</p>
           </div>
           <div className="flex gap-2">
              <button onClick={() => handlePushPermission(false)} className="text-xs text-brand-400 font-medium px-2">אחר כך</button>
              <button onClick={() => handlePushPermission(true)} className="bg-white text-brand-950 text-xs font-bold px-3 py-1.5 rounded-lg">אשר</button>
           </div>
        </div>
      )}

      {showCamera && (
        <CameraModal 
          onClose={() => setShowCamera(false)} 
          onScanSuccess={handleScanSuccess}
        />
      )}
    </div>
  );
};

export default App;
