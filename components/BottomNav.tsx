import React, { useState, useEffect } from 'react';
import { Home, ListFilter, UserCircle, Bell, MessageCircle, MapPin, Navigation, Activity } from 'lucide-react';
import { subscribeToAlerts } from '../services/communityAlertsService';
import { PackageRequest } from '../types';
import { LocationData } from '../services/locationService';

interface BottomNavProps {
  activeTab: 'home' | 'feed' | 'profile' | 'monitoring' | 'location';
  setActiveTab: (tab: 'home' | 'feed' | 'profile' | 'monitoring' | 'location') => void;
  requests?: PackageRequest[];
  onLocationUpdate?: (location: LocationData) => void;
  onRequestSelectFromMap?: (request: PackageRequest) => void;
  isAdmin?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, requests, onLocationUpdate, onRequestSelectFromMap, isAdmin }) => {
  const [collectorAlerts, setCollectorAlerts] = useState(0);
  const [requesterAlerts, setRequesterAlerts] = useState(0);
  const [chatNotifications, setChatNotifications] = useState(0);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  useEffect(() => {
    const unsubscribeCollector = subscribeToAlerts('going_to_post', (alerts) => {
      setCollectorAlerts(alerts.length);
    });

    const unsubscribeRequester = subscribeToAlerts('urgent_request', (alerts) => {
      setRequesterAlerts(alerts.length);
    });

    return () => {
      unsubscribeCollector();
      unsubscribeRequester();
    };
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Alert Indicators */}
      <div className="absolute -top-10 min-[375px]:-top-12 min-[768px]:-top-14 min-[1920px]:-top-16 left-1/2 transform -translate-x-1/2 flex gap-2 min-[375px]:gap-3 min-[768px]:gap-4 min-[1920px]:gap-6">
        {/* Collector Alerts */}
        <div className="relative">
          <div className="bg-[#3498db] text-white px-2 py-1 min-[375px]:px-3 min-[768px]:px-4 min-[1920px]:px-5 rounded-full text-[10px] min-[375px]:text-xs min-[768px]:text-sm min-[1920px]:text-base font-bold shadow-lg animate-pulse transition-all duration-300">
            {collectorAlerts} מאספים
          </div>
        </div>
        
        {/* Requester Alerts */}
        <div className="relative">
          <div className="bg-[#e74c3c] text-white px-2 py-1 min-[375px]:px-3 min-[768px]:px-4 min-[1920px]:px-5 rounded-full text-[10px] min-[375px]:text-xs min-[768px]:text-sm min-[1920px]:text-base font-bold shadow-lg animate-pulse transition-all duration-300">
            {requesterAlerts} מבקשים דחופים
          </div>
        </div>
      </div>

      {/* Main Navigation with Chat and Location buttons */}
      <div className="bg-white border-t border-slate-100 px-4 py-3 pb-6 flex justify-between items-center shadow-[0_-5px_20px_rgba(0,0,0,0.03)] 
                    min-[320px]:px-2 min-[320px]:py-2 min-[320px]:pb-4
                    min-[375px]:px-3 min-[375px]:py-3 min-[375px]:pb-5
                    min-[414px]:px-4 min-[414px]:py-3 min-[414px]:pb-6
                    min-[768px]:px-6 min-[768px]:py-4 min-[768px]:pb-8
                    min-[1024px]:px-8 min-[1024px]:py-5 min-[1024px]:pb-10
                    min-[1920px]:px-10 min-[1920px]:py-6 min-[1920px]:pb-12">
        
        {/* Left Section - Chat Button */}
        <div className="flex flex-col items-center gap-2 relative">
          <button 
            onClick={() => setShowChatModal(true)}
            className="flex flex-col items-center gap-1 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-110 active:scale-95 text-slate-400 hover:text-blue-600"
          >
            <MessageCircle className="w-6 h-6 min-[375px]:w-7 min-[375px]:h-7 min-[768px]:w-8 min-[768px]:h-8 min-[1920px]:w-9 min-[1920px]:h-9" />
            <span className="text-[10px] min-[375px]:text-xs min-[768px]:text-sm min-[1920px]:text-base font-medium">צ'אט</span>
            {chatNotifications > 0 && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full ring-1 ring-white"></div>
            )}
          </button>
        </div>

        {/* Second Left - Community Requests */}
        <div className="flex flex-col items-center gap-2 relative">
          <button 
            onClick={() => setActiveTab('feed')}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-110 active:scale-95 ${activeTab === 'feed' ? 'text-brand-600' : 'text-slate-400'}`}
          >
            <ListFilter className={`w-6 h-6 min-[375px]:w-7 min-[375px]:h-7 min-[768px]:w-8 min-[768px]:h-8 min-[1920px]:w-9 min-[1920px]:h-9 ${activeTab === 'feed' ? 'fill-current' : ''}`} />
            <span className="text-[10px] min-[375px]:text-xs min-[768px]:text-sm min-[1920px]:text-base font-medium">בקשות</span>
          </button>
        </div>

        {/* Center Section - Home Button */}
        <div className="relative mx-4 min-[375px]:mx-6 min-[768px]:mx-8 min-[1920px]:mx-10">
          <button 
            onClick={() => setActiveTab('home')}
            className="relative transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-110 active:scale-95"
          >
            <div className={`w-16 h-16 min-[375px]:w-18 min-[375px]:h-18 min-[768px]:w-22 min-[768px]:h-22 min-[1920px]:w-26 min-[1920px]:h-26 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${activeTab === 'home' ? 'bg-brand-500 text-white shadow-brand-500/40 scale-110' : 'bg-brand-950 text-white shadow-brand-950/40 hover:shadow-brand-950/60'}`}>
              <Home className="w-7 h-7 min-[375px]:w-8 min-[375px]:h-8 min-[768px]:w-10 min-[768px]:h-10 min-[1920px]:w-12 min-[1920px]:h-12" />
            </div>
          </button>
        </div>

        {/* Second Right - Monitoring (Admin Only) */}
        {isAdmin && (
          <div className="flex flex-col items-center gap-2 relative">
            <button 
              onClick={() => setActiveTab('monitoring')}
              className={`flex flex-col items-center gap-1 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-110 active:scale-95 ${activeTab === 'monitoring' ? 'text-brand-600' : 'text-slate-400'}`}
            >
              <Activity className={`w-6 h-6 min-[375px]:w-7 min-[375px]:h-7 min-[768px]:w-8 min-[768px]:h-8 min-[1920px]:w-9 min-[1920px]:h-9 ${activeTab === 'monitoring' ? 'fill-current' : ''}`} />
              <span className="text-[10px] min-[375px]:text-xs min-[768px]:text-sm min-[1920px]:text-base font-medium">ניטור</span>
            </button>
          </div>
        )}

        {/* Location Tab */}
        <div className="flex flex-col items-center gap-2 relative">
          <button 
            onClick={() => setActiveTab('location')}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-110 active:scale-95 ${activeTab === 'location' ? 'text-brand-600' : 'text-slate-400'}`}
          >
            <MapPin className={`w-6 h-6 min-[375px]:w-7 min-[375px]:h-7 min-[768px]:w-8 min-[768px]:h-8 min-[1920px]:w-9 min-[1920px]:h-9 ${activeTab === 'location' ? 'fill-current' : ''}`} />
            <span className="text-[10px] min-[375px]:text-xs min-[768px]:text-sm min-[1920px]:text-base font-medium">מיקום</span>
          </button>
        </div>

        {/* Right Section - Profile */}
        <div className="flex flex-col items-center gap-2 relative">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-110 active:scale-95 ${activeTab === 'profile' ? 'text-brand-600' : 'text-slate-400'}`}
          >
            <UserCircle className={`w-6 h-6 min-[375px]:w-7 min-[375px]:h-7 min-[768px]:w-8 min-[768px]:h-8 min-[1920px]:w-9 min-[1920px]:h-9 ${activeTab === 'profile' ? 'fill-current' : ''}`} />
            <span className="text-[10px] min-[375px]:text-xs min-[768px]:text-sm min-[1920px]:text-base font-medium">פרופיל</span>
          </button>
        </div>
      </div>

      {/* Chat Modal */}
      {showChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md h-[80vh] flex flex-col">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-t-lg flex items-center justify-between">
              <h3 className="font-bold">השיחות שלי</h3>
              <button
                onClick={() => setShowChatModal(false)}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {/* Chat content would go here */}
              <div className="p-4 text-center text-slate-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p>צ'אטים יופיעו כאן</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Navigation className="w-6 h-6" />
                <div>
                  <h3 className="font-bold">מפה וניווט</h3>
                  <p className="text-sm opacity-80">מצא בקשות קרובות ותכנן מסלול</p>
                </div>
              </div>
              <button
                onClick={() => setShowLocationModal(false)}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {/* Map content would go here */}
              <div className="p-4 text-center text-slate-500 h-full flex items-center justify-center">
                <div>
                  <MapPin className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p>מפה אינטראקטיבית תופיע כאן</p>
                  <p className="text-sm mt-2">המפה תציג בקשות קרובות ותאפשר ניווט</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};