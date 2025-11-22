
import React, { useState } from 'react';
import { User, CITIES, DEFAULT_COMMUNITIES } from '../types';
import { MapPin, Shield, LogOut, ChevronLeft, Building2, Users, Plus, Navigation, Globe2, Star, Edit3, Save } from 'lucide-react';

interface ProfileProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser }) => {
  const [isCreatingCommunity, setIsCreatingCommunity] = useState(false);
  const [newCommunityName, setNewCommunityName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  // Local state for edits
  const [editName, setEditName] = useState(user.name);
  const [editPhone, setEditPhone] = useState(user.phone || '');
  const [editBio, setEditBio] = useState(user.bio || '');

  // Local state for communities list (so we can add to it dynamically)
  const [availableCommunities, setAvailableCommunities] = useState<string[]>(
    DEFAULT_COMMUNITIES[user.city] || []
  );

  const handleCityChange = (newCity: string) => {
    const communitiesForCity = DEFAULT_COMMUNITIES[newCity] || [];
    setAvailableCommunities(communitiesForCity);
    
    // Reset community when city changes, default to first available or empty
    onUpdateUser({
      ...user,
      city: newCity,
      community: communitiesForCity[0] || ''
    });
  };

  const handleCreateCommunity = () => {
    if (newCommunityName.trim()) {
      setAvailableCommunities([...availableCommunities, newCommunityName]);
      onUpdateUser({ ...user, community: newCommunityName });
      setNewCommunityName('');
      setIsCreatingCommunity(false);
    }
  };

  const toggleCollectorMode = () => {
    const newStatus = !user.isCollectorMode;
    if (newStatus) {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          () => onUpdateUser({ ...user, isCollectorMode: true }),
          () => {
            alert("נדרשת הרשאת מיקום כדי לקבל התראות על חבילות באזורך.");
            onUpdateUser({ ...user, isCollectorMode: false });
          }
        );
      }
    } else {
      onUpdateUser({ ...user, isCollectorMode: false });
    }
  };

  const toggleUniversalMode = () => {
    const newStatus = !user.isUniversalCollector;
     if (newStatus) {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          () => onUpdateUser({ ...user, isUniversalCollector: true }),
          () => alert("נדרש מיקום כדי להיות מאסף אוניברסלי")
        );
      }
    } else {
      onUpdateUser({ ...user, isUniversalCollector: false });
    }
  };

  const saveProfile = () => {
    onUpdateUser({
      ...user,
      name: editName,
      phone: editPhone,
      bio: editBio
    });
    setIsEditing(false);
  };

  const RatingStars = ({ rating }: { rating: number }) => (
    <div className="flex items-center text-yellow-400">
      {[...Array(5)].map((_, i) => (
         <Star key={i} className={`w-3 h-3 ${i < Math.floor(rating) ? 'fill-current' : 'text-slate-200'}`} />
      ))}
      <span className="text-slate-600 text-xs font-bold mr-1">{rating}</span>
    </div>
  );

  return (
    <div className="pt-20 px-4 pb-24">
      {/* Header Profile Info */}
      <div className="flex flex-col items-center mb-6 animate-in fade-in slide-in-from-top-4">
        <div className="relative">
           <img src={user.avatar} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" />
           <div className="absolute bottom-0 right-0 bg-brand-500 text-white p-1.5 rounded-full border-2 border-white">
             <Shield className="w-4 h-4" />
           </div>
        </div>
        
        {isEditing ? (
           <div className="mt-4 w-full max-w-xs space-y-2">
              <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full text-center border rounded p-1" placeholder="שם מלא" />
              <input type="text" value={editPhone} onChange={e => setEditPhone(e.target.value)} className="w-full text-center border rounded p-1 text-sm" placeholder="מספר טלפון" />
              <textarea value={editBio} onChange={e => setEditBio(e.target.value)} className="w-full text-center border rounded p-1 text-sm h-16" placeholder="קצת על עצמי..." />
              <button onClick={saveProfile} className="w-full bg-brand-950 text-white rounded-lg py-1 flex justify-center items-center gap-1 text-sm hover:bg-brand-900">
                <Save className="w-4 h-4" /> שמור שינויים
              </button>
           </div>
        ) : (
           <>
            <h2 className="text-2xl font-bold mt-4 text-brand-950 flex items-center gap-2">
              {user.name}
              <button onClick={() => setIsEditing(true)} className="text-slate-400 hover:text-brand-500">
                <Edit3 className="w-4 h-4" />
              </button>
            </h2>
            {user.bio && <p className="text-slate-500 text-sm mt-1 text-center max-w-xs">{user.bio}</p>}
           </>
        )}
        
        <p className="text-slate-400 text-sm mt-1">{user.city} • {user.community}</p>

        {/* Dual Ratings */}
        <div className="flex gap-4 mt-4 w-full max-w-sm justify-center">
            <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex-1 flex flex-col items-center">
               <span className="text-xs text-slate-400 mb-1">דירוג כמאסף</span>
               <RatingStars rating={user.collectorRating || user.rating} />
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex-1 flex flex-col items-center">
               <span className="text-xs text-slate-400 mb-1">דירוג כמבקש</span>
               <RatingStars rating={user.requesterRating || user.rating} />
            </div>
        </div>
      </div>

      {/* Community Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
        <div className="p-4 border-b border-slate-50 bg-slate-50/50">
          <h3 className="font-bold text-brand-900 text-sm">הגדרות איזור מגורים</h3>
        </div>
        
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
             <div className="bg-brand-50 p-2 rounded-full text-brand-600 shrink-0">
               <Building2 className="w-5 h-5" />
             </div>
             <div className="flex-1">
               <label className="block text-xs font-medium text-slate-500 mb-1">עיר מגורים</label>
               <select 
                 value={user.city} 
                 onChange={(e) => handleCityChange(e.target.value)}
                 className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm"
               >
                 {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
               </select>
             </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="bg-brand-50 p-2 rounded-full text-brand-600 shrink-0">
               <Users className="w-5 h-5" />
             </div>
             <div className="flex-1">
               <label className="block text-xs font-medium text-slate-500 mb-1">קהילה/שכונה</label>
               
               {!isCreatingCommunity ? (
                 <div className="flex gap-2">
                   <select 
                     value={user.community} 
                     onChange={(e) => onUpdateUser({ ...user, community: e.target.value })}
                     className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm"
                   >
                     {availableCommunities.map((c) => <option key={c} value={c}>{c}</option>)}
                   </select>
                   <button onClick={() => setIsCreatingCommunity(true)} className="bg-brand-950 text-white p-2.5 rounded-lg">
                     <Plus className="w-5 h-5" />
                   </button>
                 </div>
               ) : (
                 <div className="flex gap-2 animate-in fade-in">
                    <input 
                      type="text" 
                      value={newCommunityName}
                      onChange={(e) => setNewCommunityName(e.target.value)}
                      placeholder="שם..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm"
                    />
                    <button onClick={handleCreateCommunity} className="bg-brand-500 text-white px-4 rounded-lg text-sm font-bold">צור</button>
                    <button onClick={() => setIsCreatingCommunity(false)} className="text-slate-400 px-2"><XIcon /></button>
                 </div>
               )}
             </div>
          </div>
        </div>
      </div>

      {/* Collector Modes */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
        <div className="p-4 border-b border-slate-50 bg-slate-50/50">
          <h3 className="font-bold text-brand-900 text-sm">הגדרות מאסף</h3>
        </div>

        <div className="p-4 flex items-center justify-between border-b border-slate-50">
           <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full transition-colors ${user.isCollectorMode ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                <Navigation className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">מצב מאסף מקומי</h4>
                <p className="text-xs text-slate-500">קבל התראות בקהילה שלך</p>
              </div>
           </div>
           
           <button onClick={toggleCollectorMode} className={`w-12 h-7 rounded-full transition-colors relative ${user.isCollectorMode ? 'bg-brand-500' : 'bg-slate-200'}`}>
             <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${user.isCollectorMode ? 'left-1' : 'right-1'}`}></div>
           </button>
        </div>

        <div className="p-4 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full transition-colors ${user.isUniversalCollector ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-400'}`}>
                <Globe2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">מאסף אוניברסלי</h4>
                <p className="text-xs text-slate-500">זיהוי מכל מיקום (GPS)</p>
              </div>
           </div>
           
           <button onClick={toggleUniversalMode} className={`w-12 h-7 rounded-full transition-colors relative ${user.isUniversalCollector ? 'bg-purple-500' : 'bg-slate-200'}`}>
             <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${user.isUniversalCollector ? 'left-1' : 'right-1'}`}></div>
           </button>
        </div>
      </div>
    </div>
  );
};

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);
