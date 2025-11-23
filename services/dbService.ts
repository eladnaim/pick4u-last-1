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
import { PackageRequest, RequestStatus } from "../types";

// --- Requests ---

export const subscribeToRequests = (
  userCity: string, 
  userCommunity: string,
  isUniversal: boolean,
  callback: (requests: PackageRequest[]) => void
) => {
  const requestsRef = collection(db, "requests");
  
  let q;
  // If universal, fetch all active requests in the city (or simplify to just active for now)
  // Ideally, GeoQueries are used here, but for MVP we filter by City/Status
  if (isUniversal) {
    q = query(
      requestsRef, 
      where("status", "in", [RequestStatus.PENDING, RequestStatus.ACCEPTED]),
      where("requester.city", "==", userCity), // Simple radius simulation
      orderBy("createdAt", "desc")
    );
  } else {
    // Local collector - only my community
    q = query(
      requestsRef,
      where("status", "in", [RequestStatus.PENDING, RequestStatus.ACCEPTED]),
      where("requester.city", "==", userCity),
      where("requester.community", "==", userCommunity),
      orderBy("createdAt", "desc")
    );
  }

  return onSnapshot(q, (snapshot) => {
    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as PackageRequest[];
    callback(requests);
  });
};

export const createNewRequest = async (requestData: Omit<PackageRequest, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, "requests"), {
      ...requestData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (e) {
    console.error("Error adding request: ", e);
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