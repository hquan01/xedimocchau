import { doc, setDoc, deleteDoc, collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db, auth, handleFirestoreError, OperationType } from "../firebase";
import { Booking, BlockedSeat, LimousineConfig, SharedCarConfig, TourCombo, Accommodation, Coupon, LocationPoint, Destination, GuideArticle, AppNotification, Review } from "../types";

// Let's get things from localStorage
export const getDeviceId = (): string => {
  let id = localStorage.getItem("xemc_device_id");
  if (!id) {
    id = "dev_" + Math.random().toString(36).substring(2, 15);
    localStorage.setItem("xemc_device_id", id);
  }
  return id;
};

export const getLocalList = <T>(key: string, defaultValue: T[]): T[] => {
  try {
    const val = localStorage.getItem(`xemc_${key}`);
    return val ? JSON.parse(val) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

export const setLocalList = <T>(key: string, data: T[]) => {
  try {
    localStorage.setItem(`xemc_${key}`, JSON.stringify(data));
    window.dispatchEvent(new Event("xedimocchau_db_update"));
  } catch (e) {
    console.error(e);
  }
};

export const saveReviewToFirebase = async (review: Review) => {
  try {
    const sanitizedReview = JSON.parse(JSON.stringify(review));
    await setDoc(doc(db, "reviews", review.id), sanitizedReview);
    console.log("Review saved to Firebase successfully");
  } catch (error) {
    console.error("Error saving review to Firebase:", error);
  }
};

export const deleteReviewFromFirebase = async (id: string) => {
  try {
    await deleteDoc(doc(db, "reviews", id));
    console.log("Review deleted from Firebase successfully");
  } catch (error) {
    console.error("Error deleting review from Firebase:", error);
  }
};

export const listenToReviews = (destinationId: string, callback: (reviews: Review[]) => void) => {
  const q = query(
    collection(db, "reviews"),
    where("destinationId", "==", destinationId)
  );

  return onSnapshot(q, (snapshot) => {
    const reviews: Review[] = [];
    snapshot.forEach((doc) => {
      reviews.push(doc.data() as Review);
    });
    // Sort on client side to avoid index requirement
    reviews.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    callback(reviews);
  }, (error) => {
    console.error("Error listening to reviews:", error);
  });
};

export const saveBookingToFirebase = async (booking: Booking) => {
  // Sync to local first for immediate feedback
  const current = getLocalList<Booking>("bookings", []);
  const existingIndex = current.findIndex(b => b.id === booking.id);
  if (existingIndex > -1) {
    current[existingIndex] = booking;
  } else {
    current.push(booking);
  }
  setLocalList("bookings", current);

  if (true) { // Try saving to Firebase regardless of auth state
    console.log("Attempting to save booking to Firebase");
    try {
      // Remove undefined values and add deviceId
      const sanitizedBooking = JSON.parse(JSON.stringify(booking));
      sanitizedBooking.deviceId = getDeviceId();
      await setDoc(doc(db, "bookings", booking.id), sanitizedBooking);
      console.log("Booking saved to Firebase successfully");
    } catch (error) {
      console.warn("Could not sync booking to Firebase, saved locally:", error);
    }
  }
};

export const updateStatusInFirebase = async (id: string, data: any, collectionName: string = "bookings") => {
  // Try saving to Firebase regardless of auth state
  try {
    const sanitizedData = JSON.parse(JSON.stringify(data));
    await setDoc(doc(db, collectionName, id), sanitizedData, { merge: true });
    console.log(`Successfully updated ${id} in ${collectionName}`);
  } catch (error) {
    console.warn(`Could not update ${id} in ${collectionName} to Firebase:`, error);
  }

  // Also sync locally if it's bookings
  if (collectionName === "bookings") {
    const current = getLocalList<Booking>("bookings", []);
    const existingIndex = current.findIndex(b => b.id === id);
    if (existingIndex > -1) {
      current[existingIndex] = { ...current[existingIndex], ...data };
      setLocalList("bookings", current);
    }
  }
};

export const updateBookingStatusInFirebase = async (bookingId: string, booking: Booking) => {
  await updateStatusInFirebase(bookingId, booking, "bookings");
};

export const saveBlockedSeatToFirebase = async (seat: BlockedSeat) => {
  const key = seat.seatId + seat.tripId + seat.travelDate;
  const current = getLocalList<BlockedSeat>("blocked_seats", []);
  const exists = current.some(s => s.tripId === seat.tripId && s.travelDate === seat.travelDate && s.seatId === seat.seatId);
  if (!exists) {
    current.push(seat);
  }
  setLocalList("blocked_seats", current);

  if (true) {
    try {
      await setDoc(doc(db, "blocked_seats", key), seat);
    } catch (error) {
      console.warn("Could not save blocked seat to Firebase, saved locally:", error);
    }
  }
};

export const deleteBlockedSeatFromFirebase = async (seat: BlockedSeat) => {
  const key = seat.seatId + seat.tripId + seat.travelDate;
  const current = getLocalList<BlockedSeat>("blocked_seats", []);
  const nextList = current.filter(s => !(s.seatId === seat.seatId && s.tripId === seat.tripId && s.travelDate === seat.travelDate));
  setLocalList("blocked_seats", nextList);

  if (true) {
    try {
      await deleteDoc(doc(db, "blocked_seats", key));
    } catch (error) {
      console.warn("Could not delete blocked seat from Firebase, removed locally:", error);
    }
  }
};

export const saveConfigToFirebase = async (key: string, data: any) => {
  try {
    const configsStr = localStorage.getItem(`xemc_configs`) || "{}";
    const configs = JSON.parse(configsStr);
    configs[key] = data;
    localStorage.setItem(`xemc_configs`, JSON.stringify(configs));
    window.dispatchEvent(new Event("xedimocchau_db_update"));
  } catch (e) {
    console.error(e);
  }

  // Split storage: Save each key into its own document or collection
  try {
    const sanitizedData = JSON.parse(JSON.stringify(data));
    
    // Helper function for collection batch update
    const updateCollection = async (collectionName: string, items: any[]) => {
      const { writeBatch, collection, doc, getDocs } = await import("firebase/firestore");
      const existingDocs = await getDocs(collection(db, collectionName));
      const currentIds = new Set(items.map(i => i.id));
      
      const batch = writeBatch(db);
      // Delete removed items
      existingDocs.docs.forEach(docSnap => {
        if (!currentIds.has(docSnap.id)) batch.delete(docSnap.ref);
      });
      // Upsert current items
      items.forEach((item: any) => {
        if (!item.id) {
           console.warn(`Item in ${collectionName} missing ID, skipping:`, item);
           return;
        }
        const ref = doc(collection(db, collectionName), String(item.id));
        batch.set(ref, item);
      });
      await batch.commit();
      console.log(`Collection ${collectionName} updated successfully`);
    };

    if (key === "combos" && Array.isArray(sanitizedData)) {
       await updateCollection("tour_combos", sanitizedData);
    } else if (key === "accommodations" && Array.isArray(sanitizedData)) {
       await updateCollection("accommodations", sanitizedData);
    } else if (key === "articles" && Array.isArray(sanitizedData)) {
       await updateCollection("guide_articles", sanitizedData);
    } else if (key === "coupons" && Array.isArray(sanitizedData)) {
       await updateCollection("coupons", sanitizedData);
    } else if (key === "destinations" && Array.isArray(sanitizedData)) {
       await updateCollection("destinations", sanitizedData);
    } else {
       // Save smaller configs to its own document (e.g., configs/limousineConfig)
       await setDoc(doc(db, "configs", key), { [key]: sanitizedData });
       console.log(`Config ${key} saved to Firestore successfully`);
    }
  } catch (error: any) {
    console.error(`ERROR: Could not save config ${key} to Firebase:`, error);
    if (error.code === 'permission-denied') {
       alert(`Lỗi: Bạn không có quyền sửa nội dung này trên máy chủ (Permission Denied).`);
    } else {
       alert(`Lỗi khi lưu ${key} lên máy chủ: ${error.message || 'Lỗi mạng'}. Dữ liệu chỉ được lưu tạm thời trên máy này.`);
    }
    throw error;
  }
};

export const saveUserToFirebase = async (userId: string, data: any) => {
  const current = getLocalList<any>("users", []);
  const existingIndex = current.findIndex(u => u.id === userId);
  if (existingIndex > -1) {
    current[existingIndex] = { ...current[existingIndex], ...data };
  } else {
    current.push({ id: userId, ...data });
  }
  setLocalList("users", current);

  if (true) {
    try {
      await setDoc(doc(db, "users", userId), data, { merge: true });
    } catch (error) {
      console.warn("Could not save user to Firebase, saved locally:", error);
    }
  }
};

export const saveNotificationToFirebase = async (notification: AppNotification) => {
  if (true) {
    try {
      // Remove undefined values
      const sanitizedNotification = JSON.parse(JSON.stringify(notification));
      await setDoc(doc(db, "notifications", notification.id), sanitizedNotification);
    } catch (error) {
      console.warn("Could not save notification to Firebase:", error);
    }
  }
};
