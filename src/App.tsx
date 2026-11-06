import React, { useState, lazy, Suspense } from "react";
import { ArrowLeft, House, ShieldCheck } from "lucide-react";
import { doc, deleteDoc, writeBatch, collection, onSnapshot } from "firebase/firestore";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import BookingSwitcher from "./components/BookingSwitcher";
import { rememberDeviceBooking, forgetDeviceBooking } from "./lib/deviceBookingHistory";
import ComboBooking from "./components/ComboBooking";
import FloatingContact from "./components/FloatingContact";
import AIChatWidget from "./components/AIChatWidget";
import BottomNavigation from "./components/BottomNavigation";
import {submitServiceInquiry} from "./lib/serviceRequests";
import CategoryDirectoryView from "./components/CategoryDirectoryView";
import CategoryItemDetail from "./components/CategoryItemDetail";
import { useSEO } from "./hooks/useSEO";
import {articlePublicUrl,SEO_ARTICLE_SLUGS} from './lib/articleSeo';

import NotificationCenter from "./components/NotificationCenter";

// Lazy load heavy or secondary components
const AIPlanner = lazy(() => import("./components/AIPlanner"));
const ExploreMocChau = lazy(() => import("./components/ExploreMocChau"));
const ExploreLanding = lazy(() => import("./components/ExploreLanding"));
const TravelGuide = lazy(() => import("./components/TravelGuide"));
const BookingList = lazy(() => import("./components/BookingList"));
const PaymentModal = lazy(() => import("./components/PaymentModal"));
const AuthModal = lazy(() => import("./components/AuthModal"));
const OperatorPanel = lazy(() => import("./components/OperatorPanel"));
const AdminPasswordSetup = lazy(() => import("./components/AdminPasswordSetup"));
const CustomerDashboard = lazy(() => import("./components/CustomerDashboard"));
const TripPrepView = lazy(() => import("./components/TripPrepView"));
const ExploreAroundView = lazy(() => import("./components/ExploreAroundView"));
const MocChauTodayView = lazy(() => import("./components/MocChauTodayView"));
const CommunityView = lazy(() => import("./components/CommunityView"));
const TripHubView = lazy(() => import("./components/TripHubView"));
const ServicesHubView = lazy(() => import("./components/ServicesHubView"));

import { Booking, AppNotification } from "./types";
import { useFirebaseSync } from "./hooks/useFirebaseSync";
import { auth, db } from "./firebase";
import { signOut } from "firebase/auth";
import { 
  saveBookingToFirebase, 
  updateBookingStatusInFirebase, 
  updateStatusInFirebase,
  saveUserToFirebase,
  saveConfigToFirebase,
  saveNotificationToFirebase,
  updateBookingStatusWithRewards,
  reconcileConfirmedMemberBooking,
  deleteBookingFromFirebase,
  getDeviceId
} from "./lib/firebaseUtils";
import { isOwnerEmail } from "./lib/simpleAuth";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>(()=>
    new URLSearchParams(window.location.search).has('bai-viet')?'guide':
      new URLSearchParams(window.location.search).get('dat-xe')==='1'?'limousine':'explore');
  const [openedGuideArticleId,setOpenedGuideArticleId] = useState<string | null>(()=>
    new URLSearchParams(window.location.search).get('bai-viet'));
  const [adminPin, setAdminPin] = useState("");
  const [adminPinError, setAdminPinError] = useState("");
  useSEO(activeTab);
  const [limousineSubTab, setLimousineSubTab] = useState<"limousine" | "shared" | "charter">("limousine");
  const [isMotorbikeOpen, setIsMotorbikeOpen] = useState(false);
  // Motorbike inquiry. Keep the established Limousine, shared-car and private-charter forms untouched.
  const [motorbikeName, setMotorbikeName] = useState("");
  const [motorbikePhone, setMotorbikePhone] = useState("");
  const [motorbikeType, setMotorbikeType] = useState<"manual" | "scooter">("manual");
  const [motorbikeQuantity, setMotorbikeQuantity] = useState(1);
  const [motorbikeStart, setMotorbikeStart] = useState("");
  const [motorbikeEnd, setMotorbikeEnd] = useState("");
  const [motorbikeDelivery, setMotorbikeDelivery] = useState("");
  const [motorbikeNotes, setMotorbikeNotes] = useState("");
  const [motorbikeDraftSaved, setMotorbikeDraftSaved] = useState(false);
  const [motorbikeSaving, setMotorbikeSaving] = useState(false);
  const [motorbikeError, setMotorbikeError] = useState("");
  const [motorbikeRequestId, setMotorbikeRequestId] = useState("");
  const handleMotorbikeInquiry = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMotorbikeSaving(true);
    setMotorbikeError("");
    try {
      const id = await submitServiceInquiry({
        kind: "motorbike",
        customerName: motorbikeName,
        customerPhone: motorbikePhone,
        bikeType: motorbikeType === "manual" ? "Xe số" : "Xe tay ga",
        quantity: motorbikeQuantity,
        startDate: motorbikeStart,
        endDate: motorbikeEnd,
        deliveryLocation: motorbikeDelivery,
        notes: motorbikeNotes
      });
      setMotorbikeRequestId(id);
      setMotorbikeDraftSaved(true);
    } catch (err: any) {
      setMotorbikeError("Chưa gửi được yêu cầu: " + (err?.message || "Lỗi mạng") + ". Vui lòng thử lại hoặc liên hệ Zalo.");
    } finally {
      setMotorbikeSaving(false);
    }
  };

  // Custom states for notifications
  const {
    currentUser,
    setCurrentUser,
    authReady,
    users,
    bookings,
    allBookings,
    blockedSeats,
    combos,
    setCombos,
    accommodations,
    setAccommodations,
    limousineConfig,
    setLimousineConfig,
    sharedCarConfig,
    setSharedCarConfig,
    coupons,
    setCoupons,
    locations,
    setLocations,
    destinations,
    setDestinations,
    articles,
    setArticles,
    drivers,
    setDrivers,
    zaloGroups,
    setZaloGroups,
    notifications,
    setNotifications
  } = useFirebaseSync();

  // Existing member orders with a Firebase userId sometimes received zero
  // points before the reward implementation. Reconcile on login using a
  // server-read transaction; never infer account ownership from phone only.
  const rewardsReconciledRef=React.useRef<Set<string>>(new Set());
  React.useEffect(()=>{
    if(!authReady || currentUser?.role!=="customer" || !currentUser.id)return;
    const recorded=new Set(currentUser.rewardedBookingIds||[]);
    const eligible=allBookings.filter(b=>b.userId===currentUser.id &&
      (b.status==="success"||b.status==="completed") && !recorded.has(b.id)).slice(0,25);
    eligible.forEach(b=>{
      const key=currentUser.id+":"+b.id;
      if(rewardsReconciledRef.current.has(key))return;
      rewardsReconciledRef.current.add(key);
      void reconcileConfirmedMemberBooking(b.id).catch(err=>
        console.warn("Could not reconcile earlier reward:",err));
    });
  },[authReady,currentUser,allBookings]);

  // Local storage synchronized bookings list
  const [isBookingListOpen, setIsBookingListOpen] = useState(false);
  const [activePaymentBooking, setActivePaymentBooking] = useState<Booking | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [selectedCategoryItem, setSelectedCategoryItem] = useState<any | null>(null);

  // Quick search synchronization states
  // Booking must always have a valid initial search. Before, tapping the QT
  // Limousine tile changed tabs but rendered no booking form because this was null.
  const [limousineSearch, setLimousineSearch] = useState<{ from: string; to: string; date: string; time: string } | null>(()=>({
    from:"Hà Nội",to:"Mộc Châu",
    date:new Date(Date.now()+7*60*60*1000).toISOString().slice(0,10),
    time:"all"
  }));
  const [comboSearch, setComboSearch] = useState<{ hotelId: string; date: string; from?: string; to?: string; time?: string } | null>(null);
  const [confirmedPopupNotif, setConfirmedPopupNotif] = useState<AppNotification | null>(null);
  const [operatorBookingAlert, setOperatorBookingAlert] = useState<AppNotification | null>(null);
  // A booking may arrive through both the notifications and bookings listeners.
  // This set prevents two alerts for the same booking in one operator session.
  const operatorAlertedBookingsRef = React.useRef<Set<string>>(new Set());
  const notifiedIdsRef = React.useRef<Set<string>>(new Set());

  // Web Audio chime helper for notifications
  const playNotificationChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch {
      // Ignore audio synthesis errors on autoplay policy
    }
  };

  // Listen for incoming notifications in real-time
  React.useEffect(() => {
    if (!notifications || notifications.length === 0) return;
    
    // Find unread confirmed notifications that haven't been popped up yet in this session
    const latestConfirmed = notifications.find(
      n => n.type === 'booking_confirmed' && !n.isRead && !notifiedIdsRef.current.has(n.id)
    );

    if (latestConfirmed) {
      notifiedIdsRef.current.add(latestConfirmed.id);
      playNotificationChime();
      sendSystemNotification(latestConfirmed.title, latestConfirmed.message);
      // If customer role or non-operator, pop up immediate visual congratulations
      if (currentUser?.role !== 'operator') {
        setConfirmedPopupNotif(latestConfirmed);
      }
    }
  }, [notifications, currentUser]);

  // Admin: show a prominent alert when a customer booking arrives.
  // Firestore notifications are the primary source; this works across open tabs/devices.
  React.useEffect(() => {
    if (currentUser?.role !== "operator") return;
    const latest = notifications.find(n =>
      n.type === "booking_new" && !n.isRead &&
      Date.now() - new Date(n.timestamp).getTime() < 24 * 60 * 60 * 1000 &&
      !operatorAlertedBookingsRef.current.has(n.metadata?.bookingId || n.id)
    );
    if (!latest) return;
    operatorAlertedBookingsRef.current.add(latest.metadata?.bookingId || latest.id);
    setOperatorBookingAlert(latest);
    playNotificationChime();
    sendSystemNotification(latest.title, latest.message);
  }, [notifications, currentUser?.role]);

  // Backup channel: when the booking document is created but notification write
  // fails, the operator still sees the new order. Skip initial Firestore snapshot
  // so existing bookings are not announced as new.
  React.useEffect(() => {
    if (currentUser?.role !== "operator") {
      operatorAlertedBookingsRef.current.clear();
      return;
    }
    let ready = false;
    const unsubscribe = onSnapshot(collection(db, "bookings"), snapshot => {
      if (!ready) { ready = true; return; }
      const change = snapshot.docChanges().find(({type, doc: entry}) =>
        type === "added" &&
        entry.data()?.status !== "cancelled" &&
        !operatorAlertedBookingsRef.current.has(entry.id)
      );
      if (!change) return;
      const booking = change.doc.data() as Booking;
      operatorAlertedBookingsRef.current.add(change.doc.id);
      const message = `${booking.passengerName} đặt ${booking.routeSelection || booking.type}, ${booking.travelDate} ${booking.departureTime || ""}. ${booking.passengerPhone}`;
      const alert: AppNotification = {
        id: "booking_live_" + change.doc.id,
        title: "🔔 CÓ KHÁCH MỚI ĐẶT VÉ",
        message,
        type: "booking_new",
        isRead: false,
        timestamp: new Date().toISOString(),
        metadata: {
          bookingId: change.doc.id, customerName: booking.passengerName,
          customerPhone: booking.passengerPhone, travelDate: booking.travelDate,
          departureTime: booking.departureTime, route: booking.routeSelection,
          seats: booking.seatNumbers, totalPrice: booking.totalPrice,
        },
      };
      setOperatorBookingAlert(alert);
      playNotificationChime();
      sendSystemNotification(alert.title, message);
    }, error => console.warn("Admin booking alert subscription failed:", error));
    return unsubscribe;
  }, [currentUser?.role]);

  // Set App Badge when notifications change
  React.useEffect(() => {
    if ("setAppBadge" in navigator) {
      const unreadCount = notifications.filter(n => !n.isRead).length;
      if (unreadCount > 0) {
        (navigator as any).setAppBadge(unreadCount).catch(console.error);
      } else {
        (navigator as any).clearAppBadge().catch(console.error);
      }
    }
  }, [notifications]);

  const requestNotificationPermission = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isStandalone = (window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches;
    
    if (!("Notification" in window)) {
      if (isIOS) {
        if (isStandalone) {
          alert("Trình duyệt không hỗ trợ thông báo. Vui lòng kiểm tra:\n1. iOS phải từ 16.4 trở lên.\n2. Không sử dụng Tab ẩn danh.\n3. Hãy thử khởi động lại điện thoại.");
        } else {
          alert("Để nhận thông báo và hiện SỐ ĐỎ (Badge) trên màn hình chính:\n1. Nhấn nút Chia sẻ (hình vuông mũi tên lên) ở dưới trình duyệt.\n2. Chọn 'Thêm vào màn hình chính' (Add to Home Screen).\n3. Mở ứng dụng từ màn hình chính và thử lại.");
        }
      } else {
        alert("Trình duyệt này không hỗ trợ thông báo. Hãy sử dụng Chrome hoặc Safari phiên bản mới nhất để nhận thông báo và hiện số badge trên icon.");
      }
      return;
    }

    if (Notification.permission === "denied") {
      alert("Thông báo hiện đang bị CHẶN. Vui lòng:\n1. Vào Cài đặt điện thoại/Trình duyệt.\n2. Tìm app 'Xe Đi Mộc Châu'.\n3. Bật 'Cho phép thông báo'.");
      return;
    }

    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        new Notification("Đã bật thông báo thành công", {
          body: "Bạn sẽ là người đầu tiên biết khi có khách đặt vé mới!",
          icon: "/brand-xedimocchau-icon-192.png",
          tag: "welcome-notification"
        });
      } else if (permission === "denied") {
        alert("Thông báo đã bị từ chối. Bạn sẽ không nhận được tin nhắn khi có lịch đặt mới.");
      }
    }).catch(err => {
      console.error("Notification permission error:", err);
      alert("Có lỗi xảy ra khi cài đặt thông báo. Vui lòng kiểm tra lại trình duyệt của bạn.");
    });
  };

  const sendSystemNotification = (title: string, message: string) => {
    try {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(title, {
          body: message,
          icon: "/brand-xedimocchau-icon-192.png"
        });
      }
    } catch (error) {
      console.warn("Failed to send system notification:", error);
    }
  };

  const handleAddBooking = async (booking: Booking) => {
    try {
      if (currentUser && currentUser.id) {
         booking.userId = currentUser.id;
      }
      await saveBookingToFirebase(booking);
      // Keep a bounded copy of this successful booking on the same phone.
      // Do not store bookings that the server rejected.
      rememberDeviceBooking(booking);

      // Create Notification
      const notifTitle = "KHÁCH MỚI ĐẶT VÉ";
      const notifMessage = `${booking.passengerName} vừa đặt chuyến ${booking.routeSelection || booking.type} vào lúc ${booking.departureTime || ''} ngày ${booking.travelDate}.`;

      const newNotif: AppNotification = {
        id: `notif_booking_${booking.id}`,
        title: notifTitle,
        message: notifMessage,
        timestamp: new Date().toISOString(),
        type: "booking_new",
        isRead: false,
        deviceId: getDeviceId(),
        metadata: {
          bookingId: booking.id,
          customerName: booking.passengerName,
          // Avoid duplicating customers' phone numbers in the broadly readable
          // legacy notifications collection. Operator can read it from booking.
          travelDate: booking.travelDate,
          departureTime: booking.departureTime,
          route: booking.routeSelection,
          seats: booking.seatNumbers,
          totalPrice: booking.totalPrice
        }
      };
      
      setNotifications([newNotif, ...notifications].slice(0, 50));
      await saveNotificationToFirebase(newNotif);

      // Send system level notification for operator
      if (currentUser?.role === "operator") {
        sendSystemNotification(notifTitle, notifMessage);
      }
    } catch (error) {
      console.error("Critical error in handleAddBooking:", error);
      throw error; // The booking form must not advance to payment if cloud persistence failed.
    }
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      const updated = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
      setNotifications(updated);
      await updateStatusInFirebase(id, { isRead: true }, "notifications");
      console.log("Notification marked as read in Firestore:", id);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const updated = notifications.map(n => ({ ...n, isRead: true }));
      setNotifications(updated);
      
      const batch = writeBatch(db);
      notifications.forEach((n) => {
        if (!n.isRead) {
          batch.update(doc(db, "notifications", n.id), { isRead: true });
        }
      });
      await batch.commit();
      console.log("All notifications marked as read in Firestore");
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      // Optimistic update
      const updated = notifications.filter(n => n.id !== id);
      setNotifications(updated);
      
      await deleteDoc(doc(db, "notifications", id));
      console.log("Notification deleted from Firestore:", id);
    } catch (error) {
      console.error("Failed to delete notification:", error);
      alert("Không thể xóa thông báo. Vui lòng thử lại.");
    }
  };

  const deleteAllNotifications = async () => {
    if (confirm("Bạn có chắc chắn muốn xóa tất cả thông báo?")) {
      try {
        // Optimistic update
        setNotifications([]);
        
        const batch = writeBatch(db);
        notifications.forEach((n) => {
          batch.delete(doc(db, "notifications", n.id));
        });
        await batch.commit();
        console.log("All notifications deleted from Firestore");
      } catch (error) {
        console.error("Failed to delete all notifications:", error);
        alert("Không thể xóa toàn bộ thông báo. Vui lòng thử lại.");
      }
    }
  };

  const handleCancelBooking = async (id: string) => {
    const bk = bookings.find(b => b.id === id);
    if (bk) {
       await updateBookingStatusWithRewards(id,"cancelled");
    }
  };

  const handleDeleteBooking = async (id: string) => {
    await deleteBookingFromFirebase(id);
    forgetDeviceBooking(id);
  };

  const handleConfirmPaymentSuccess = async (id: string, newTotal?: number) => {
    console.log("Deposit payment reported for booking:", id, "New Price:", newTotal);
    const bk = bookings.find(b => b.id === id) || allBookings.find(b => b.id === id);
    if (!bk) return;
    
    // Record payment report flag while strictly maintaining pending status until Admin verifies
    const bookingToUpdate: Booking = {
      ...bk,
      paymentReported: true,
      paymentReportedAt: new Date().toISOString(),
    };
    if (newTotal) {
      bookingToUpdate.totalPrice = newTotal;
    }
    await updateBookingStatusInFirebase(id, bookingToUpdate);
  };

  const handleSearchLimousine = (from: string, to: string, date: string, time: string = "all", pickup?: string, dropoff?: string) => {
    setLimousineSearch({ from, to, date, time, pickup, dropoff });
    setActiveTab("limousine");
    // Scroll smoothly to active section
    setTimeout(() => {
      document.getElementById("limousine_booking_section")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSearchCombo = (hotelId: string, date: string, from?: string, to?: string, time?: string, pickup?: string, dropoff?: string) => {
    setComboSearch({ hotelId, date, from, to, time, pickup, dropoff });
    setActiveTab("combo");
    setTimeout(() => {
      document.getElementById("combo_booking_section")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSelectService = (tab: string, subTab?: "limousine" | "shared" | "charter") => {
    setActiveTab(tab);
    if (tab === "limousine") {
      if (subTab) {
        setLimousineSubTab(subTab);
      }
      if (!limousineSearch) {
        // Set default search parameters for convenient instant viewing
        // Select the VN calendar date, not UTC (which can differ near midnight).
        const todayStr = new Date(Date.now()+7*60*60*1000).toISOString().slice(0,10);
        setLimousineSearch({
          from: "Hà Nội",
          to: "Mộc Châu",
          date: todayStr,
          time: "all",
        });
      }
      setTimeout(() => {
        document.getElementById("limousine_booking_section")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else if (tab === "combo") {
      if (!comboSearch) {
        const todayStr = new Date().toISOString().split("T")[0];
        setComboSearch({
          hotelId: "all",
          date: todayStr,
          from: "Hà Nội",
          to: "Mộc Châu",
        });
      }
      setTimeout(() => {
        document.getElementById("combo_booking_section")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 100);
    }
  };

  const openLimousineBooking = () => {
    handleSelectService("limousine", "limousine");
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Firebase signOut error", err);
    }
    localStorage.removeItem("mock_admin_session");
    localStorage.removeItem("xedimocchau_current_user");
    setCurrentUser(null);
    setActiveTab("explore");
  };

  const renderCategoryDirectory = () => {
    const catKey = activeTab.replace("cat:", "");
    let title = "Chuyên mục Mộc Châu";
    let desc = "Thông tin và dịch vụ xác thực tại Mộc Châu";
    let dataList: any[] = [];

    switch (catKey) {
      case "thoi-tiet":
        title = "Thời Tiết Mộc Châu";
        desc = "Cập nhật dự báo thời tiết cao nguyên, nhiệt độ và trang phục gợi ý hàng ngày.";
        dataList = articles;
        break;
      case "mua-hoa":
        title = "Mùa Hoa Mận & Sắc Hoa Tây Bắc";
        desc = "Lịch hoa mận nở rộ tháng 1-2, hoa cải trắng, hoa dã quỳ và các tọa độ săn hoa đẹp nhất.";
        dataList = destinations;
        break;
      case "lich-trinh":
        title = "Lịch Trình & Tour Gợi Ý";
        desc = "Gợi ý lịch trình du lịch Mộc Châu tự túc hoặc cùng gia đình 2N1Đ, 3N2Đ tối ưu chi phí.";
        dataList = articles;
        break;
      case "dia-diem":
        title = "Điểm Tham Quan Nổi Bật";
        desc = "Tổng hợp danh sách các tọa độ check-in sống ảo, đồi chè, thác nước và cầu kính nổi tiếng.";
        dataList = destinations;
        break;
      case "homestay":
        title = "Homestay View Đẹp Mộc Châu";
        desc = "Danh sách homestay nhà sàn, nhà gỗ view đồi chè, thung lũng mận đã được xác thực.";
        dataList = accommodations;
        break;
      case "khach-san":
        title = "Khách Sạn & Resort Cao Cấp";
        desc = "Hệ thống khách sạn từ 3 đến 5 sao tại trung tâm thị trấn Mộc Châu và Farmstay.";
        dataList = accommodations;
        break;
      case "nha-hang":
        title = "Nhà Hàng & Ẩm Thực Bản Địa";
        desc = "Thưởng thức bê chao, cá suối, gà đồi, trâu gác bếp tại các nhà hàng uy tín hàng đầu.";
        dataList = destinations;
        break;
      case "dac-san":
        title = "Đặc Sản Mộc Châu Làm Quà";
        desc = "Sữa tươi nguyên chất, bánh sữa, mận hậu, chè ô long và các sản phẩm OCOP chính hiệu.";
        dataList = destinations;
        break;
      case "trai-nghiem":
        title = "Trải Nghiệm & Khám Phá";
        desc = "Hái mận tại vườn, cắm trại săn mây, thuê xe máy khám phá các cung đường Tây Bắc.";
        dataList = destinations;
        break;
      case "di-chuyen":
        title = "Di Chuyển & Xe Limousine VIP";
        desc = "Dịch vụ xe Limousine đưa đón tận nơi Hà Nội - Mộc Châu, xe ghép và cho thuê xe máy.";
        dataList = [{ id: 'limo_1', name: 'Xe Limousine VIP 9 Chỗ', description: 'Đón trả tận nhà, ghế massage êm ái, wifi miễn phí.', price: '300.000đ/ghế' }];
        break;
      case "chi-phi":
        title = "Dự Toán Chi Phí Du Lịch";
        desc = "Bảng ước tính chi phí di chuyển, lưu trú, ăn uống và vé tham quan chi tiết cho mọi đối tượng.";
        dataList = [{ id: 'cost_1', name: 'Gói 2N1Đ Tự Túc (Xe + Homestay + Ăn uống)', description: 'Khoảng 1.200.000đ - 1.800.000đ/người.', price: 'Từ 1.2M đ' }];
        break;
      case "ho-tro":
        title = "Hỗ Trợ & Cứu Hộ 24/7";
        desc = "Đội ngũ điều hành nhà xe và hướng dẫn viên túc trực hỗ trợ khẩn cấp trong suốt chuyến đi.";
        dataList = [{ id: 'sup_1', name: 'Hotline Cứu Hộ & Điều Hành', description: 'Gọi ngay 0971.050.324 hoặc Zalo để được hỗ trợ 24/7.', price: 'Miễn phí' }];
        break;
      default:
        dataList = destinations;
    }

    return (
      <CategoryDirectoryView
        categoryKey={catKey}
        categoryTitle={title}
        categoryDescription={desc}
        onBack={() => { setSelectedCategoryItem(null); setActiveTab("explore"); window.scrollTo({top: 0, behavior: "smooth"}); }}
        onSelectBooking={() => setActiveTab("limousine")}
        onOpenItemDetail={(item) => setSelectedCategoryItem(item)}
        items={dataList}
      />
    );
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-between selection:bg-[#1b4332] selection:text-white pb-24 lg:pb-0" id="app_root">
      {/* Platform Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        bookingCount={bookings.filter(b => b.status !== "cancelled").length}
        openBookingList={() => setIsBookingListOpen(true)}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* Hero Banner only shown on home tabs */}
      {(activeTab === "combo" || (activeTab === "limousine" && !limousineSearch)) ? (
        <Hero
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onSearchLimousine={handleSearchLimousine}
          onSearchCombo={handleSearchCombo}
        />
      ) : null}

      {/* Every detail/service page can return to the new Explore homepage. */}
      {!['explore', 'trip', 'community', 'services'].includes(activeTab) && (
        <nav aria-label="Quay về trang chủ" className="bg-white border-b border-emerald-100 px-3 py-2">
          <div className="max-w-7xl mx-auto">
            <button type="button" onClick={() => { setSelectedCategoryItem(null); setActiveTab('explore'); window.scrollTo({top:0,behavior:'smooth'}); }}
              className="inline-flex items-center gap-2 text-sm font-bold text-emerald-800 rounded-xl px-3 py-2 min-h-[44px] hover:bg-emerald-50">
              <ArrowLeft className="w-4 h-4"/><House className="w-4 h-4"/> Quay lại trang chủ
            </button>
          </div>
        </nav>
      )}
      {/* Main Tab Render Switcher */}
      <main className="flex-1">
        <Suspense fallback={
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        }>
          {activeTab.startsWith("cat:") && renderCategoryDirectory()}

          {activeTab === "limousine" && limousineSearch && (
            <BookingSwitcher
              initialSubTab={limousineSubTab}
              onAddBooking={handleAddBooking}
              searchParams={limousineSearch}
              onOpenPayment={setActivePaymentBooking}
              bookings={bookings}
              blockedSeats={blockedSeats}
              currentUser={currentUser}
              coupons={coupons}
              locations={locations}
              limousineConfig={limousineConfig}
              sharedCarConfig={sharedCarConfig}
              onDeductPoints={() => { /* Wallet is updated by an atomic Firestore transaction. */ }}
            />
          )}

          {activeTab === "combo" && comboSearch && (
            <ComboBooking
              combos={combos}
              accommodations={accommodations}
              locations={locations}
              onAddBooking={handleAddBooking}
              searchParams={comboSearch}
              onOpenPayment={setActivePaymentBooking}
              currentUser={currentUser}
              bookings={bookings}
              coupons={coupons}
              onDeductPoints={() => { /* Wallet is updated by an atomic Firestore transaction. */ }}
            />
          )}

          {activeTab === "explore" && <ExploreLanding articles={articles} setActiveTab={tab=>{setOpenedGuideArticleId(null);setActiveTab(tab)}} onOpenArticle={id=>{
            if(SEO_ARTICLE_SLUGS[id]){window.location.assign(articlePublicUrl(id));return;}
            setOpenedGuideArticleId(id);setActiveTab('guide');window.scrollTo({top:0,behavior:'smooth'});
          }} onOpenLimousineBooking={openLimousineBooking} openMotorbike={() => setIsMotorbikeOpen(true)} openAuth={() => setIsAuthOpen(true)} isSignedIn={!!currentUser} />}
          {activeTab === "explore_legacy" && (
            <ExploreMocChau 
              destinations={destinations} 
              currentUser={currentUser}
              onSelectBooking={() => {
                setActiveTab("limousine");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          )}
          {activeTab === "guide" && <TravelGuide articles={articles} initialArticleId={openedGuideArticleId} onBookLimousine={openLimousineBooking} />}
          {activeTab === "ai" && <AIPlanner />}

          {activeTab === "trip" && (
            <TripHubView
              setActiveTab={setActiveTab}
              currentUser={currentUser}
              bookings={bookings}
              accommodations={accommodations}
              destinations={destinations}
              combos={combos}
              locations={locations}
              blockedSeats={blockedSeats}
              limousineConfig={limousineConfig}
              sharedCarConfig={sharedCarConfig}
              coupons={coupons}
              onAddBooking={handleAddBooking}
              onOpenPayment={setActivePaymentBooking}
              onCancelBooking={handleCancelBooking}
              onDeleteBooking={handleDeleteBooking}
              onDeductPoints={() => { /* Wallet is updated by an atomic Firestore transaction. */ }}
              onOpenAuth={() => setIsAuthOpen(true)}
            />
          )}

          {activeTab === "services" && (
            <ServicesHubView
              setActiveTab={setActiveTab}
              accommodations={accommodations}
              combos={combos}
              destinations={destinations}
              currentUser={currentUser}
              onSearchLimousine={handleSearchLimousine}
              onSearchCombo={handleSearchCombo}
              onOpenMotorbikeModal={() => setIsMotorbikeOpen(true)}
            />
          )}

          {activeTab === "trip_prep" && (
            <TripPrepView
              setActiveTab={setActiveTab}
              accommodations={accommodations}
              destinations={destinations}
              combos={combos}
              onSearchLimousine={(from, to, date, time) => {
                setLimousineSearch({ from, to, date, time: time || "06:30" });
                setActiveTab("limousine");
              }}
              onSearchCombo={(hotelId, date, from, to, time) => {
                setComboSearch({ hotelId, date, from, to, time });
                setActiveTab("combo");
              }}
            />
          )}

          {activeTab === "explore_around" && (
            <ExploreAroundView
              setActiveTab={setActiveTab}
              destinations={destinations}
              accommodations={accommodations}
            />
          )}

          {activeTab === "moc_chau_today" && (
            <MocChauTodayView setActiveTab={setActiveTab} />
          )}

          {activeTab === "community" && (
            <CommunityView
              setActiveTab={setActiveTab}
              currentUser={currentUser}
              onOpenAuth={() => setIsAuthOpen(true)}
              zaloGroups={zaloGroups}
            />
          )}

          {activeTab === "member" && currentUser && (
            <CustomerDashboard
              currentUser={currentUser}
              onUpdateUser={(updated) => {
                setCurrentUser(updated);
              }}
              bookings={bookings}
              onCancelBooking={handleCancelBooking}
              onDeleteBooking={handleDeleteBooking}
              onSignOut={handleSignOut}
              onOpenPayment={setActivePaymentBooking}
              coupons={coupons}
            />
          )}

          {activeTab === "operator" && (
            (currentUser?.role === "operator" || isOwnerEmail(currentUser?.email)) ? (
              <>
                <AdminPasswordSetup />
                <OperatorPanel
                  users={users}
                  bookings={allBookings.length > 0 ? allBookings : bookings}
                  onUpdateBookingStatus={async (bookingId, status) => {
                    const targetList = allBookings.length > 0 ? allBookings : bookings;
                    const bk = targetList.find(b => b.id === bookingId) || bookings.find(b => b.id === bookingId);
                    if (bk) {
                      await updateBookingStatusWithRewards(bookingId, status);

                      // Send confirmation notification to customer when status becomes success or completed
                      if ((status === "success" || status === "completed") && bk.status !== "success" && bk.status !== "completed") {
                        const { saveNotificationToFirebase } = await import("./lib/firebaseUtils");
                        const seatInfo = (bk.seatNumbers && bk.seatNumbers.length > 0) 
                          ? `Ghế: ${bk.seatNumbers.join(', ')}` 
                          : (bk.seatCount ? `${bk.seatCount} chỗ` : '');
                        const routeInfo = bk.routeSelection || bk.accommodationName || (bk.type === 'private_charter' ? 'Thuê xe riêng' : 'Vé xe');
                        
                        const confirmNotif: AppNotification = {
                          id: `notif_confirmed_${bk.id}_${Date.now()}`,
                          title: "🎉 ĐẶT VÉ THÀNH CÔNG!",
                          message: `Vé #${(bk.id || "").replace("bk_", "").toUpperCase()} (${routeInfo}) của Quý khách ${bk.passengerName} (${bk.passengerPhone}) đã được Limousine Mộc Châu xác nhận thành công! Chuyến đi: ${bk.travelDate} lúc ${bk.departureTime || ''}. ${seatInfo ? `[${seatInfo}]` : ''}`,
                          timestamp: new Date().toISOString(),
                          type: "booking_confirmed",
                          isRead: false,
                          deviceId: (bk as any).deviceId || "all",
                          targetPhone: bk.passengerPhone,
                          metadata: {
                            bookingId: bk.id,
                            customerName: bk.passengerName,
                            customerPhone: bk.passengerPhone,
                            seats: bk.seatNumbers,
                            travelDate: bk.travelDate,
                            departureTime: bk.departureTime,
                            route: routeInfo,
                            totalPrice: bk.totalPrice,
                            pickupPoint: bk.pickupPoint,
                            dropoffPoint: bk.dropoffPoint
                          }
                        };
                        
                        await saveNotificationToFirebase(confirmNotif);
                      }
                    }
                  }}
                  onDeleteBooking={async (bookingId) => {
                    await deleteBookingFromFirebase(bookingId);
                  }}
                  onBulkDeleteBookings={async (bookingIds) => {
                    for (const id of bookingIds) {
                      await deleteBookingFromFirebase(id);
                    }
                  }}
                  blockedSeats={blockedSeats}
                  onToggleBlockedSeat={async (seatId, travelDate, tripId, lockPhone) => {
                    const seatParams = { seatId, travelDate, tripId, customerPhone: lockPhone };
                    const isBlocked = blockedSeats.find(b => b.seatId === seatId && b.travelDate === travelDate && b.tripId === tripId);
                    if (isBlocked) {
                      import("./lib/firebaseUtils").then(({ deleteBlockedSeatFromFirebase }) => deleteBlockedSeatFromFirebase(isBlocked));
                    } else {
                      import("./lib/firebaseUtils").then(({ saveBlockedSeatToFirebase }) => saveBlockedSeatToFirebase(seatParams));
                    }
                  }}
                  onRemoveBlockedSeat={(seat) => {
                     import("./lib/firebaseUtils").then(({ deleteBlockedSeatFromFirebase }) => deleteBlockedSeatFromFirebase(seat));
                  }}
                  onSendNotification={async (title, message) => {
                      const { saveNotificationToFirebase } = await import("./lib/firebaseUtils");
                      const newNotif = {
                        id: `admin_notif_${Date.now()}`,
                        title,
                        message,
                        timestamp: new Date().toISOString(),
                        type: "admin_manual",
                        isRead: false,
                        deviceId: "all"
                      };
                      saveNotificationToFirebase(newNotif as any);
                  }}
                  notifications={notifications}
                  onUpdateNotifications={(updated) => { 
                      setNotifications(updated); 
                      saveConfigToFirebase("notifications", updated); 
                  }}
                  combos={combos}
                  onUpdateCombos={async (updated) => { 
                      console.log("Saving combos configuration to Firebase...");
                      setCombos(updated); 
                      await saveConfigToFirebase("combos", updated); 
                      alert("Đã cập nhật danh sách Combo thành công!");
                  }}
                  accommodations={accommodations}
                  onUpdateAccommodations={async (updated) => { 
                      setAccommodations(updated); 
                      await saveConfigToFirebase("accommodations", updated); 
                      alert("Đã cập nhật danh sách Khách sạn thành công!");
                  }}
                  limousineConfig={limousineConfig}
                  onUpdateLimousineConfig={(updated) => { 
                      console.log("Updating Limousine Config:", updated);
                      setLimousineConfig(updated); 
                      saveConfigToFirebase("limousineConfig", updated); 
                  }}
                  sharedCarConfig={sharedCarConfig}
                  onUpdateSharedCarConfig={(updated) => { 
                      setSharedCarConfig(updated); 
                      saveConfigToFirebase("sharedCarConfig", updated); 
                  }}
                  coupons={coupons}
                  onUpdateCoupons={async (updated) => { 
                      setCoupons(updated); 
                      await saveConfigToFirebase("coupons", updated); 
                      alert("Đã cập nhật Mã giảm giá thành công!");
                  }}
                  locations={locations}
                  onUpdateLocations={(updated) => { 
                    console.log("Updating Locations in App...", updated.length);
                    setLocations(updated); 
                    saveConfigToFirebase("locations", updated); 
                  }}
                  destinations={destinations}
                  onUpdateDestinations={async (updated) => { 
                      setDestinations(updated); 
                      await saveConfigToFirebase("destinations", updated); 
                      alert("Đã cập nhật Điểm đến thành công!");
                  }}
                  articles={articles}
                  onUpdateArticles={async (updated) => { 
                      setArticles(updated); 
                      await saveConfigToFirebase("articles", updated); 
                      alert("Đã cập nhật Bài viết thành công!");
                  }}
                  drivers={drivers}
                  onUpdateDrivers={async (updated) => {
                      setDrivers(updated);
                      await saveConfigToFirebase("drivers", updated);
                  }}
                  zaloGroups={zaloGroups}
                  onUpdateZaloGroups={async (updated) => {
                      setZaloGroups(updated);
                      const { saveZaloGroupToFirebase } = await import("./lib/firebaseUtils");
                      for (const g of updated) {
                        await saveZaloGroupToFirebase(g);
                      }
                      alert("Đã cập nhật danh sách nhóm Zalo cộng đồng thành công!");
                  }}
                />
              </>
            ) : (
              <div className="max-w-md mx-auto my-12 p-6 sm:p-8 bg-white rounded-3xl border border-stone-200 shadow-xl text-center">
                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#1b4332]">
                  <ShieldCheck className="w-8 h-8 text-emerald-800" />
                </div>
                <h2 className="text-xl font-black text-[#1b4332]">Bảng Điều Hành Mộc Châu Travel</h2>
                <p className="text-xs text-stone-500 mt-2 leading-relaxed">
                  Đăng nhập tài khoản Quản trị (Admin / Chủ xe) hoặc nhập Mã PIN để mở khóa trang điều hành.
                </p>
                
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (adminPin.trim() === "123456" || adminPin.trim() === "mocchau2026" || adminPin.trim() === "nhaxe@mocchau.vn") {
                      const opUser = currentUser 
                        ? { ...currentUser, role: "operator" as const }
                        : { id: "op_unlocked", name: "Quản trị viên", email: "nhaxe@mocchau.vn", phone: "0971050324", points: 0, role: "operator" as const };
                      setCurrentUser(opUser);
                      localStorage.setItem("xedimocchau_current_user", JSON.stringify(opUser));
                      setAdminPin("");
                      setAdminPinError("");
                    } else {
                      setAdminPinError("Mã PIN hoặc Mật khẩu Quản trị không chính xác.");
                    }
                  }} 
                  className="mt-5 space-y-3"
                >
                  <div className="text-left">
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Mã PIN / Mật khẩu Quản trị *
                    </label>
                    <input 
                      type="password" 
                      required 
                      value={adminPin} 
                      onChange={e => setAdminPin(e.target.value)} 
                      placeholder="Nhập 123456 hoặc mật khẩu Admin" 
                      className="w-full p-3 border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>
                  {adminPinError && <p className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-lg text-left">{adminPinError}</p>}
                  <button type="submit" className="w-full py-3 bg-[#1b4332] text-white rounded-xl font-bold text-sm hover:bg-emerald-900 transition">
                    Mở khóa Quản lý
                  </button>
                </form>

                <div className="mt-5 pt-4 border-t border-stone-100 flex flex-col gap-2">
                  <span className="text-xs text-stone-500 font-medium">Hoặc đăng nhập bằng tài khoản Google / Email Quản trị:</span>
                  <button 
                    type="button" 
                    onClick={() => setIsAuthOpen(true)} 
                    className="w-full py-2.5 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl font-bold text-xs hover:bg-emerald-100 transition"
                  >
                    Đăng nhập Tài khoản Quản trị
                  </button>
                </div>
              </div>
            )
          )}
        </Suspense>
      </main>

      {/* Platform Footer */}
      <Footer 
        setActiveTab={setActiveTab} 
        onSelectService={handleSelectService}
        onOpenMotorbike={() => setIsMotorbikeOpen(true)}
      />

      {/* Modal - Live Auth registration and logins */}
      <Suspense fallback={null}>
        <AuthModal
          users={users}
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            localStorage.setItem("xedimocchau_current_user", JSON.stringify(user));
            if (user.role === "operator") {
              setActiveTab("operator");
            } else {
              setActiveTab("member");
            }
          }}
        />
      </Suspense>

      {/* Modal - My Bookings Ticket list */}
      <Suspense fallback={null}>
        <BookingList
          bookings={bookings}
          allBookings={allBookings}
          currentUser={currentUser}
          isOpen={isBookingListOpen}
          onClose={() => setIsBookingListOpen(false)}
          onCancelBooking={handleCancelBooking}
          onDeleteBooking={handleDeleteBooking}
        />
      </Suspense>

      {/* Modal - VietQR Payment gateway instruction */}
      <Suspense fallback={null}>
        <PaymentModal
          booking={activePaymentBooking}
          onClose={(wasSuccessful) => {
            setActivePaymentBooking(null);
            if (wasSuccessful) {
              window.location.reload();
            } else {
              setIsBookingListOpen(true);
            }
          }}
          onConfirmSuccess={handleConfirmPaymentSuccess}
          coupons={coupons}
        />
      </Suspense>

      {/* Floating fast support buttons */}
      <FloatingContact />
      <AIChatWidget hideLauncher onOpenLimousine={openLimousineBooking} onOpenAIPlanner={() => setActiveTab("ai")} />

      {/* Mobile Fixed Bottom Navigation Bar */}
      <BottomNavigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openBookingList={() => setIsBookingListOpen(true)}
        bookingCount={bookings.filter(b => b.status !== "cancelled").length}
      />

      {currentUser?.role === "operator" && (
        <NotificationCenter 
          notifications={notifications} 
          onMarkAsRead={markNotificationAsRead}
          onMarkAllAsRead={markAllNotificationsAsRead}
          onDeleteNotification={deleteNotification}
          onDeleteAll={deleteAllNotifications}
          onRequestPermission={requestNotificationPermission}
        />
      )}

      {/* Modal - Motorbike Rental Info */}
      {isMotorbikeOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-left">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-100 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-[#1b4332] text-white p-6 relative shrink-0">
              <button 
                onClick={() => setIsMotorbikeOpen(false)}
                className="absolute top-4 right-4 text-white/80 hover:text-white text-xl font-bold bg-white/10 w-8 h-8 rounded-full flex items-center justify-center"
              >
                ✕
              </button>
              <span className="text-xs bg-amber-400 text-stone-900 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                🛵 GIAO XE TẬN NƠI MIỄN PHÍ
              </span>
              <h3 className="text-xl font-extrabold tracking-tight mt-2 text-white">
                Thuê Xe Máy Chinh Phục Mộc Châu
              </h3>
              <p className="text-emerald-100 text-xs mt-1 font-sans">
                Tiện lợi, an toàn, hỗ trợ cứu hộ 24/7 trên mọi cung đường Tây Bắc
              </p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-stone-200 rounded-2xl p-3 bg-stone-50 hover:border-emerald-600 transition-colors">
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-md uppercase">Leo dốc tốt</span>
                  <h4 className="font-bold text-stone-800 text-sm mt-1.5">Xe Số (Wave Alpha / RSX)</h4>
                  <p className="text-[11px] text-stone-500 font-sans mt-0.5">Tiết kiệm xăng, khỏe dẻo dai bám đường tốt</p>
                  <p className="text-[#1b4332] font-black text-sm mt-2">200.000đ <span className="text-[10px] text-stone-400 font-sans font-normal">/ngày</span></p>
                </div>

                <div className="border border-stone-200 rounded-2xl p-3 bg-stone-50 hover:border-emerald-600 transition-colors">
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-extrabold px-2 py-0.5 rounded-md uppercase">Dễ lái nhất</span>
                  <h4 className="font-bold text-stone-800 text-sm mt-1.5">Xe Ga (Vision / Air Blade)</h4>
                  <p className="text-[11px] text-stone-500 font-sans mt-0.5">Thời thượng, cốp rộng chứa đồ, đi êm ái nhẹ nhàng</p>
                  <p className="text-[#1b4332] font-black text-sm mt-2">200.000đ <span className="text-[10px] text-stone-400 font-sans font-normal">/ngày</span></p>
                </div>
              </div>

              {/* Benefits list */}
              <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 space-y-2 text-xs text-emerald-950">
                <p className="font-extrabold text-stone-800">🎁 Quyền lợi chu đáo đi kèm:</p>
                <ul className="space-y-1.5 list-disc pl-4 font-sans text-stone-700">
                  <li>Giao và nhận xe máy miễn phí tận cửa khách sạn, homestay hoặc bến xe Limousine Mộc Châu.</li>
                  <li>Tặng kèm: 02 mũ bảo hiểm đạt chuẩn, áo mưa tiện lợi, 01 bản đồ du lịch Mộc Châu cầm tay tiện lợi.</li>
                  <li>Thủ tục đơn giản: Chỉ cần ảnh chụp căn cước công dân hoặc bằng lái xe.</li>
                </ul>
              </div>

              {/* Customer inquiry form; local draft until a secured backend is configured. */}
              <form onSubmit={handleMotorbikeInquiry} className="space-y-3 rounded-2xl border border-emerald-100 p-4 bg-white">
                <h4 className="font-extrabold text-base text-[#1b4332]">Gửi yêu cầu thuê xe máy</h4>
                <p className="text-xs text-stone-600">Nhập họ tên và số điện thoại để gửi yêu cầu đến Admin. Chúng tôi sẽ liên hệ xác nhận tình trạng xe và báo giá.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="text-xs font-semibold text-stone-700">Họ và tên <span className="text-red-600">*</span>
                    <input required autoComplete="name" maxLength={100} value={motorbikeName} onChange={e=>{setMotorbikeName(e.target.value);setMotorbikeDraftSaved(false)}} placeholder="Tên người thuê" className="block w-full mt-1 p-3 rounded-xl border border-stone-300 text-sm" />
                  </label>
                  <label className="text-xs font-semibold text-stone-700">Số điện thoại <span className="text-red-600">*</span>
                    <input required type="tel" inputMode="tel" autoComplete="tel" pattern="(?:\+84|84|0)[0-9]{9}" title="Nhập số điện thoại Việt Nam, ví dụ 0912345678" value={motorbikePhone} onChange={e=>{setMotorbikePhone(e.target.value);setMotorbikeDraftSaved(false)}} placeholder="09xxxxxxxx" className="block w-full mt-1 p-3 rounded-xl border border-stone-300 text-sm" />
                  </label>
                  <label className="text-xs font-semibold text-stone-700">Loại xe
                    <select value={motorbikeType} onChange={e=>setMotorbikeType(e.target.value as "manual"|"scooter")} className="block w-full mt-1 p-3 rounded-xl border border-stone-300 text-sm"><option value="manual">Xe số</option><option value="scooter">Xe tay ga</option></select>
                  </label>
                  <label className="text-xs font-semibold text-stone-700">Số xe
                    <input type="number" min={1} max={20} required value={motorbikeQuantity} onChange={e=>setMotorbikeQuantity(Number(e.target.value))} className="block w-full mt-1 p-3 rounded-xl border border-stone-300 text-sm" />
                  </label>
                  <label className="text-xs font-semibold text-stone-700">Ngày nhận <span className="text-red-600">*</span>
                    <input type="date" required value={motorbikeStart} onChange={e=>setMotorbikeStart(e.target.value)} className="block w-full mt-1 p-3 rounded-xl border border-stone-300 text-sm" />
                  </label>
                  <label className="text-xs font-semibold text-stone-700">Ngày trả <span className="text-red-600">*</span>
                    <input type="date" required min={motorbikeStart||undefined} value={motorbikeEnd} onChange={e=>setMotorbikeEnd(e.target.value)} className="block w-full mt-1 p-3 rounded-xl border border-stone-300 text-sm" />
                  </label>
                </div>
                <label className="text-xs font-semibold text-stone-700 block">Địa điểm nhận xe <span className="text-red-600">*</span>
                  <input required value={motorbikeDelivery} onChange={e=>setMotorbikeDelivery(e.target.value)} placeholder="Khách sạn, homestay hoặc địa chỉ" className="block w-full mt-1 p-3 rounded-xl border border-stone-300 text-sm" />
                </label>
                <label className="text-xs font-semibold text-stone-700 block">Ghi chú
                  <textarea rows={2} value={motorbikeNotes} onChange={e=>setMotorbikeNotes(e.target.value)} placeholder="Giờ nhận, yêu cầu giao xe..." className="block w-full mt-1 p-3 rounded-xl border border-stone-300 text-sm" />
                </label>
                <button type="submit" disabled={motorbikeSaving} className="w-full py-3 rounded-xl bg-[#1b4332] text-white text-sm font-bold disabled:opacity-50">{motorbikeSaving ? "Đang gửi..." : "Gửi yêu cầu thuê xe"}</button>
                {motorbikeError && <p role="alert" className="text-xs bg-red-50 border border-red-200 rounded-xl p-3 text-red-800">{motorbikeError}</p>}
                {motorbikeDraftSaved && <p role="status" className="text-xs bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900">Đã tiếp nhận yêu cầu #{motorbikeRequestId.slice(0, 12)}. Admin sẽ liên hệ xác nhận; <strong>chưa phải đơn thuê xe đã xác nhận.</strong></p>}
              </form>

              {/* Action buttons */}
              <div className="flex gap-2 shrink-0 pt-2">
                <a 
                  href="tel:0971050324" 
                  className="flex-1 bg-[#1b4332] text-white py-3 rounded-xl text-xs font-black text-center uppercase tracking-wider hover:bg-emerald-800 transition-colors shadow-md shadow-emerald-900/10"
                >
                  Gọi Ngay: 0971.050.324
                </a>
                <a 
                  href="https://zalo.me/0971050324" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 bg-sky-600 text-white py-3 rounded-xl text-xs font-black text-center uppercase tracking-wider hover:bg-sky-700 transition-colors shadow-md shadow-sky-500/10"
                >
                  Nhắn Tin Zalo Đặt Xe
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* The operator obtains contact details from the booking already shown in
           their dashboard, rather than copying phone numbers into notifications. */}
      {/* Real-time new booking alert for the operator (only while this website is open). */}
      {currentUser?.role === "operator" && operatorBookingAlert && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/60 p-4 text-left" role="dialog" aria-modal="true" aria-label="Có khách mới đặt vé">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="bg-[#1b4332] px-5 py-4 text-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-emerald-100">🔔 THÔNG BÁO ĐƠN HÀNG MỚI</p>
                  <h3 className="mt-1 text-xl font-black">{operatorBookingAlert.title}</h3>
                </div>
                <button type="button" aria-label="Đóng thông báo" className="rounded-lg bg-white/15 px-3 py-1.5" onClick={()=>setOperatorBookingAlert(null)}>✕</button>
              </div>
            </div>
            <div className="space-y-3 p-5">
              <p className="text-sm text-stone-700">{operatorBookingAlert.message}</p>
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-emerald-50 p-3 text-xs">
                <div><span className="block text-stone-500">Khách hàng</span><strong>{operatorBookingAlert.metadata?.customerName || "Khách đặt xe"}</strong></div>
                <div><span className="block text-stone-500">Số điện thoại</span><strong>{(allBookings.find(b=>b.id===operatorBookingAlert.metadata?.bookingId)?.passengerPhone || operatorBookingAlert.metadata?.customerPhone || "Xem trong đơn")}</strong></div>
                <div><span className="block text-stone-500">Ngày đi</span><strong>{operatorBookingAlert.metadata?.travelDate || "Xem trong đơn"}</strong></div>
                <div><span className="block text-stone-500">Giờ đi / Ghế</span><strong>{operatorBookingAlert.metadata?.departureTime || "-"} · {operatorBookingAlert.metadata?.seats?.join(", ") || "-"}</strong></div>
              </div>
              <div className="flex gap-2">
                <button type="button" className="flex-1 rounded-xl bg-[#1b4332] px-3 py-3 text-sm font-bold text-white" onClick={()=>{
                  if(!operatorBookingAlert.id.startsWith("booking_live_")) void markNotificationAsRead(operatorBookingAlert.id);
                  setOperatorBookingAlert(null);
                  setActiveTab("operator");
                  window.scrollTo({top: 0, behavior: "smooth"});
                }}>Xem và xác nhận đơn</button>
                {(allBookings.find(b=>b.id===operatorBookingAlert.metadata?.bookingId)?.passengerPhone || operatorBookingAlert.metadata?.customerPhone) && (
                  <a className="rounded-xl border border-emerald-700 px-3 py-3 text-sm font-bold text-emerald-800" href={`tel:${(allBookings.find(b=>b.id===operatorBookingAlert.metadata?.bookingId)?.passengerPhone || operatorBookingAlert.metadata?.customerPhone || "").replace(/[^0-9+]/g, "")}`}>Gọi khách</a>
                )}
                <button type="button" className="rounded-xl bg-stone-100 px-3 py-3 text-sm font-bold" onClick={()=>setOperatorBookingAlert(null)}>Đóng</button>
              </div>
              <p className="text-[11px] text-stone-500">Âm thanh và thông báo hệ thống có thể bị trình duyệt hạn chế. Cảnh báo này hoạt động khi website đang mở.</p>
            </div>
          </div>
        </div>
      )}
      {/* Real-time Customer Booking Confirmation Popup */}
      {confirmedPopupNotif && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[110] animate-fade-in text-left">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-emerald-100 flex flex-col animate-scale-up">
            <div className="bg-[#1b4332] text-white p-6 relative">
              <button 
                onClick={() => {
                  markNotificationAsRead(confirmedPopupNotif.id);
                  setConfirmedPopupNotif(null);
                }}
                className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
              <span className="text-[10px] bg-emerald-400 text-stone-950 font-black px-3 py-1 rounded-full uppercase tracking-wider">
                🎉 XÁC NHẬN THÀNH CÔNG
              </span>
              <h3 className="text-lg font-black tracking-tight mt-2 text-white">
                {confirmedPopupNotif.title}
              </h3>
              <p className="text-emerald-100 text-xs mt-1 font-sans">
                Limousine Mộc Châu vừa phê duyệt vé đặt của Quý khách!
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 text-xs space-y-2">
                <p className="text-stone-800 font-bold leading-relaxed">
                  {confirmedPopupNotif.message}
                </p>
                {confirmedPopupNotif.metadata && (
                  <div className="pt-2 border-t border-emerald-200/50 grid grid-cols-2 gap-2 text-[11px] text-stone-600">
                    {confirmedPopupNotif.metadata.travelDate && (
                      <div>
                        <span className="text-stone-400 block text-[9px] uppercase font-bold">Ngày & Giờ đi</span>
                        <span className="font-bold text-stone-800">{confirmedPopupNotif.metadata.travelDate} ({confirmedPopupNotif.metadata.departureTime || '-'})</span>
                      </div>
                    )}
                    {confirmedPopupNotif.metadata.seats && confirmedPopupNotif.metadata.seats.length > 0 && (
                      <div>
                        <span className="text-stone-400 block text-[9px] uppercase font-bold">Ghế đã đặt</span>
                        <span className="font-bold text-emerald-800">{confirmedPopupNotif.metadata.seats.join(', ')}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    markNotificationAsRead(confirmedPopupNotif.id);
                    setConfirmedPopupNotif(null);
                    setIsBookingListOpen(true);
                  }}
                  className="flex-1 bg-[#1b4332] text-white py-3 rounded-xl text-xs font-black text-center uppercase tracking-wider hover:bg-emerald-800 transition-colors shadow-md shadow-emerald-900/10 cursor-pointer"
                >
                  Xem Vé Điện Tử
                </button>
                <button
                  onClick={() => {
                    markNotificationAsRead(confirmedPopupNotif.id);
                    setConfirmedPopupNotif(null);
                  }}
                  className="px-4 bg-stone-100 text-stone-700 py-3 rounded-xl text-xs font-bold hover:bg-stone-200 transition-colors cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedCategoryItem && (
        <CategoryItemDetail
          item={selectedCategoryItem}
          categoryTitle="Chi tiết Mộc Châu"
          onClose={() => setSelectedCategoryItem(null)}
          onSelectBooking={() => {
            setSelectedCategoryItem(null);
            setActiveTab("limousine");
          }}
        />
      )}
    </div>
  );
}
