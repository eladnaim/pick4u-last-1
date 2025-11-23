import React, { useState, useEffect, useRef } from 'react';
import { X, Send, User as UserIcon, Handshake, ShieldCheck, Check, Star, Package, Lock, Play, CreditCard, Eye, Bike } from 'lucide-react';
import { PackageRequest, User } from '../types';

interface ChatModalProps {
  currentUser: User;
  request: PackageRequest;
  onClose: () => void;
}

interface Message {
  id: string;
  senderId: string;
  text?: string;
  type: 'text' | 'info_card' | 'deal_proposal' | 'deal_success' | 'sensitive_details';
  timestamp: number;
  data?: any;
}

export const ChatModal: React.FC<ChatModalProps> = ({ currentUser, request, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 'init_info', 
      senderId: 'system', 
      type: 'info_card', 
      timestamp: Date.now() 
    }
  ]);
  
  const [inputText, setInputText] = useState('');
  const [dealStatus, setDealStatus] = useState<'none' | 'proposed' | 'accepted' | 'completed'>('none');
  const [showAd, setShowAd] = useState(false);
  const [adTimer, setAdTimer] = useState(5);
  const [showAnimation, setShowAnimation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const recipientName = request.requester.name;
  const isFreeDeal = request.reward === 0;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  // Ad Timer Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showAd && adTimer > 0) {
      interval = setInterval(() => {
        setAdTimer((prev) => prev - 1);
      }, 1000);
    } else if (showAd && adTimer === 0) {
      finishAdFlow();
    }
    return () => clearInterval(interval);
  }, [showAd, adTimer]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      text: inputText,
      type: 'text',
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');

    // Simulate reply
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        senderId: 'other',
        text: 'נשמע מעולה, אני זמין.',
        type: 'text',
        timestamp: Date.now()
      }]);
    }, 1500);
  };

  const handleProposeDeal = () => {
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      type: 'deal_proposal',
      timestamp: Date.now(),
      data: { price: request.reward }
    };
    setMessages(prev => [...prev, newMessage]);
    setDealStatus('proposed');

    setTimeout(() => {
      const successMsg: Message = {
         id: 'success_' + Date.now(),
         senderId: 'other',
         type: 'deal_success',
         timestamp: Date.now()
      };
      setMessages(prev => [...prev, successMsg]);
      setDealStatus('accepted');
    }, 3000);
  };

  const handleRevealDetails = () => {
    if (isFreeDeal || request.reward < 5) {
        setShowAd(true);
    } else {
        revealDetailsMsg();
    }
  };

  const finishAdFlow = () => {
      setShowAd(false);
      revealDetailsMsg();
  };

  const revealDetailsMsg = () => {
      // Trigger Animation
      setShowAnimation(true);
      setTimeout(() => setShowAnimation(false), 4000);

      const detailsMsg: Message = {
          id: 'details_' + Date.now(),
          senderId: 'other',
          type: 'sensitive_details',
          timestamp: Date.now()
      };
      setMessages(prev => [...prev, detailsMsg]);
      setDealStatus('completed');
  };

  return (
    <div className="fixed inset-0 z-50 bg-brand-950/60 flex flex-col justify-end sm:justify-center backdrop-blur-sm">
       
       {/* Scooter Animation Overlay */}
       {showAnimation && (
         <div className="absolute inset-0 z-[70] flex items-center justify-center pointer-events-none overflow-hidden">
            <div className="w-full absolute top-1/2 -translate-y-1/2 animate-drive flex flex-col items-center">
              <div className="bg-white p-3 rounded-full shadow-xl border-2 border-brand-500 mb-2">
                 <Bike className="w-12 h-12 text-brand-500" />
              </div>
              <span className="bg-brand-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                 בדרך ליעד!
              </span>
            </div>
         </div>
       )}

       {/* Ad Overlay */}
       {showAd && (
           <div className="absolute inset-0 z-[60] bg-brand-950 flex flex-col items-center justify-center text-white p-6 animate-in fade-in">
               <div className="bg-white/10 p-4 rounded-2xl mb-6 backdrop-blur-md border border-white/10">
                   <Play className="w-12 h-12 text-brand-400 mx-auto mb-2" />
                   <p className="text-sm font-medium">פרסומת קצרה לתמיכה בקהילה</p>
               </div>
               <h2 className="text-2xl font-bold mb-2">חושפים את פרטי החבילה...</h2>
               <p className="text-slate-300 mb-8 text-center max-w-xs">הפרטים המלאים של {request.requester.name} יופיעו מיד בסיום.</p>
               
               <div className="w-full max-w-xs bg-brand-900 h-2 rounded-full overflow-hidden mb-4">
                   <div className="h-full bg-brand-500 transition-all duration-1000 ease-linear" style={{ width: `${((5 - adTimer) / 5) * 100}%` }}></div>
               </div>
               <span className="font-mono text-2xl font-bold">{adTimer}</span>
           </div>
       )}

       <div className="bg-white w-full sm:max-w-md sm:mx-auto h-[90vh] sm:h-[600px] rounded-t-3xl sm:rounded-2xl flex flex-col shadow-2xl animate-in slide-in-from-bottom-10 duration-300 overflow-hidden relative">
         
         {/* Header */}
         <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-md z-10 absolute top-0 left-0 right-0">
           <div className="flex items-center gap-3">
             <div className="relative">
                <img src={request.requester.avatar} className="w-10 h-10 rounded-full border border-slate-200" alt="" />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
             </div>
             <div>
               <h3 className="font-bold text-brand-950">{recipientName}</h3>
               <div className="flex items-center gap-1 text-xs text-slate-500">
                 <Star className="w-3 h-3 text-yellow-400 fill-current" />
                 <span>{request.requester.requesterRating || 5.0} • {request.distance}</span>
               </div>
             </div>
           </div>
           <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors">
             <X className="w-5 h-5 text-slate-500" />
           </button>
         </div>

         {/* Messages Area */}
         <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 pt-24 pb-20">
           
           {messages.map(msg => {
             
             /* TYPE 1: INFO CARD */
             if (msg.type === 'info_card') {
               return (
                 <div key={msg.id} className="mx-auto max-w-[95%] bg-white border border-slate-200 rounded-2xl p-4 shadow-sm mb-6 text-center animate-in zoom-in-95 duration-500">
                    <div className="flex justify-center gap-2 mb-2">
                        <span className="bg-brand-50 text-brand-700 text-xs px-2 py-1 rounded-full font-bold">איסוף בטוח</span>
                        {isFreeDeal && <span className="bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded-full font-bold">עסקה ללא עלות ❤️</span>}
                    </div>
                    <h4 className="font-bold text-brand-950 text-sm mb-1">סיכום פרטים ראשוני</h4>
                    <div className="flex justify-center items-center gap-6 mt-3 text-xs">
                       <div className="flex flex-col items-center gap-1">
                          <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center"><Package className="w-4 h-4 text-slate-600"/></div>
                          <span className="text-slate-500">{request.type}</span>
                       </div>
                       <div className="w-px h-8 bg-slate-100"></div>
                       <div className="flex flex-col items-center gap-1">
                          <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center"><CreditCard className="w-4 h-4 text-slate-600"/></div>
                          <span className="font-bold text-brand-950">₪{request.reward}</span>
                       </div>
                    </div>
                 </div>
               );
             }

             const isMe = msg.senderId === currentUser.id;

             /* TYPE 2: DEAL PROPOSAL */
             if (msg.type === 'deal_proposal') {
               return (
                 <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`bg-brand-500 text-white p-4 rounded-2xl max-w-[85%] shadow-lg ${isMe ? 'rounded-tl-none' : 'rounded-tr-none'}`}>
                       <div className="flex items-center gap-2 mb-2 border-b border-brand-400 pb-2">
                          <Handshake className="w-5 h-5 text-white" />
                          <span className="font-bold text-sm">הצעת איסוף</span>
                       </div>
                       <div className="flex justify-between items-center">
                          <span className="text-sm text-brand-100">{isMe ? 'שלחתי הצעה:' : 'התקבלה הצעה:'}</span>
                          <span className="font-bold text-xl text-white">₪{msg.data?.price}</span>
                       </div>
                    </div>
                 </div>
               );
             }

             /* TYPE 3: DEAL SUCCESS */
             if (msg.type === 'deal_success') {
               return (
                 <div key={msg.id} className="mx-auto w-full max-w-[95%] py-4 animate-in zoom-in duration-700">
                    <div className="bg-gradient-to-br from-brand-500 to-brand-700 text-white p-6 rounded-3xl shadow-xl text-center relative overflow-hidden">
                       <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                       
                       <div className="w-14 h-14 bg-white text-brand-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg animate-bounce">
                          <Check className="w-8 h-8 stroke-[4]" />
                       </div>
                       <h2 className="text-2xl font-black mb-1">יש לנו דיל!</h2>
                       <p className="text-brand-100 text-sm mb-4">העסקה אושרה על ידי שני הצדדים.</p>
                       
                       {dealStatus === 'accepted' && (
                           <button 
                             onClick={handleRevealDetails}
                             className="w-full bg-white text-brand-700 py-3 rounded-xl font-bold shadow-lg hover:bg-brand-50 transition-colors flex items-center justify-center gap-2 animate-pulse"
                           >
                               {isFreeDeal ? <Play className="w-4 h-4 fill-current" /> : <Eye className="w-4 h-4" />}
                               {isFreeDeal ? 'צפה בפרסומת לקבלת פרטים' : 'לחץ לחשיפת פרטי החבילה'}
                           </button>
                       )}
                    </div>
                 </div>
               );
             }

             /* TYPE 4: SENSITIVE DETAILS */
             if (msg.type === 'sensitive_details') {
                 return (
                     <div key={msg.id} className="mx-auto max-w-[95%] animate-in slide-in-from-bottom-4 duration-700">
                         <div className="bg-white border-2 border-green-500 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                             <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] px-3 py-1 rounded-bl-lg font-bold flex items-center gap-1">
                                 <Lock className="w-3 h-3" />
                                 מאובטח ומוצפן
                             </div>
                             
                             <h3 className="font-bold text-brand-950 mb-4 flex items-center gap-2">
                                 <Package className="w-5 h-5 text-green-500" />
                                 פרטי איסוף מלאים
                             </h3>

                             <div className="space-y-3">
                                 <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                     <span className="text-xs text-slate-400 block mb-1">מספר מעקב</span>
                                     <span className="font-mono text-lg font-bold text-brand-950 tracking-wider select-all">
                                         {request.trackingNumber || 'RR123456789IL'}
                                     </span>
                                 </div>
                                 
                                 <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                     <span className="text-xs text-slate-400 block mb-1">מיקום מדויק</span>
                                     <span className="font-medium text-brand-950">
                                         {request.location}
                                     </span>
                                 </div>

                                 <div className="flex gap-2 mt-2">
                                     <button className="flex-1 bg-brand-500 text-white py-2 rounded-lg text-xs font-bold">נווט למקום</button>
                                     <button className="flex-1 bg-white border border-slate-200 text-slate-700 py-2 rounded-lg text-xs font-bold">העתק פרטים</button>
                                 </div>
                             </div>
                         </div>
                     </div>
                 );
             }

             /* TYPE 5: STANDARD TEXT */
             const isSystem = msg.senderId === 'system';
             if (isSystem) return <div key={msg.id} className="text-center text-xs text-slate-400 my-2">{msg.text}</div>;

             return (
               <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                 <div 
                   dir="auto" 
                   className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                   isMe 
                   ? 'bg-brand-500 text-white rounded-tl-none' 
                   : 'bg-white text-slate-800 border border-slate-200 rounded-tr-none'
                 }`}>
                   {msg.text}
                 </div>
               </div>
             );
           })}
           <div ref={messagesEndRef} />
         </div>

         {/* Input Area */}
         {dealStatus !== 'completed' && (
           <div className="p-3 border-t border-slate-100 bg-white pb-8 sm:pb-3 absolute bottom-0 left-0 right-0">
             
             {dealStatus === 'none' && messages.length > 1 && (
                <div className="absolute -top-12 left-0 right-0 flex justify-center pointer-events-none">
                   <button 
                      onClick={handleProposeDeal}
                      className="pointer-events-auto bg-brand-950 text-white px-5 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-xl hover:scale-105 transition-transform animate-in slide-in-from-bottom-2"
                   >
                      <Handshake className="w-4 h-4 text-brand-400" />
                      סגור דיל (₪{request.reward})
                   </button>
                </div>
             )}

             <div className="flex items-center gap-2">
               <input 
                 type="text" 
                 dir="auto"
                 value={inputText}
                 onChange={e => setInputText(e.target.value)}
                 placeholder="כתוב הודעה..."
                 className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                 onKeyDown={e => e.key === 'Enter' && handleSend()}
               />
               <button 
                 onClick={handleSend}
                 disabled={!inputText.trim()}
                 className="bg-brand-500 text-white p-3 rounded-full hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-md"
               >
                 <Send className="w-5 h-5" />
               </button>
             </div>
           </div>
         )}
       </div>
    </div>
  );
};