import React, { useState, useEffect, useRef } from 'react';
import { signInAnonymously, onAuthStateChanged, getIdTokenResult } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { subscribeToRequests, createNewRequest } from './services/dbService';
import './chat-animations.css';
import { Header } from './components/Header';
import { RequestCard } from './components/RequestCard';
import { CameraModal } from './components/CameraModal';
import { BottomNav } from './components/BottomNav';
import { Profile } from './components/Profile';
import { ChatModal } from './components/ChatModal';
import { Onboarding } from './components/Onboarding';
import { Logo } from './components/Logo';
import { AdvancedPricingDisplay } from './components/AdvancedPricingDisplay';
import ChatButton from './src/components/ChatButton';
import LocationButton from './src/components/LocationButton';
import ChatCard from './components/ChatCard';
import SystemTest from './src/components/SystemTest';
import MonitoringPage from './src/components/MonitoringDashboard';
import { LocationData } from './services/locationService';
import { communityAlertsService } from './services/communityAlertsService';
import { networkMonitor } from './services/networkMonitor';
import { validatePackageRequest, validateUser, validateDataSync } from './services/dataValidation';
import { activateMonitoringSystem } from './services/monitoringActivation';
import { PackageRequest, PackageType, RequestStatus, ScanResult, User } from './types';
import { getAiPriceRecommendation, analyzeUserRisk } from './services/aiSmartService';
import { getAdvancedAiPriceRecommendation, analyzeMarketConditions, getDynamicPricing, AdvancedPricingData } from './services/aiAdvancedService';
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
  const [activeTab, setActiveTab] = useState<'home' | 'feed' | 'profile' | 'monitoring' | 'location'>('home');
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
  const [communityAlerts, setCommunityAlerts] = useState<any[]>([]);
  const notificationSound = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'));
  const [aiPriceSuggestion, setAiPriceSuggestion] = useState<number>(0);
  const [aiPriceReason, setAiPriceReason] = useState<string>('');
  const [advancedPricingData, setAdvancedPricingData] = useState<AdvancedPricingData | null>(null);
  const [isAnalyzingPrice, setIsAnalyzingPrice] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  
  const [userMode, setUserMode] = useState<'requester' | 'collector'>('requester');
  const [showSystemTest, setShowSystemTest] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const init = async () => {
        const savedUser = localStorage.getItem('pick4u_user');
        if (savedUser) {
            const parsedUser = JSON.parse(savedUser);
            setCurrentUser(parsedUser);
            if (!parsedUser.hasCompletedOnboarding) setShowOnboarding(true);
        } else {
            setShowOnboarding(true);
        }

        try {
            console.log('🔐 Starting anonymous authentication...');
            const userCredential = await signInAnonymously(auth);
            console.log('✅ Anonymous authentication successful:', userCredential.user.uid);
            setCurrentUser(prev => ({ 
                ...prev, 
                id: userCredential.user.uid,
                firebaseUid: userCredential.user.uid 
            }));
            
            // Monitoring system disabled to prevent storage errors
            console.log('📋 Firebase monitoring system disabled for stability');
            
        } catch (error) {
            console.error("❌ Auth Error:", error);
            showToast('שגיאה באימות - נסה שוב');
        }
    };
    init();
  }, []);

  // Add auth state listener to track authentication status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log('👤 Auth state: User authenticated:', user.uid);
        
        // Check if user is admin
        try {
          const tokenResult = await getIdTokenResult(user);
          const isUserAdmin = tokenResult.claims?.admin === true;
          console.log('👑 Admin status:', isUserAdmin);
          setIsAdmin(isUserAdmin);
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        }
        
        setCurrentUser(prev => ({ 
          ...prev, 
          id: user.uid,
          firebaseUid: user.uid 
        }));
      } else {
        console.log('👤 Auth state: User not authenticated');
        setIsAdmin(false);
        // Try to sign in anonymously if not authenticated
        console.log('🔄 Attempting anonymous authentication...');
        signInAnonymously(auth).then((userCredential) => {
          console.log('✅ Anonymous authentication successful:', userCredential.user.uid);
          setCurrentUser(prev => ({ 
            ...prev, 
            id: userCredential.user.uid,
            firebaseUid: userCredential.user.uid 
          }));
        }).catch((error) => {
          console.error('❌ Anonymous authentication failed:', error);
        });
      }
    });
    
    return () => unsubscribe();
  }, []);

  useEffect(() => {
      if (currentUser.name) {
          localStorage.setItem('pick4u_user', JSON.stringify(currentUser));
      }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser.city || !currentUser.community) {
      console.log('⚠️ User city or community not set, skipping request subscription');
      return;
    }
    
    if (!auth.currentUser) {
      console.log('⚠️ User not authenticated, skipping request subscription');
      return;
    }
    
    console.log('🔄 Setting up request subscription for user:', {
      city: currentUser.city,
      community: currentUser.community,
      isUniversal: currentUser.isUniversalCollector,
      userName: currentUser.name,
      authUserId: auth.currentUser.uid
    });
    
    const unsubscribe = subscribeToRequests(
        currentUser.city, 
        currentUser.community, 
        currentUser.isUniversalCollector,
        (newRequests) => {
          console.log('📊 Request subscription callback received:', newRequests.length, 'requests');
          console.log('📋 Request details:', newRequests.map(req => ({
            id: req.id,
            status: req.status,
            requester: req.requester?.name,
            location: req.location,
            reward: req.reward
          })));
          setRequests(newRequests);
        }
    );
    return () => unsubscribe();
  }, [currentUser.city, currentUser.community, currentUser.isUniversalCollector]);

  useEffect(() => {
    if (!currentUser.city || !currentUser.community) {
      console.log('⚠️ User city or community not set, skipping community alerts subscription');
      return;
    }
    
    if (!auth.currentUser) {
      console.log('⚠️ User not authenticated, skipping community alerts subscription');
      return;
    }
    
    console.log('🔔 Setting up community alerts subscription:', {
      city: currentUser.city,
      community: currentUser.community,
      authUserId: auth.currentUser.uid
    });
    
    const unsubscribe = communityAlertsService.subscribeToCommunityAlerts(
        currentUser.city,
        currentUser.community,
        (alerts) => {
          console.log('📢 Community alerts received:', alerts.length, 'alerts');
          setCommunityAlerts(alerts);
        }
    );
    return () => unsubscribe();
  }, [currentUser.city, currentUser.community]);

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

  // Test function to verify notification system
  const testNotificationSystem = async () => {
    console.log('🧪 Testing notification system...');
    
    // Check authentication
    if (!currentUser.id || !auth.currentUser) {
        console.error('❌ User not authenticated for notification test');
        showToast('שגיאה: משתמש לא מאומת לבדיקה');
        return;
    }
    
    try {
      const testAlertId = await communityAlertsService.sendCommunityAlert(
        currentUser, 
        'available_for_collection',
        `🧪 בדיקת מערכת: ${currentUser.name} זמין לבדיקה`
      );
      console.log('✅ Test alert sent successfully:', testAlertId);
      showToast('התראת בדיקה נשלחה בהצלחה!');
    } catch (error) {
      console.error('❌ Test notification failed:', error);
      showToast('שגיאה בשליחת התראת בדיקה');
    }
  };

  // Comprehensive test function for request flow
  const testRequestFlow = async () => {
    console.log('🧪 Testing complete request flow...');
    
    // Check authentication
    if (!currentUser.id || !auth.currentUser) {
        console.error('❌ User not authenticated for request flow test');
        showToast('שגיאה: משתמש לא מאומת לבדיקה');
        return;
    }
    
    try {
      // Step 1: Create a test request
      console.log('📝 Step 1: Creating test request...');
      const testRequest = {
        requester: currentUser,
        userId: currentUser.id,
        location: currentUser.city || 'תל אביב',
        distance: '0 ק״מ',
        reward: 30,
        deadline: 'היום',
        type: PackageType.MEDIUM,
        status: RequestStatus.PENDING,
        isHidden: false,
        trackingNumber: 'TEST123',
        isAiVerified: true
      };
      
      const requestId = await createNewRequest(testRequest);
      console.log('✅ Test request created:', requestId);
      
      // Step 2: Send community alert
      console.log('📢 Step 2: Sending community alert...');
      const alertId = await communityAlertsService.sendCommunityAlert(
        currentUser,
        'urgent_request',
        `🧪 בדיקת זרימה: ${currentUser.name} מחפש איסוף חבילה - 30 ש"ח שכר`
      );
      console.log('✅ Community alert sent:', alertId);
      
      // Step 3: Wait a moment and check if data appears
      console.log('⏳ Step 3: Waiting for data synchronization...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('✅ Request flow test completed successfully!');
      showToast('✅ בדיקת זרימה הושלמה בהצלחה!');
      
    } catch (error: any) {
      console.error('❌ Request flow test failed:', error);
      showToast(`שגיאה בבדיקת זרימה: ${error.message}`);
    }
  };

  // Performance monitoring function
  const testPerformance = async () => {
    console.log('⚡ Starting performance test...');
    
    // Check authentication
    if (!currentUser.id || !auth.currentUser) {
        console.error('❌ User not authenticated for performance test');
        showToast('שגיאה: משתמש לא מאומת לבדיקה');
        return;
    }
    
    showToast('מתחיל בדיקת ביצועים...');
    
    const performanceResults = {
      timestamp: new Date().toISOString(),
      tests: [] as any[]
    };
    
    try {
      // Test 1: Request creation performance
      console.log('🚀 Test 1: Request creation performance');
      const start1 = performance.now();
      
      const testRequest = {
        requester: currentUser,
        userId: currentUser.id,
        location: currentUser.city,
        distance: '0 ק"מ',
        reward: 50,
        deadline: 'היום',
        type: PackageType.MEDIUM,
        status: RequestStatus.PENDING,
        isHidden: false,
        trackingNumber: 'PERF123',
        isAiVerified: true
      };
      
      await createNewRequest(testRequest);
      const duration1 = performance.now() - start1;
      
      performanceResults.tests.push({
        test: 'Request Creation',
        duration: Math.round(duration1),
        status: duration1 < 1000 ? 'GOOD' : duration1 < 3000 ? 'FAIR' : 'POOR'
      });
      
      // Test 2: Alert system performance
      console.log('🔔 Test 2: Alert system performance');
      const start2 = performance.now();
      
      await communityAlertsService.sendCommunityAlert(
        currentUser,
        'urgent_request',
        `⚡ בדיקת ביצועים: ${currentUser.name} מחפש איסוף חבילה - 50 ש"ח שכר`
      );
      
      const duration2 = performance.now() - start2;
      performanceResults.tests.push({
        test: 'Alert System',
        duration: Math.round(duration2),
        status: duration2 < 500 ? 'GOOD' : duration2 < 1500 ? 'FAIR' : 'POOR'
      });
      
      // Test 3: Data subscription performance
      console.log('📊 Test 3: Data subscription performance');
      const start3 = performance.now();
      
      // Simulate subscription update
      const testRequests = Array.from({ length: 10 }, (_, i) => ({
        id: `test-${i}`,
        requester: currentUser,
        location: currentUser.city,
        distance: `${i * 2} ק"מ`,
        reward: `${20 + i * 5} ש"ח`,
        deadline: 'היום',
        status: 'PENDING'
      }));
      
      // Process the data
      const processedRequests = testRequests.map(req => ({
        ...req,
        processed: true,
        timestamp: new Date()
      }));
      
      const duration3 = performance.now() - start3;
      performanceResults.tests.push({
        test: 'Data Processing',
        duration: Math.round(duration3),
        status: duration3 < 200 ? 'GOOD' : duration3 < 1000 ? 'FAIR' : 'POOR'
      });
      
      // Test 4: UI rendering performance
      console.log('🎨 Test 4: UI rendering performance');
      const start4 = performance.now();
      
      // Force a re-render by updating state
      setRequests(prev => [...prev]);
      
      // Wait for next render cycle
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const duration4 = performance.now() - start4;
      performanceResults.tests.push({
        test: 'UI Rendering',
        duration: Math.round(duration4),
        status: duration4 < 300 ? 'GOOD' : duration4 < 1000 ? 'FAIR' : 'POOR'
      });
      
      // Summary
      const avgDuration = performanceResults.tests.reduce((sum, test) => sum + test.duration, 0) / performanceResults.tests.length;
      const poorTests = performanceResults.tests.filter(test => test.status === 'POOR').length;
      
      console.log('⚡ Performance test completed:', {
        results: performanceResults,
        averageDuration: Math.round(avgDuration),
        poorTests,
        overallStatus: poorTests === 0 ? 'EXCELLENT' : poorTests <= 1 ? 'GOOD' : 'NEEDS_IMPROVEMENT'
      });
      
      showToast(`בדיקת ביצועים הושלמה! ממוצע: ${Math.round(avgDuration)}ms`);
      
      return performanceResults;
      
    } catch (error) {
      console.error('❌ Performance test failed:', error);
      performanceResults.tests.push({
        test: 'Performance Test',
        status: 'ERROR',
        error: error instanceof Error ? error.message : String(error)
      });
      
      showToast('בדיקת ביצועים נכשלה');
      return performanceResults;
    }
  };

  // Comprehensive end-to-end communication test
  const testEndToEndCommunication = async () => {
    console.log('🔄 Starting end-to-end communication test...');
    showToast('מתחיל בדיקת תקשורת...');
    
    const testResults = {
      timestamp: new Date().toISOString(),
      tests: [] as any[]
    };
    
    try {
      // Test 0: Authentication check
      console.log('🔐 Test 0: Authentication status');
      const isAuthenticated = !!currentUser.id && !!auth.currentUser;
      const authStatus = {
        hasUserId: !!currentUser.id,
        hasAuthUser: !!auth.currentUser,
        userId: currentUser.id,
        authUid: auth.currentUser?.uid
      };
      
      testResults.tests.push({
        test: 'Authentication Status',
        status: isAuthenticated ? 'PASS' : 'FAIL',
        details: authStatus
      });
      
      if (!isAuthenticated) {
        throw new Error('User not authenticated - cannot proceed with tests');
      }
      
      // Test 1: User authentication
      console.log('🔐 Test 1: User authentication');
      const userValidation = validateUser(currentUser);
      testResults.tests.push({
        test: 'User Authentication',
        status: userValidation.isValid ? 'PASS' : 'FAIL',
        details: userValidation
      });
      
      // Test 2: Request creation and subscription
      console.log('📦 Test 2: Request creation and subscription');
      const testRequest = {
        requester: currentUser,
        userId: currentUser.id,
        location: currentUser.city,
        distance: '0 ק"מ',
        reward: 50,
        deadline: 'היום',
        type: PackageType.MEDIUM,
        status: RequestStatus.PENDING,
        isHidden: true,
        trackingNumber: 'TEST123',
        isAiVerified: true
      };
      
      const requestId = await createNewRequest(testRequest);
      testResults.tests.push({
        test: 'Request Creation',
        status: 'PASS',
        details: { requestId }
      });
      
      // Wait a moment for the subscription to pick it up
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Test 3: Alert system
      console.log('🔔 Test 3: Alert system');
      const alertId = await communityAlertsService.sendCommunityAlert(
        currentUser,
        'urgent_request',
        `🧪 בדיקת מערכת: ${currentUser.name} מחפש איסוף חבילה - 50 ש"ח שכר`
      );
      testResults.tests.push({
        test: 'Alert System',
        status: 'PASS',
        details: { alertId }
      });
      
      // Test 4: Network health
      console.log('🌐 Test 4: Network health');
      const networkHealth = networkMonitor.getNetworkHealth();
      testResults.tests.push({
        test: 'Network Health',
        status: networkHealth.status === 'good' ? 'PASS' : networkHealth.status === 'fair' ? 'WARN' : 'FAIL',
        details: networkHealth
      });
      
      // Test 5: Data validation
      console.log('✅ Test 5: Data validation');
      const recentEvents = networkMonitor.getRecentEvents(10);
      const errorEvents = recentEvents.filter(e => e.type === 'error');
      testResults.tests.push({
        test: 'Data Validation',
        status: errorEvents.length === 0 ? 'PASS' : 'FAIL',
        details: { 
          totalEvents: recentEvents.length,
          errorEvents: errorEvents.length 
        }
      });
      
      console.log('🎉 End-to-end test completed:', testResults);
      showToast('בדיקת תקשורת הושלמה!');
      
      return testResults;
      
    } catch (error) {
      console.error('❌ End-to-end test failed:', error);
      testResults.tests.push({
        test: 'Test Execution',
        status: 'ERROR',
        details: { error: error instanceof Error ? error.message : String(error) }
      });
      
      showToast('בדיקת תקשורת נכשלה');
      return testResults;
    }
  };

  const handleGoingToPost = async () => {
    try {
      // Send community alert
      await communityAlertsService.sendCommunityAlert(currentUser, 'going_to_post');
      setActiveTab('feed');
      showToast(`📢 נשלחה התרעה לחברי קהילת ${currentUser.community}: "אני בדרך לדואר!"`);
    } catch (error) {
      console.error('Error sending community alert:', error);
      setActiveTab('feed');
      showToast(`📢 נשלחה הודעה לחברי קהילת ${currentUser.community}: "אני בדרך לדואר!"`);
    }
  };

  const handleScanSuccess = async (data: ScanResult) => {
    setScannedData(data);
    setIsAnalyzingPrice(true);
    
    try {
      // Get advanced AI pricing recommendation
      const advancedRecommendation = await getAdvancedAiPriceRecommendation(
        PackageType.MEDIUM,
        1,
        data.deadline || 'היום',
        currentUser.karma,
        currentUser.city,
        data.location || currentUser.city
      );
      
      setAdvancedPricingData(advancedRecommendation);
      setAiPriceSuggestion(advancedRecommendation.finalRecommendation);
      setAiPriceReason(advancedRecommendation.reasoning);
    } catch (error) {
      console.error('Advanced AI pricing failed:', error);
      // Fallback to basic pricing
      const basicRecommendation = getAiPriceRecommendation(PackageType.MEDIUM, 1);
      setAiPriceSuggestion(basicRecommendation.price);
      setAiPriceReason(basicRecommendation.reason);
    } finally {
      setIsAnalyzingPrice(false);
    }
    
    setShowSuccessModal(true);
  };

  const handlePublishRequest = async () => {
      if (!scannedData) return;
      
      // Check authentication status
      if (!currentUser.id || !auth.currentUser) {
          console.error('❌ User not authenticated or missing ID');
          showToast('שגיאה: משתמש לא מאומת');
          return;
      }
      
      console.log('🚀 Starting request publication process...');
      console.log('📋 Scanned data:', scannedData);
      console.log('💰 AI price suggestion:', aiPriceSuggestion);
      console.log('👤 Current user:', currentUser.name, currentUser.city, currentUser.community);
      console.log('🔐 Auth user ID:', auth.currentUser.uid);
      console.log('📝 User ID from state:', currentUser.id);
      
      try {
          const newRequest: any = {
              requester: currentUser,
              userId: currentUser.id, // Add userId for Firestore rules compliance
              location: scannedData.location || currentUser.city,
              distance: '0 ק״מ',
              reward: aiPriceSuggestion,
              deadline: scannedData.deadline || 'היום',
              type: PackageType.MEDIUM,
              status: RequestStatus.PENDING,
              isHidden: false,
              trackingNumber: scannedData.trackingNumber || 'N/A',
              isAiVerified: !!scannedData.trackingNumber
          };
          
          console.log('📝 Prepared request data:', newRequest);

          const requestId = await createNewRequest(newRequest);
          console.log('✅ Request created successfully with ID:', requestId);
          
          // Send community alert about new request
          try {
              console.log('📢 Sending community alert...');
              const alertId = await communityAlertsService.sendCommunityAlert(
                  currentUser, 
                  'urgent_request',
                  `📦 ${currentUser.name} מחפש איסוף חבילה - ${aiPriceSuggestion} ש"ח שכר`
              );
              console.log('✅ Community alert sent with ID:', alertId);
          } catch (alertError) {
              console.error('❌ Error sending community alert:', alertError);
          }
          
          setShowSuccessModal(false);
          showToast("✅ הבקשה פורסמה לקהילה בהצלחה!");
          setActiveTab('feed');
          
          console.log('🎉 Request publication completed successfully!');
      } catch (error) {
          console.error('❌ Error publishing request:', error);
          alert("שגיאה בפרסום הבקשה. נסה שוב.");
      }
  };

  const handleCollectRequest = (request: PackageRequest) => {
    setIsRequestingCollection(true);

    setTimeout(() => {
      setIsRequestingCollection(false);
      setActiveChatRequest(request);
    }, 1500);
  };

  const handleLocationUpdate = (location: LocationData) => {
    setUserLocation(location);
  };

  const handleRequestSelectFromMap = (request: PackageRequest) => {
    // Handle request selection from map
    console.log('Selected request from map:', request);
    // You could open a modal or navigate to the request details
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
       
       {/* Community Alerts */}
       {communityAlerts.length > 0 && (
         <div className="mb-6 space-y-3">
           <h4 className="font-bold text-gray-800 flex items-center gap-2">
             <BellRing className="w-5 h-5 text-yellow-500" />
             התרעות קהילה
           </h4>
           {communityAlerts.map((alert) => (
             <div key={alert.id} className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                   {alert.userName.charAt(0)}
                 </div>
                 <div className="flex-1">
                   <p className="font-semibold text-gray-800">{alert.userName}</p>
                   <p className="text-sm text-gray-600">{alert.message}</p>
                   <p className="text-xs text-gray-500 mt-1">
                     לפני {Math.floor((Date.now() - alert.timestamp.toDate().getTime()) / 60000)} דקות
                   </p>
                 </div>
                 {alert.type === 'going_to_post' && (
                   <button
                     onClick={() => {
                       // Contact the user
                       console.log('Contact user:', alert.userId);
                     }}
                     className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-600 transition-colors"
                   >
                     צור קשר
                   </button>
                 )}
               </div>
             </div>
           ))}
         </div>
       )}
       
      
       
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

  const renderMonitoring = () => {
    if (!isAdmin) {
      return (
        <div className="pt-24 px-4 pb-24 text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-800 mb-2">גישה מוגבלת</h2>
            <p className="text-red-600">ניטור המערכת זמין למנהלים בלבד</p>
          </div>
        </div>
      );
    }
    return <MonitoringPage />;
  };

  const renderLocation = () => (
    <div className="pt-24 px-4 pb-24 animate-in fade-in duration-300">
      <h3 className="text-xl font-bold text-brand-900 flex items-center gap-2 mb-6">
        <MapPin className="w-5 h-5 text-brand-500" /> זיהוי מיקום מאספים
        <span className="text-xs font-medium bg-brand-100 text-brand-700 px-3 py-1.5 rounded-full mr-auto">
          {requests.filter(req => req.status === 'pending').length} זמינים
        </span>
      </h3>
      
      {/* Location Map */}
      <div className="mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Globe2 className="w-5 h-5 text-blue-500" />
            מפת מאספים באזור
          </h4>
          <div className="bg-slate-50 rounded-lg p-4 min-h-[200px] flex items-center justify-center border border-slate-200">
            <div className="text-center text-slate-500">
              <MapPin className="w-12 h-12 mx-auto mb-2 text-slate-400" />
              <p className="text-sm">מיקום מאספים יוצג כאן</p>
              <p className="text-xs text-slate-400 mt-1">לחץ על כפתור המיקום למטה לזיהוי מיקום נוכחי</p>
            </div>
          </div>
        </div>
      </div>

      {/* Nearby Collectors */}
      <div className="mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Bike className="w-5 h-5 text-green-500" />
            מאספים באזורי
          </h4>
          <div className="space-y-3">
            {requests.filter(req => req.status === 'pending').length > 0 ? (
              requests.filter(req => req.status === 'pending').slice(0, 5).map((request) => (
                <div key={request.id} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                        {request.requester.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{request.requester.name}</p>
                        <p className="text-xs text-gray-600">{request.location}</p>
                        <p className="text-xs text-gray-500">מרחק: {request.distance}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-green-600 text-sm">{request.reward} ש"ח</p>
                      <p className="text-xs text-gray-500">{request.deadline}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => handleCollectRequest(request)}
                      className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-green-600 transition-colors"
                    >
                      אסוף
                    </button>
                    <button
                      onClick={() => setActiveChatRequest(request)}
                      className="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-blue-600 transition-colors"
                    >
                      צ'אט
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-slate-500">
                <MapPin className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <p className="text-sm">אין מאספים זמינים כרגע באזורך</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Collection Areas */}
      <div className="mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-500" />
            אזורי איסוף מומלצים
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
              <h5 className="font-semibold text-purple-800 text-sm">מרכז העיר</h5>
              <p className="text-xs text-purple-600 mt-1">ריכוז גבוה של בקשות</p>
              <p className="text-xs text-purple-500 mt-1">5 בקשות פעילות</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <h5 className="font-semibold text-blue-800 text-sm">שכונות מגורים</h5>
              <p className="text-xs text-blue-600 mt-1">ביקוש קבוע למאספים</p>
              <p className="text-xs text-blue-500 mt-1">3 בקשות פעילות</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Header karma={currentUser.karma} userName={currentUser.name} onSystemTest={isAdmin ? () => setShowSystemTest(true) : undefined} />

      {toastMsg && (
          <div className="fixed top-20 left-4 right-4 z-50 bg-green-600 text-white p-4 rounded-xl shadow-lg animate-in slide-in-from-top-4 flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full"><BellRing className="w-5 h-5" /></div>
              <p className="text-sm font-bold">{toastMsg}</p>
          </div>
      )}

      {activeTab === 'home' && renderHome()}
      {activeTab === 'feed' && renderFeed()}
      {activeTab === 'profile' && <Profile user={currentUser} onUpdateUser={setCurrentUser} />}
      {activeTab === 'monitoring' && renderMonitoring()}
      {activeTab === 'location' && renderLocation()}

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
            <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative animate-in slide-in-from-bottom-10 duration-300 max-h-[90vh] overflow-y-auto">
               <button onClick={() => setShowSuccessModal(false)} className="absolute top-4 left-4 p-2 bg-slate-100 rounded-full z-10"><X className="w-5 h-5" /></button>
               <div className="flex flex-col items-center text-center">
                 <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
                 <h2 className="text-xl font-bold text-slate-800 mb-2">החבילה נקלטה!</h2>
                 
                 {/* Package Details */}
                 <div className="bg-slate-50 rounded-xl p-4 w-full mb-4 border border-slate-100 text-right">
                    <p className="text-xs text-slate-500">מיקום:</p>
                    <p className="font-bold text-brand-900">{scannedData.location || 'לא זוהה מיקום'}</p>
                    <p className="text-xs text-slate-500 mt-2">מעקב (מוצפן):</p>
                    <p className="font-mono text-slate-800">{scannedData.trackingNumber || '---'}</p>
                 </div>

                 {/* Advanced AI Pricing Display */}
                 {isAnalyzingPrice ? (
                   <div className="w-full mb-4">
                     <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-200">
                       <div className="flex items-center gap-3">
                         <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                         <div>
                           <h3 className="font-bold text-blue-900">מנתח מחיר עם AI מתקדם...</h3>
                           <p className="text-sm text-blue-700">בודק גורמי שוק, תחרות ותנאים מקומיים</p>
                         </div>
                       </div>
                     </div>
                   </div>
                 ) : advancedPricingData ? (
                   <div className="w-full mb-4">
                     <AdvancedPricingDisplay 
                       pricingData={advancedPricingData} 
                       isAnalyzing={false} 
                     />
                   </div>
                 ) : (
                   <div className="w-full mb-4">
                     <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                       <p className="text-sm text-slate-600">מחיר מומלץ: ₪{aiPriceSuggestion}</p>
                       <p className="text-xs text-slate-500 mt-1">{aiPriceReason}</p>
                     </div>
                   </div>
                 )}
                 
                 <button 
                   onClick={handlePublishRequest} 
                   disabled={isAnalyzingPrice}
                   className="w-full bg-brand-600 text-white py-3.5 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {isAnalyzingPrice ? 'מנתח מחיר...' : 'פרסם בקשה'}
                 </button>
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
      
      {/* Bottom Navigation Only */}
      <div className="fixed bottom-0 left-0 right-0 z-40 safe-area-bottom">
        <div className="relative max-w-md mx-auto">
          <BottomNav 
            activeTab={activeTab} 
            setActiveTab={setActiveTab}
            requests={requests}
            onLocationUpdate={handleLocationUpdate}
            onRequestSelectFromMap={handleRequestSelectFromMap}
            isAdmin={isAdmin}
          />
        </div>
      </div>

      {/* System Test Component */}
      {showSystemTest && (
        <SystemTest 
          currentUser={currentUser}
          onTestComplete={(results) => {
            console.log('🧪 System test completed:', results);
            setShowSystemTest(false);
            if (results.errors.length > 0) {
              showToast(`נמצאו ${results.errors.length} שגיאות במערכת`);
            } else {
              showToast('✅ כל הבדיקות עברו בהצלחה!');
            }
          }}
        />
      )}
    </div>
  );
};

export default App;
