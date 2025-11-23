import React from 'react';
import { PackageRequest, RequestStatus } from '../types';
import { MapPin, Clock, Package, ShieldCheck, Sparkles, MessageCircle, Check } from 'lucide-react';

interface RequestCardProps {
  request: PackageRequest;
  onChatClick: () => void;
  onCollectClick?: () => void;
  isOwner?: boolean; 
}

export const RequestCard: React.FC<RequestCardProps> = ({ request, onChatClick, onCollectClick, isOwner }) => {
  
  const getStatusProgress = () => {
    switch(request.status) {
      case RequestStatus.PENDING: return '33%';
      case RequestStatus.ACCEPTED: return '66%';
      case RequestStatus.COMPLETED: return '100%';
      default: return '0%';
    }
  };

  const isCompleted = request.status === RequestStatus.COMPLETED;

  return (
    <div className={`bg-white rounded-2xl p-4 mb-4 shadow-sm border border-slate-100 transition-all relative overflow-hidden ${isCompleted ? 'opacity-80 grayscale-[0.5]' : ''}`}>
      
      {/* AI Verified Badge */}
      {request.isAiVerified && !isCompleted && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-300 via-brand-500 to-brand-300"></div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-3 pt-2">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src={request.requester.avatar} 
              alt={request.requester.name} 
              className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
            />
            {request.isAiVerified && (
              <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-0.5 rounded-full border-2 border-white" title="AI Verified User">
                <Sparkles className="w-3 h-3" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1">
               <h3 className="font-semibold text-brand-950">{request.requester.name}</h3>
               {request.isAiVerified && <ShieldCheck className="w-3 h-3 text-brand-500" />}
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <span className="text-yellow-500">★</span> {request.requester.requesterRating || request.requester.rating}
            </div>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-bold shadow-sm ${isCompleted ? 'bg-slate-100 text-slate-500' : 'bg-brand-50 text-brand-700'}`}>
          ₪{request.reward}
        </div>
      </div>

      {/* Info Body */}
      <div className="space-y-2 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
        <div className="flex items-center gap-2 text-slate-600 text-sm">
          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="font-medium text-brand-950">{request.location}</span>
        </div>
        
        <div className="flex items-center gap-2 text-slate-600 text-sm">
          <Package className="w-4 h-4 text-slate-400 shrink-0" />
          {isOwner || !request.isHidden || isCompleted ? (
             <span className="font-mono text-brand-950">{request.trackingNumber || 'מספר מעקב לא זמין'}</span>
          ) : (
             <span className="text-slate-500 italic flex items-center gap-1">
               <ShieldCheck className="w-3 h-3" />
               פרטים חסויים
             </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-slate-600 text-sm">
          <Clock className="w-4 h-4 text-slate-400 shrink-0" />
          <span>{request.deadline}</span>
        </div>
      </div>

      {/* Status Bar / Meter */}
      <div className="mb-4">
        <div className="flex justify-between text-[10px] text-slate-400 mb-1 px-1">
          <span>ממתין</span>
          <span>בטיפול</span>
          <span>נמסר</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden relative">
           <div 
             className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-green-500' : 'bg-brand-500'}`}
             style={{ width: getStatusProgress() }}
           ></div>
        </div>
        {isCompleted && (
          <div className="text-center text-xs text-green-600 font-bold mt-1 flex items-center justify-center gap-1">
            <Check className="w-3 h-3" /> נמסר בהצלחה
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {!isCompleted && (
           <button 
             onClick={isOwner ? undefined : onCollectClick}
             className="flex-1 bg-brand-950 text-white py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-brand-800 transition-colors shadow-lg shadow-brand-900/10 active:scale-95"
           >
            {isOwner ? 'נהל' : `אני אאסוף`}
           </button>
        )}
        
        <button 
          onClick={onChatClick}
          className={`px-4 py-2.5 rounded-xl flex items-center justify-center border transition-colors ${isCompleted ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
          disabled={isCompleted}
        >
           <MessageCircle className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};