import React, { useState, useEffect, useRef } from 'react';
import { signInAnonymously } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { subscribeToRequests, createNewRequest } from './services/dbService';
import { Header } from './components/Header';
import { RequestCard } from './components/RequestCard';
import { CameraModal } from './components/CameraModal';
import { BottomNav } from './components/BottomNav';
import { Profile } from './components/Profile';
import { ChatModal } from './components/ChatModal';
import { Onboarding } from './components/Onboarding';
import { Logo } from './components/Logo';
import { PackageRequest, PackageType, RequestStatus, ScanResult, User } from './types';
import { getAiPriceRecommendation, analyzeUserRisk } from './services/aiSmartService';
import { ScanLine, CheckCircle2, MapPin, ArrowDown, Bike, BellRing, X, Sparkles, Globe2, Loader2, ShieldCheck } from 'lucide-react';

const INITIAL_USER: User = {
  id: 'temp_id',
  name: '',
  avatar: 'https://picsum.photos/100/100?random=99',
  karma: 0,
  rating: 5.0,
  city: '',
  community: '',
  isCollectorMode: false,
  isUniversalCollector: false,
  hasCompletedOnboarding: false
};

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'feed' | 'profile'>('home');
  const [showCamera, setShowCamera] = useState(false);
  const [scannedData, setScannedData] = useState<ScanResult | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USER);
  const [showPushPrompt, setShowPushPrompt] = useState(false);
  const [hotZoneAlert, setHotZoneAlert] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  
  const [requests, setRequests] = useState<PackageRequest[]>([]);
  const [activeChatRequest, setActiveChatRequest] = useState<PackageRequest | null>(null);
  const [isRequestingCollection, setIsRequestingCollection] = useState(false);
  const notificationSound = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'));
  const [aiPriceSuggestion, setAiPriceSuggestion] = useState<number>(0);
  const [aiPriceReason, setAiPriceReason] = useState<string>('');
  
  const [userMode, setUserMode] = useState<'requester' | 'collector'>('requester');

  useEffect(() => {
    const init = async () => {
        const storedUser = localStorage.getItem('pick4u_user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setCurrentUser(parsedUser);
            if (!parsedUser.hasCompletedOnboarding) setShowOnboarding(true);
        } else {
            setShowOnboarding(true);
        }

        try {
            const userCredential = await signInAnonymously(auth);
            setCurrentUser(prev => ({ ...prev, id: userCredential.user.uid }));
        } catch (error) {
            console.error("Auth Error:", error);
        }
    };
    init();
  }, []);

  useEffect(() => {
      if (currentUser.name) {
          localStorage.setItem('pick4u_user', JSON.stringify(currentUser));
      }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser.city || !currentUser.community) return;
    const unsubscribe = subscribeToRequests(
        currentUser.city, 
        currentUser.community, 
        currentUser.isUniversalCollector,
        (newRequests) => setRequests(newRequests)
    );
    return () => unsubscribe();
  }, [currentUser.city, currentUser.community, currentUser.isUniversalCollector]);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleOnboardingComplete = (data: Partial<User>) => {
      setCurrentUser(prev => ({ ...prev, ...data, hasCompletedOnboarding: true }));
      setShowOnboarding(false);
  };

  const showToast = (msg: string) => {
      setToastMsg(msg);
      setTimeout(() => setToastMsg(null), 4000);
  };

  const handleGoingToPost = () => {
      setActiveTab('feed');
      showToast(`📢 נשלחה הודעה לחברי קהילת ${currentUser.community}: "אני בדרך לדואר!"`);
  };

  const handleScanSuccess = (data: ScanResult) => {
    setScannedData(data);
    const recommendation = getAiPriceRecommendation(PackageType.MEDIUM, 1);
    setAiPriceSuggestion(recommendation.price);
    setAiPriceReason(recommendation.reason);
    setShowSuccessModal(true);
  };

  const handlePublishRequest = async () => {
      if (!scannedData) return;
      try {
          const newRequest: any = {
              requester: currentUser,
              location: scannedData.location || currentUser.city,
              distance: '0 ק״מ',
              reward: aiPriceSuggestion,
              deadline: scannedData.deadline || 'היום',
              type: PackageType.MEDIUM,
              status: RequestStatus.PENDING,
              isHidden: true,
              trackingNumber: scannedData.trackingNumber || 'N/A',
              isAiVerified: !!scannedData.trackingNumber
          };

          await createNewRequest(newRequest);
          setShowSuccessModal(false);
          showToast("✅ הבקשה פורסמה לקהילה בהצלחה!");
          setActiveTab('feed');
      } catch (error) {
          alert("שגיאה בפרסום הבקשה.");
      }
  };

  const handleCollectRequest = (request: PackageRequest) => {
    setIsRequestingCollection(true);
    try { notificationSound.current.play().catch(e => {}); } catch (e) {}

    setTimeout(() => {
      setIsRequestingCollection(false);
      setActiveChatRequest(request);
    }, 1500);
  };

  if (showSplash) {
    return (
      <div className="fixed inset-0 z-[100] bg-brand-50 flex flex-col items-center justify-center animate-out fade-out duration-500 delay-[2000ms]">
        <div className="relative"><Logo className="w-32 h-32 mb-6" animated /><div className="absolute -inset-10 bg-brand-500/20 blur-3xl rounded-full -z-10 animate-pulse"></div></div>
        <h1 className="text-3xl font-bold text-brand-600 tracking-tight mb-2">Pick4U</h1>
      </div>
    );
  }

  if (showOnboarding) {
      return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  const renderHome = () => (
    <div className="pt-24 px-4 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="mb-8 text-center flex flex-col items-center">
        <h2 className="text-2xl font-bold text-brand-900 mb-2">שלום {currentUser.name.split(' ')[0]},</h2>
        
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
        <p className="text-slate-500 text-sm">קהילת {currentUser.community} ב{currentUser.city}</p>
      </div>

      <div className="grid grid-cols-1 gap-5">
        
        {userMode === 'requester' && (
            <button 
            onClick={() => setShowCamera(true)}
            className="relative overflow-hidden group bg-white p-6 rounded-[2rem] border border-brand-500 ring-4 ring-brand-50 shadow-xl transition-all active:scale-[0.98] text-right"
            >
            <div className="absolute top-0 left-0 w-32 h-32 bg-brand-50 rounded-br-full -translate-x-4 -translate-y-4"></div>
            <div className="relative z-10 flex justify-between items-center">
                <div>
                <div className="bg-brand-100 w-14 h-14 rounded-2xl flex items-center justify-center mb-4 text-brand-600 shadow-sm"><ScanLine className="w-7 h-7" /></div>
                <h3 className="text-xl font-bold text-brand-950">אני צריך איסוף</h3>
                <p className="text-slate-500 text-sm mt-1 max-w-[200px]">סריקה או הזנה ידנית.</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-full border border-slate-100"><ArrowDown className="w-6 h-6 text-brand-500 -rotate-90" /></div>
            </div>
            </button>
        )}

        {userMode === 'collector' && (
            <button 
            onClick={handleGoingToPost}
            className="relative overflow-hidden group bg-brand-600 p-6 rounded-[2rem] shadow-xl shadow-brand-600/30 ring-4 ring-brand-200 transition-all active:scale-[0.98] text-right"
            >
                <div className="absolute top-0 left-0 w-40 h-40 bg-brand-500 rounded-br-full -translate-x-10 -translate-y-10 opacity-50"></div>
                <div className="relative z-10 flex justify-between items-center">
                <div>
                <div className="bg-brand-500 w-14 h-14 rounded-2xl flex items-center justify-center mb-4 text-white border border-brand-400"><Bike className="w-7 h-7" /></div>
                <h3 className="text-xl font-bold text-white">אני בדרך לדואר</h3>
                <p className="text-brand-100 text-sm mt-1 max-w-[200px]">שתף את הקהילה</p>
                </div>
                <div className="bg-brand-500 p-3 rounded-full border border-brand-400"><ArrowDown className="w-6 h-6 text-brand-100" /></div>
            </div>
            </button>
        )}
      </div>

      <div className="mt-8">
        <h4 className="font-bold text-brand-900 mb-4 px-2">בקשות אחרונות ב{currentUser.community}</h4>
        <div className="opacity-60 scale-95 origin-top pointer-events-none">
            {requests[0] && (
              <RequestCard 
                request={requests[0]} 
                onChatClick={() => setActiveChatRequest(requests[0])} 
                onCollectClick={() => handleCollectRequest(requests[0])}
              />
            )}
        </div>
      </div>
    </div>
  );

  const renderFeed = () => (
    <div className="pt-24 px-4 pb-24 animate-in fade-in duration-300">
       <h3 className="text-xl font-bold text-brand-900 flex items-center gap-2 mb-6">
           <MapPin className="w-5 h-5 text-brand-500" /> {currentUser.community}
           <span className="text-xs font-medium bg-brand-100 text-brand-700 px-3 py-1.5 rounded-full mr-auto">{requests.length} בקשות</span>
       </h3>
       <div className="space-y-4">
          {requests.length > 0 ? requests.map(req => (
               <RequestCard 
                 key={req.id} 
                 request={req} 
                 onChatClick={() => setActiveChatRequest(req)}
                 onCollectClick={() => handleCollectRequest(req)}
                 isOwner={req.requester.id === currentUser.id}
               />
            )) : <div className="text-center py-10 text-slate-400">אין בקשות כרגע.</div>}
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Header karma={currentUser.karma} />

      {toastMsg && (
          <div className="fixed top-20 left-4 right-4 z-50 bg-green-600 text-white p-4 rounded-xl shadow-lg animate-in slide-in-from-top-4 flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full"><BellRing className="w-5 h-5" /></div>
              <p className="text-sm font-bold">{toastMsg}</p>
          </div>
      )}

      {activeTab === 'home' && renderHome()}
      {activeTab === 'feed' && renderFeed()}
      {activeTab === 'profile' && <Profile user={currentUser} onUpdateUser={setCurrentUser} />}

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeChatRequest && (
        <ChatModal 
          currentUser={currentUser} 
          request={activeChatRequest}
          onClose={() => setActiveChatRequest(null)} 
        />
      )}

      {showSuccessModal && scannedData && (
         <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative animate-in slide-in-from-bottom-10 duration-300">
               <button onClick={() => setShowSuccessModal(false)} className="absolute top-4 left-4 p-2 bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
               <div className="flex flex-col items-center text-center mt-2">
                 <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
                 <h2 className="text-xl font-bold text-slate-800 mb-2">החבילה נקלטה!</h2>
                 <div className="bg-slate-50 rounded-xl p-4 w-full mb-4 border border-slate-100 text-right">
                    <p className="text-xs text-slate-500">מיקום:</p>
                    <p className="font-bold text-brand-900">{scannedData.location || 'לא זוהה מיקום'}</p>
                    <p className="text-xs text-slate-500 mt-2">מעקב (מוצפן):</p>
                    <p className="font-mono text-slate-800">{scannedData.trackingNumber || '---'}</p>
                 </div>
                 <button onClick={handlePublishRequest} className="w-full bg-brand-600 text-white py-3.5 rounded-xl font-bold">פרסם בקשה</button>
               </div>
            </div>
         </div>
      )}

      {isRequestingCollection && (
          <div className="fixed inset-0 z-[60] bg-brand-900/60 backdrop-blur-sm flex flex-col items-center justify-center text-white">
              <div className="bg-brand-950 p-8 rounded-3xl flex flex-col items-center shadow-2xl"><Loader2 className="w-12 h-12 animate-spin mb-4" /><p>פותח צ'אט...</p></div>
          </div>
      )}

      {showCamera && <CameraModal onClose={() => setShowCamera(false)} onScanSuccess={handleScanSuccess} />}
    </div>
  );
};

export default App;