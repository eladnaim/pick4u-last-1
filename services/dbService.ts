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
  // Basic guard
  if (!userCity || !userCommunity) {
    callback([]);
    return () => {};
  }

  try {
    const requestsRef = collection(db, "requests");

    const auth = getAuth();
    if (!auth.currentUser) {
      callback([]);
      return () => {};
    }

    let q;
    try {
      if (isUniversal) {
        q = query(
          requestsRef,
          where("status", "in", [RequestStatus.PENDING, RequestStatus.ACCEPTED]),
          where("requester.city", "==", userCity),
          orderBy("createdAt", "desc"),
          limit(50)
        );
      } else {
        q = query(
          requestsRef,
          where("status", "in", [RequestStatus.PENDING, RequestStatus.ACCEPTED]),
          where("requester.community", "==", userCommunity),
          where("requester.city", "==", userCity),
          orderBy("createdAt", "desc"),
          limit(50)
        );
      }
    } catch (err) {
      q = query(
        requestsRef,
        where("status", "in", [RequestStatus.PENDING, RequestStatus.ACCEPTED]),
        orderBy("createdAt", "desc"),
        limit(20)
      );
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const rawRequests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PackageRequest));
        const { valid } = validateMultipleRequests(rawRequests);
        const filtered = valid.filter(req => (isUniversal ? req.requester?.city === userCity : (req.requester?.city === userCity && req.requester?.community === userCommunity)));
        callback(filtered);
      },
      (error) => {
        console.error('🔥 Firebase Subscription Error:', error);
        callback([]);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Failed to create requests subscription:', error);
    callback([]);
    return () => {};
  }
};

export const createNewRequest = async (requestData: Omit<PackageRequest, 'id'>) => {
  try {
    // Ensure we have proper authentication
    const auth = getAuth();
    if (!auth.currentUser) {
      throw new Error('User must be authenticated to create requests');
    }
    
    const docRef = await monitorFirebaseOperation(
      'createNewRequest',
      addDoc(collection(db, "requests"), {
        ...requestData,
        userId: auth.currentUser.uid, // Ensure userId is set
        createdAt: serverTimestamp(),
        "requester.city": requestData.requester.city,
        "requester.community": requestData.requester.community
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
