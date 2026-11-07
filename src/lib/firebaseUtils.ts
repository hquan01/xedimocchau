import { doc, setDoc, deleteDoc, collection, query, where, onSnapshot, orderBy, runTransaction } from "firebase/firestore";
import { db, auth, handleFirestoreError, OperationType } from "../firebase";
import {rewardPointsForBooking, creditedPointsForBooking, previousConfirmedBookings} from "./loyalty";
import {couponDecision} from "./couponEligibility";
import {isFutureDeparture, PAST_DEPARTURE_MESSAGE} from "./bookingTime";
import type {User} from "../types";
import { Booking, BlockedSeat, LimousineConfig, SharedCarConfig, TourCombo, Accommodation, Coupon, LocationPoint, Destination, GuideArticle, AppNotification, Review, ZaloGroup, CommunityQuestion } from "../types";

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
  // Re-check immediately before writing: time may have elapsed while the form was open.
  if (["limousine", "shared_car", "combo"].includes(booking.type) &&
      !isFutureDeparture(booking.travelDate, booking.departureTime || "")) {
    throw new Error(PAST_DEPARTURE_MESSAGE);
  }
  // Sync to local first for immediate feedback
  const current = getLocalList<Booking>("bookings", []);
  const existingIndex = current.findIndex(b => b.id === booking.id);
  if (existingIndex > -1) {
    current[existingIndex] = booking;
  } else {
    current.push(booking);
  }
  // Keep a local copy only AFTER Firebase confirms the booking.
  // Otherwise the customer may see a phantom reservation that the operator
  // has never received.
  if (true) { // Try saving to Firebase regardless of auth state
    console.log("Attempting to save booking to Firebase");
    try {
      // Remove undefined values and add deviceId
      const sanitizedBooking = JSON.parse(JSON.stringify(booking));
      sanitizedBooking.deviceId = getDeviceId();
      const bookingRef=doc(db,"bookings",booking.id);
      const spendingPoints=Math.max(0,Math.floor(Number(booking.pointsDeducted||0)));
      const couponCode=typeof booking.couponCode==="string" ? booking.couponCode.trim().toUpperCase() : "";
      if(couponCode && !booking.couponId)throw new Error("Mã ưu đãi không có thông tin kiểm tra. Vui lòng nhập lại mã.");
      if(spendingPoints>0 || couponCode) {
        const uid=auth.currentUser?.uid;
        if(!uid || !booking.userId || uid!==booking.userId) {
          throw new Error("Bạn cần đăng nhập thành viên để dùng điểm hoặc voucher.");
        }
        const profileRef=doc(db,"users",uid);
        await runTransaction(db,async tx=>{
          const couponRef=couponCode ? doc(db,"coupons",booking.couponId!) : null;
          const [profileDoc,existingBooking,couponDoc]=await Promise.all([
            tx.get(profileRef),tx.get(bookingRef),
            couponRef ? tx.get(couponRef) : Promise.resolve(null)
          ]);
          if(existingBooking.exists())throw new Error("Mã đặt vé này đã tồn tại.");
          if(!profileDoc.exists())throw new Error("Chưa tìm thấy ví điểm thành viên.");
          const profile=profileDoc.data() as User;
          if(couponCode){
            if(!couponDoc?.exists())throw new Error("Mã voucher không còn tồn tại.");
            const voucher=couponDoc.data() as Coupon;
            if(voucher.code.toUpperCase()!==couponCode)throw new Error("Mã voucher không khớp.");
            const decision=couponDecision(voucher,{...profile,id:uid,role:'customer'});
            if(!decision.eligible)throw new Error(decision.reason);
            if(voucher.discountPercentage<=0||voucher.discountPercentage>100)
              throw new Error("Mức giảm của voucher không hợp lệ.");
          }
          if(previousConfirmedBookings({...profile,id:uid,role:'customer'})<1)
            throw new Error("Điểm và voucher chỉ áp dụng từ lần đặt vé thứ hai, sau khi vé đầu đã được xác nhận.");
          const points=Math.max(0,Math.floor(Number(profile.points||0)));
          if(spendingPoints>points)throw new Error("Số dư điểm không đủ. Vui lòng tải lại trang.");
          const alreadyUsed:string[]=Array.isArray(profile.usedCoupons)?profile.usedCoupons:[];
          if(couponCode && alreadyUsed.includes(couponCode))
            throw new Error("Voucher này đã được sử dụng.");
          const profileChange:any={};
          if(spendingPoints>0)profileChange.points=points-spendingPoints;
          if(couponCode) {
            profileChange.usedCoupons=[...alreadyUsed,couponCode];
            if(couponRef && couponDoc?.exists()) {
              const currentUsage = Number(couponDoc.data()?.usageCount || 0);
              tx.update(couponRef, { usageCount: currentUsage + 1 });
            }
          }
          tx.set(profileRef,profileChange,{merge:true});
          tx.set(bookingRef,sanitizedBooking);
        });
      } else {
        await setDoc(bookingRef,sanitizedBooking);
      }
      setLocalList("bookings", current);
      console.log("Booking saved to Firebase successfully");
    } catch (error) {
      console.warn("Could not sync booking to Firebase:", error);
      // A local draft is NOT a received booking. Do not let payment/confirmation
      // advance silently when the operator cannot see this reservation.
      throw new Error("Chưa gửi được đơn đặt xe lên máy chủ. Vui lòng kiểm tra kết nối rồi thử lại.");
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

/**
 * An operator confirms a booking once, and the linked customer receives one
 * point per booked passenger seat. The earned amount is snapshotted on the
 * booking so a later cancellation returns precisely those points.
 * Booking and member wallet are updated atomically; repeated confirmations
 * cannot earn points twice.
 *
 * NOTE: Real fraud protection still requires secure Firestore rules; the
 * legacy publicly writable rules are not sufficient for production discounts.
 */
export const updateBookingStatusWithRewards = async (
  bookingId:string,status:Booking["status"]
):Promise<void> => {
  const bookingRef=doc(db,"bookings",bookingId);
  await runTransaction(db,async tx=>{
    const existing=await tx.get(bookingRef);
    if(!existing.exists())throw new Error("Không tìm thấy vé để cập nhật.");
    const booking=existing.data() as Booking;
    const customerRef=booking.userId ? doc(db,"users",booking.userId) : null;
    const customer=customerRef ? await tx.get(customerRef) : null;
    const profile=customer?.exists()?customer.data() as any:null;
    const rewarded:string[]=Array.isArray(profile?.rewardedBookingIds)?profile.rewardedBookingIds:[];
    const usedCoupons:string[]=Array.isArray(profile?.usedCoupons)?profile.usedCoupons:[];
    const existingPoints=Math.max(0,Math.floor(Number(profile?.points||0)));
    const confirmed=status==="success" || status==="completed";
    const cancelled=status==="cancelled";
    const alreadyRewarded=rewarded.includes(bookingId);
    const earnedPoints=rewardPointsForBooking(booking);
    let nextRewarded=rewarded;
    let points=existingPoints;
    let changed=false;
    const bookingChange:any={status};

    if(profile && confirmed && !alreadyRewarded && earnedPoints>0){
      nextRewarded=[...rewarded,bookingId];
      points+=earnedPoints;
      // Freeze the credit amount. Never recalculate a previously rewarded
      // booking when seats are edited or status is confirmed again.
      bookingChange.rewardPointsAwarded=earnedPoints;
      changed=true;
    } else if(profile && !confirmed && alreadyRewarded){
      nextRewarded=rewarded.filter(id=>id!==bookingId);
      // Pre-policy bookings have no rewardPointsAwarded; they originally got +1.
      points=Math.max(0,points-creditedPointsForBooking(booking));
      bookingChange.rewardPointsAwarded=0;
      changed=true;
    }
    if(profile && cancelled && (booking.pointsDeducted||0)>0 && !booking.pointsRefunded){
      points+=Math.floor(booking.pointsDeducted||0);
      bookingChange.pointsRefunded=true;
      changed=true;
    }
    if(profile && cancelled && booking.couponCode && usedCoupons.includes(booking.couponCode.toUpperCase())){
      changed=true;
    }
    if(changed && customerRef && profile){
      const nextUsed=cancelled && booking.couponCode
        ? usedCoupons.filter(code=>code!==booking.couponCode?.toUpperCase()) : usedCoupons;
      tx.set(customerRef,{
        points,rewardedBookingIds:nextRewarded,
        completedBookingsCount:nextRewarded.length,
        usedCoupons:nextUsed
      },{merge:true});
    }
    tx.set(bookingRef,bookingChange,{merge:true});
  });
  const current=getLocalList<Booking>("bookings",[]);
  const index=current.findIndex(b=>b.id===bookingId);
  if(index>=0){current[index]={...current[index],status};setLocalList("bookings",current);}
};

/**
 * Repair legacy member balances for bookings that were already marked
 * confirmed before the new point policy was deployed. Only a booking linked
 * to the authenticated Firebase UID qualifies; phone numbers alone do not
 * establish ownership. A transaction credits at most one seat-based award
 * per booking ID, and stores the awarded amount on the order.
 */
export const reconcileConfirmedMemberBooking = async (bookingId:string):Promise<void> => {
  const uid=auth.currentUser?.uid;
  if(!uid)return;
  const bookingRef=doc(db,"bookings",bookingId);
  const profileRef=doc(db,"users",uid);
  await runTransaction(db,async tx=>{
    const bookingDoc=await tx.get(bookingRef);
    const profileDoc=await tx.get(profileRef);
    if(!bookingDoc.exists() || !profileDoc.exists())return;
    const booking=bookingDoc.data() as Booking;
    if(booking.userId!==uid || (booking.status!=="success" && booking.status!=="completed"))return;
    const profile=profileDoc.data() as any;
    const rewarded:string[]=Array.isArray(profile.rewardedBookingIds)?profile.rewardedBookingIds:[];
    if(rewarded.includes(bookingId))return;
    const earnedPoints=rewardPointsForBooking(booking);
    if(earnedPoints<=0)return;
    const next=[...rewarded,bookingId];
    tx.set(profileRef,{
      rewardedBookingIds:next,
      completedBookingsCount:next.length,
      points:Math.max(0,Math.floor(Number(profile.points||0)))+earnedPoints
    },{merge:true});
    tx.set(bookingRef,{rewardPointsAwarded:earnedPoints},{merge:true});
  });
};

export const deleteBookingFromFirebase = async (bookingId: string) => {
  const current = getLocalList<Booking>("bookings", []);
  const nextList = current.filter(b => b.id !== bookingId);
  setLocalList("bookings", nextList);

  try {
    await deleteDoc(doc(db, "bookings", bookingId));
    console.log("Booking deleted from Firebase successfully");
  } catch (error) {
    console.warn("Could not delete booking from Firebase, removed locally:", error);
  }
};

export const saveBlockedSeatToFirebase = async (seat: BlockedSeat) => {
  const key = seat.seatId + seat.tripId + seat.travelDate;
  const current = getLocalList<BlockedSeat>("blocked_seats", []);
  const idx = current.findIndex(s => s.tripId === seat.tripId && s.travelDate === seat.travelDate && s.seatId === seat.seatId);
  if (idx > -1) {
    current[idx] = seat;
  } else {
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
    } else if (key === "restaurants" && Array.isArray(sanitizedData)) {
       await updateCollection("restaurants", sanitizedData);
    } else if (key === "flower_seasons" && Array.isArray(sanitizedData)) {
       await updateCollection("flower_seasons", sanitizedData);
    } else if (key === "partners" && Array.isArray(sanitizedData)) {
       await updateCollection("partners", sanitizedData);
    } else if (key === "taxi_fleet" && Array.isArray(sanitizedData)) {
       await updateCollection("taxi_fleet", sanitizedData);
    } else if (key === "motorbike_fleet" && Array.isArray(sanitizedData)) {
       await updateCollection("motorbike_fleet", sanitizedData);
    } else if (key === "ai_faqs" && Array.isArray(sanitizedData)) {
       await updateCollection("ai_faqs", sanitizedData);
    } else {
       // Save smaller configs to its own document (e.g., configs/limousineConfig)
       await setDoc(doc(db, "configs", key), { [key]: sanitizedData });
       console.log(`Config ${key} saved to Firestore successfully`);
    }
  } catch (error: any) {
    console.warn(`Firestore sync note for ${key}:`, error?.message || error);
    if (error?.code === 'permission-denied') {
       console.warn(`Permission denied for ${key}`);
    }
  }
};

export const saveCollectionItemsToFirebase = async (collectionName: string, items: any[]) => {
  return saveConfigToFirebase(collectionName, items);
};

export const saveCollectionItemsToLocalAndFirebase = async (collectionName: string, localStorageKey: string, items: any[]) => {
  setLocalList(localStorageKey, items);
  return saveCollectionItemsToFirebase(collectionName, items);
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

  try {
    await setDoc(doc(db, "users", userId), data, { merge: true });
  } catch (error) {
    console.warn("Could not save user to Firebase:", error);
    throw error;
  }
};

export const saveNotificationToFirebase = async (notification: AppNotification) => {
  try {
    const sanitizedNotification = JSON.parse(JSON.stringify(notification));
    await setDoc(doc(db, "notifications", notification.id), sanitizedNotification);
  } catch (error) {
    console.warn("Could not save notification to Firebase:", error);
    throw error;
  }
};

export const saveZaloGroupToFirebase = async (group: ZaloGroup) => {
  const current = getLocalList<ZaloGroup>("zalo_groups", []);
  const existingIdx = current.findIndex(g => g.id === group.id);
  if (existingIdx > -1) {
    current[existingIdx] = group;
  } else {
    current.push(group);
  }
  setLocalList("zalo_groups", current);

  try {
    const sanitized = JSON.parse(JSON.stringify(group));
    await setDoc(doc(db, "zalo_groups", group.id), sanitized, { merge: true });
    console.log(`Zalo group ${group.id} saved to Firestore`);
  } catch (err) {
    console.warn("Could not save zalo_group to Firestore:", err);
    throw err;
  }
};

export const deleteZaloGroupFromFirebase = async (id: string) => {
  const current = getLocalList<ZaloGroup>("zalo_groups", []);
  const updated = current.filter(g => g.id !== id);
  setLocalList("zalo_groups", updated);

  try {
    await deleteDoc(doc(db, "zalo_groups", id));
    console.log(`Zalo group ${id} deleted from Firestore`);
  } catch (err) {
    console.warn("Could not delete zalo_group from Firestore:", err);
    throw err;
  }
};

export const saveCommunityQuestionToFirebase = async (question: CommunityQuestion) => {
  const current = getLocalList<CommunityQuestion>("community_questions", []);
  const existingIdx = current.findIndex(q => q.id === question.id);
  if (existingIdx > -1) {
    current[existingIdx] = question;
  } else {
    current.push(question);
  }
  setLocalList("community_questions", current);

  try {
    const sanitized = JSON.parse(JSON.stringify(question));
    await setDoc(doc(db, "community_posts", question.id), sanitized, { merge: true });
    console.log(`Community question ${question.id} saved to Firestore`);
  } catch (err) {
    console.warn("Could not save community_post to Firestore:", err);
    throw err;
  }
};

export const deleteItemFromCollection = async (collectionName: string, id: string) => {
  try {
    const { doc, deleteDoc } = await import("firebase/firestore");
    await deleteDoc(doc(db, collectionName, id));
    console.log(`Item ${id} deleted from ${collectionName} successfully`);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${id}`);
    throw error;
  }
};



