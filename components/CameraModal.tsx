
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { X, Camera, Image as ImageIcon, Type, Upload, FileText, ScanLine, AlertCircle } from 'lucide-react';
import { analyzePackageImage, analyzePackageText } from '../services/geminiService';
import { ScanResult } from '../types';

interface CameraModalProps {
  onClose: () => void;
  onScanSuccess: (data: ScanResult) => void;
}

type Tab = 'camera' | 'upload' | 'manual';

export const CameraModal: React.FC<CameraModalProps> = ({ onClose, onScanSuccess }) => {
  const [activeTab, setActiveTab] = useState<Tab>('camera');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Manual Form State
  const [manualText, setManualText] = useState('');
  const [manualLocation, setManualLocation] = useState('');
  const [manualTracking, setManualTracking] = useState('');

  // --- Camera Logic ---
  const startCamera = useCallback(async () => {
    if (activeTab !== 'camera') return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("נא לאשר גישה למצלמה.");
    }
  }, [activeTab]);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setIsStreaming(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'camera') startCamera();
    else stopCamera();
    return () => stopCamera();
  }, [activeTab, startCamera, stopCamera]);

  // --- Handlers ---

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsAnalyzing(true);
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const base64 = canvas.toDataURL('image/jpeg', 0.7);
      processAnalysis(analyzePackageImage(base64));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsAnalyzing(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      processAnalysis(analyzePackageImage(base64));
    };
    reader.readAsDataURL(file);
  };

  const handleManualAnalysis = () => {
    // If text is pasted, try AI analysis
    if (manualText.trim().length > 10 && !manualLocation) {
      setIsAnalyzing(true);
      processAnalysis(analyzePackageText(manualText));
    } else if (manualLocation) {
      // Direct Manual Entry without AI
      onScanSuccess({
        location: manualLocation,
        trackingNumber: manualTracking || 'HIDDEN-MANUAL',
        recipientName: null,
        deadline: null
      });
      onClose();
    }
  };

  const processAnalysis = async (promise: Promise<ScanResult>) => {
    setError(null);
    try {
      const result = await promise;
      onScanSuccess(result);
      onClose();
    } catch (err) {
      setError("לא הצלחנו לפענח. נסו שוב או הזינו ידנית.");
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-brand-950 flex flex-col" dir="rtl">
      
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-brand-900/80 backdrop-blur-md z-20 border-b border-white/10">
        <button onClick={onClose} className="bg-white/10 p-2 rounded-full text-white hover:bg-white/20 transition-colors">
          <X className="w-6 h-6" />
        </button>
        <span className="text-white font-bold text-lg">יצירת בקשה חדשה</span>
        <div className="w-10" />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative flex flex-col items-center justify-center overflow-hidden bg-slate-900">
        
        {/* TAB: CAMERA */}
        {activeTab === 'camera' && (
          <div className="relative w-full h-full flex items-center justify-center bg-black">
             {!isStreaming && !error && <Loader />}
             {error && <ErrorMsg msg={error} />}
             <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-cover ${isAnalyzing ? 'opacity-50' : ''}`} />
             <canvas ref={canvasRef} className="hidden" />
             
             {/* Smart Scan Overlay */}
             <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                <div className="w-64 h-40 border-2 border-brand-400/50 rounded-2xl relative">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-brand-400 -mt-1 -ml-1 rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-brand-400 -mt-1 -mr-1 rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-brand-400 -mb-1 -ml-1 rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-brand-400 -mb-1 -mr-1 rounded-br-lg"></div>
                    
                    {/* Scanning Line */}
                    <div className="w-full h-0.5 bg-brand-400 shadow-[0_0_15px_rgba(0,122,255,0.8)] animate-float absolute top-1/2"></div>
                </div>
                <p className="text-white/80 mt-4 text-sm bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">כוון את המצלמה לפתק או למסך</p>
             </div>
          </div>
        )}

        {/* TAB: UPLOAD */}
        {activeTab === 'upload' && (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-white bg-brand-900">
             <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
             <div onClick={() => fileInputRef.current?.click()} className="w-full max-w-xs aspect-square border-2 border-dashed border-brand-500 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:bg-brand-800/50 transition-colors bg-white/5">
                <Upload className="w-16 h-16 text-brand-400 mb-4" />
                <span className="font-bold text-xl">לחץ להעלאת תמונה</span>
                <span className="text-brand-200 text-sm mt-2 text-center px-4">צילום מסך של SMS או תמונה מהגלריה</span>
             </div>
          </div>
        )}

        {/* TAB: MANUAL */}
        {activeTab === 'manual' && (
          <div className="w-full h-full p-6 overflow-y-auto bg-slate-50 rounded-t-3xl mt-4 animate-in slide-in-from-bottom-10">
             <div className="flex items-center gap-2 mb-6">
               <div className="bg-brand-100 p-2 rounded-full text-brand-600"><FileText className="w-6 h-6" /></div>
               <h3 className="text-brand-950 font-bold text-xl">פרטי איסוף</h3>
             </div>
             
             <div className="space-y-6">
                {/* Option A: Paste Text */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                   <label className="block text-xs font-bold text-brand-900 mb-3 flex items-center gap-2">
                     <ScanLine className="w-4 h-4 text-brand-500" />
                     הדבק הודעת SMS (מומלץ - ה-AI יחלץ הכל)
                   </label>
                   <textarea 
                     value={manualText}
                     onChange={e => setManualText(e.target.value)}
                     className="w-full bg-slate-50 p-4 rounded-xl text-sm min-h-[100px] border border-slate-200 focus:ring-2 focus:ring-brand-500 outline-none transition-all resize-none"
                     placeholder="הדבק כאן את ההודעה שקיבלת מהדואר..."
                   />
                </div>

                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-medium">או הזן ידנית</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                {/* Option B: Manual Fields */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                   <div>
                      <label className="block text-sm font-bold text-slate-800 mb-2">מיקום איסוף (ציבורי)</label>
                      <input 
                        type="text" 
                        value={manualLocation}
                        onChange={e => setManualLocation(e.target.value)}
                        className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                        placeholder="לדוגמה: דואר מרכז מיתר"
                      />
                      <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        זה המידע היחיד שיוצג למאספים בשלב ראשון.
                      </p>
                   </div>
                   <div>
                      <label className="block text-sm font-bold text-red-600 mb-2 flex items-center gap-1">
                         פרטים חסויים (מספר מעקב / קוד)
                      </label>
                      <input 
                        type="text" 
                        value={manualTracking}
                        onChange={e => setManualTracking(e.target.value)}
                        className="w-full p-3.5 rounded-xl border border-red-100 bg-red-50 text-sm focus:ring-2 focus:ring-red-500 outline-none transition-all"
                        placeholder="לדוגמה: RR123456789IL"
                      />
                      <p className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3 h-3" />
                        מידע זה מוצפן ויועבר למאסף רק לאחר אישור העסקה בצ'אט.
                      </p>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* Loading Overlay */}
        {isAnalyzing && (
          <div className="absolute inset-0 bg-brand-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
             <div className="animate-spin rounded-full h-14 w-14 border-4 border-brand-400 border-t-transparent mb-6"></div>
             <span className="text-white font-bold text-xl animate-pulse">ה-AI מפענח את הפרטים...</span>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="bg-white p-4 pb-8 rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.1)] z-30 relative">
         
         {/* Action Button Area */}
         <div className="h-20 flex items-center justify-center mb-2">
            {activeTab === 'manual' ? (
                <button 
                onClick={handleManualAnalysis}
                disabled={(!manualText && (!manualLocation || !manualTracking))}
                className="w-full bg-brand-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-brand-500/30 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-700 transition-all active:scale-[0.98]"
                >
                {manualText ? 'נתח ופרסם' : 'פרסם בקשה'}
                </button>
            ) : (
                <button 
                    onClick={activeTab === 'camera' ? handleCapture : () => {}} 
                    disabled={!isStreaming && activeTab === 'camera'}
                    className="w-20 h-20 rounded-full border-4 border-brand-100 bg-white flex items-center justify-center shadow-xl active:scale-95 transition-transform"
                >
                    <div className="w-16 h-16 bg-brand-500 rounded-full flex items-center justify-center">
                        {activeTab === 'camera' && <div className="w-14 h-14 rounded-full border-2 border-white/30"></div>}
                        {activeTab === 'upload' && <Upload className="w-8 h-8 text-white" />}
                    </div>
                </button>
            )}
         </div>

         {/* Tabs */}
         <div className="flex justify-center gap-2 mt-2 bg-slate-100 p-1 rounded-full w-max mx-auto">
            <TabButton icon={<Camera />} label="סריקה" isActive={activeTab === 'camera'} onClick={() => setActiveTab('camera')} />
            <TabButton icon={<ImageIcon />} label="גלריה" isActive={activeTab === 'upload'} onClick={() => setActiveTab('upload')} />
            <TabButton icon={<Type />} label="ידני" isActive={activeTab === 'manual'} onClick={() => setActiveTab('manual')} />
         </div>
      </div>
    </div>
  );
};

const TabButton = ({ icon, label, isActive, onClick }: { icon: any, label: string, isActive: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all ${isActive ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
  >
    {React.cloneElement(icon, { className: "w-4 h-4" })}
    {label}
  </button>
);

const Loader = () => <div className="text-white animate-pulse font-medium">מאתחל מצלמה...</div>;
const ErrorMsg = ({ msg }: { msg: string }) => <div className="absolute top-1/2 left-0 right-0 text-center text-red-400 font-bold bg-black/70 p-4 backdrop-blur-sm">{msg}</div>;
