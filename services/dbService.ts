import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  orderBy
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { getAuth } from "firebase/auth";
import { PackageRequest, RequestStatus } from "../types";
import { monitorFirebaseOperation } from "./networkMonitor";
import { validatePackageRequest, validateMultipleRequests } from "./dataValidation";

// --- Requests ---

export const subscribeToRequests = (
  userCity: string, 
  userCommunity: string,
  isUniversal: boolean,
  callback: (requests: PackageRequest[]) => void
) => {
  try {
    console.log('🔍 Subscribing to requests:', { userCity, userCommunity, isUniversal });
    const requestsRef = collection(db, "requests");
    
    // Ensure we have proper authentication before subscribing
    const auth = getAuth();
    if (!auth.currentUser) {
      console.warn('⚠️ No authenticated user found, subscribing with limited permissions');
      callback([]);
      return () => {}; // Return empty unsubscribe function
    }
    
    let q;
    // Simplified query to avoid complex indexes
    if (isUniversal) {
      // First, get all pending/accepted requests
      q = query(
        requestsRef, 
        where("status", "in", [RequestStatus.PENDING, RequestStatus.ACCEPTED]),
        orderBy("createdAt", "desc")
      );
    } else {
      // For local collectors, filter by community
      q = query(
        requestsRef,
        where("status", "in", [RequestStatus.PENDING, RequestStatus.ACCEPTED]),
        orderBy("createdAt", "desc")
      );
    }

    let fallbackUnsubscribe: (() => void) | null = null;
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        console.log('📨 Received requests snapshot:', snapshot.docs.length, 'docs');
        console.log('📍 Subscription params:', { userCity, userCommunity, isUniversal });
        
        let requests = snapshot.docs.map(doc => {
          const data = doc.data();
          console.log('📦 Request data:', {
            id: doc.id,
            status: data.status,
            location: data.location,
            requester: data.requester?.name,
            requesterCity: data.requester?.city,
            requesterCommunity: data.requester?.community,
            createdAt: data.createdAt?.toDate?.()
          });
          return {
            id: doc.id,
            ...data
          } as PackageRequest;
        });
        
        console.log('🔍 Before filtering:', requests.length, 'requests');
        
        // Filter by city/community on client side to avoid complex indexes
        if (isUniversal) {
          requests = requests.filter(req => {
            const matches = req.requester?.city === userCity;
            console.log(`🏙️ Universal filter: ${req.requester?.name} from ${req.requester?.city} vs ${userCity} = ${matches}`);
            return matches;
          });
        } else {
          requests = requests.filter(req => {
            const cityMatch = req.requester?.city === userCity;
            const communityMatch = req.requester?.community === userCommunity;
            console.log(`🏘️ Community filter: ${req.requester?.name} from ${req.requester?.city}/${req.requester?.community} vs ${userCity}/${userCommunity} = ${cityMatch && communityMatch}`);
            return cityMatch && communityMatch;
          });
        }
        
        console.log('✅ Final filtered requests:', requests.length);
        
        // Validate and sanitize requests before returning
        const { valid, invalid } = validateMultipleRequests(requests);
        
        if (invalid.length > 0) {
          console.warn('⚠️ Found invalid requests:', invalid.length);
          invalid.forEach(({ request, validation }) => {
            console.warn('Invalid request:', {
              id: request.id,
              errors: validation.errors,
              warnings: validation.warnings
            });
          });
        }
        
        console.log('✅ Valid requests to return:', valid.length);
        callback(valid);
      },
      (error) => {
        console.error('Error subscribing to requests:', error);
        console.error('Error details:', error.code, error.message);
        const requestsRef = collection(db, "requests");
        const fallbackQuery = query(requestsRef, orderBy("createdAt", "desc"));
        fallbackUnsubscribe = onSnapshot(
          fallbackQuery,
          (snapshot) => {
            let requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PackageRequest));
            requests = requests.filter(req => 
              (req.status === RequestStatus.PENDING || req.status === RequestStatus.ACCEPTED)
            );
            if (isUniversal) {
              requests = requests.filter(req => req.requester?.city === userCity);
            } else {
              requests = requests.filter(req => req.requester?.city === userCity && req.requester?.community === userCommunity);
            }
            const { valid } = validateMultipleRequests(requests);
            callback(valid);
          },
          (fallbackError) => {
            console.error('Fallback subscription failed:', fallbackError);
            callback([]);
          }
        );
      }
    );

    return () => {
      try { unsubscribe(); } catch {}
      try { fallbackUnsubscribe && fallbackUnsubscribe(); } catch {}
    };
  } catch (error) {
    console.error('Failed to create requests subscription:', error);
    callback([]); // Return empty array on error
    return () => {}; // Return empty unsubscribe function
  }
};

export const createNewRequest = async (requestData: Omit<PackageRequest, 'id'>) => {
  try {
    // Ensure we have proper authentication
    const auth = getAuth();
    if (!auth.currentUser) {
      throw new Error('User must be authenticated to create requests');
    }
    
    console.log('📝 Creating new request with user:', auth.currentUser.uid);
    
    const docRef = await monitorFirebaseOperation(
      'createNewRequest',
      addDoc(collection(db, "requests"), {
        ...requestData,
        userId: auth.currentUser.uid, // Ensure userId is set
        createdAt: serverTimestamp()
      })
    );
    console.log('✅ Request created successfully:', docRef.id);
    return docRef.id;
  } catch (e) {
    console.error("❌ Error adding request: ", e);
    throw e;
  }
};

export const updateRequestStatus = async (requestId: string, status: RequestStatus, collectorId?: string) => {
  const reqRef = doc(db, "requests", requestId);
  await updateDoc(reqRef, { 
    status,
    collectorId: collectorId || null,
    updatedAt: serverTimestamp()
  });
};

// --- Chat ---

export const subscribeToChat = (requestId: string, callback: (messages: any[]) => void) => {
  const messagesRef = collection(db, "requests", requestId, "messages");
  const q = query(messagesRef, orderBy("timestamp", "asc"));

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(messages);
  });
};

export const sendMessage = async (requestId: string, message: any) => {
  const messagesRef = collection(db, "requests", requestId, "messages");
  await addDoc(messagesRef, {
    ...message,
    timestamp: Date.now() // Using client time for simpler UI sorting for now, or serverTimestamp
  });
};
