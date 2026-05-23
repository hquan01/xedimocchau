import React, { useState } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import BookingSwitcher from "./components/BookingSwitcher";
import ComboBooking from "./components/ComboBooking";
import AIPlanner from "./components/AIPlanner";
import ExploreMocChau from "./components/ExploreMocChau";
import TravelGuide from "./components/TravelGuide";
import BookingList from "./components/BookingList";
import PaymentModal from "./components/PaymentModal";
import FloatingContact from "./components/FloatingContact";
import AuthModal from "./components/AuthModal";
import OperatorPanel from "./components/OperatorPanel";
import CustomerDashboard from "./components/CustomerDashboard";
import NotificationCenter from "./components/NotificationCenter";
import { Booking, AppNotification } from "./types";
import { useFirebaseSync } from "./hooks/useFirebaseSync";
import { auth, db } from "./firebase";
import { signOut } from "firebase/auth";
import { 
  saveBookingToFirebase, 
  updateBookingStatusInFirebase, 
  saveUserToFirebase,
  saveConfigToFirebase,
  saveNotificationToFirebase,
  getDeviceId
} from "./lib/firebaseUtils";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("limousine");
  const [limousineSubTab, setLimousineSubTab] = useState<"limousine" | "shared" | "charter">("limousine");
  const [isMotorbikeOpen, setIsMotorbikeOpen] = useState(false);
  
  // Custom states for notifications
  const {
    currentUser,
    setCurrentUser,
    authReady,
    users,
    bookings,
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
    notifications,
    setNotifications
  } = useFirebaseSync();

  // Local storage synchronized bookings list
  const [isBookingListOpen, setIsBookingListOpen] = useState(false);
  const [activePaymentBooking, setActivePaymentBooking] = useState<Booking | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Quick search synchronization states
  const [limousineSearch, setLimousineSearch] = useState<{ from: string; to: string; date: string; time: string } | null>(null);
  const [comboSearch, setComboSearch] = useState<{ hotelId: string; date: string; from?: string; to?: string; time?: string } | null>(null);

  const requestNotificationPermission = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isStandalone = (window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches;
    
    if (!("Notification" in window)) {
      if (isIOS) {
        if (isStandalone) {
          alert("Trình duyệt không hỗ trợ thông báo. Vui lòng kiểm tra:\n1. iOS phải từ 16.4 trở lên.\n2. Không sử dụng Tab ẩn danh.\n3. Nếu đã 'Thêm vào màn hình chính', hãy thử khởi động lại điện thoại.");
        } else {
          alert("Để nhận thông báo trên iPhone, bạn cần:\n1. Nhấn nút Chia sẻ (hình vuông mũi tên lên) ở dưới trình duyệt.\n2. Chọn 'Thêm vào màn hình chính' (Add to Home Screen).\n3. Mở ứng dụng từ màn hình chính và thử lại.");
        }
      } else {
        alert("Trình duyệt này không hỗ trợ thông báo. Hãy sử dụng Chrome hoặc Safari phiên bản mới nhất.");
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
          icon: "/logo.png",
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
          icon: "/logo.png"
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

      // Create Notification
      const notifTitle = "KHÁCH MỚI ĐẶT VÉ";
      const notifMessage = `${booking.passengerName} vừa đặt chuyến ${booking.routeSelection || booking.type} vào lúc ${booking.departureTime || ''} ngày ${booking.travelDate}.`;

      const newNotif: AppNotification = {
        id: `notif_${Date.now()}`,
        title: notifTitle,
        message: notifMessage,
        timestamp: new Date().toISOString(),
        type: "booking_new",
        isRead: false,
        deviceId: getDeviceId(),
        metadata: {
          bookingId: booking.id,
          customerName: booking.passengerName
        }
      };
      
      setNotifications([newNotif, ...notifications].slice(0, 50));
      saveNotificationToFirebase(newNotif);

      // Send system level notification for operator
      if (currentUser?.role === "operator") {
        sendSystemNotification(notifTitle, notifMessage);
      }
    } catch (error) {
      console.error("Critical error in handleAddBooking:", error);
    }
  };

  const markNotificationAsRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
    setNotifications(updated);
  };

  const clearAllNotifications = () => {
    const updated = notifications.map(n => ({ ...n, isRead: true }));
    setNotifications(updated);
  };

  const handleCancelBooking = async (id: string) => {
    const bk = bookings.find(b => b.id === id);
    if (bk) {
       await updateBookingStatusInFirebase(id, { ...bk, status: "cancelled" });
    }
  };

  const handleConfirmPaymentSuccess = async (id: string, newTotal?: number) => {
    console.log("Payment submitted for booking:", id, "New Price:", newTotal);
    const bk = bookings.find(b => b.id === id);
    if (!bk) return;
    
    // Save new price if applicable
    const bookingToUpdate: Booking = { ...bk };
    if (newTotal) {
      bookingToUpdate.totalPrice = newTotal;
    }
    await updateBookingStatusInFirebase(id, bookingToUpdate);

    // Save used coupon and deducted points logic to current user
    if (currentUser && currentUser.role === "customer") {
      let requiresUpdate = false;
      const userUpdates = { ...currentUser };
      
      if (bk.couponCode && !userUpdates.usedCoupons?.includes(bk.couponCode)) {
         userUpdates.usedCoupons = [...(userUpdates.usedCoupons || []), bk.couponCode];
         requiresUpdate = true;
      }
      
      // if points were deducted, we need to ensure the user object stores it (we already deducted it visually, but verify)
      // Actually we passed userUpdates to setCurrentUser when "Đặt Ngay" is pressed, but they are not saved to Firebase until we do it explicitly.
      // We will save UserToFirebase to ensure usedCoupons is saved.
      if (requiresUpdate) {
         setCurrentUser(userUpdates);
         await saveUserToFirebase(userUpdates.id!, userUpdates);
      }
    }
  };

  const handleSearchLimousine = (from: string, to: string, date: string, time: string = "all") => {
    setLimousineSearch({ from, to, date, time });
    setActiveTab("limousine");
    // Scroll smoothly to active section
    setTimeout(() => {
      document.getElementById("limousine_booking_section")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSearchCombo = (hotelId: string, date: string, from?: string, to?: string, time?: string) => {
    setComboSearch({ hotelId, date, from, to, time });
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
        const todayStr = new Date().toISOString().split("T")[0];
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

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Firebase signOut error", err);
    }
    localStorage.removeItem("mock_admin_session");
    localStorage.removeItem("xedimocchau_current_user");
    setCurrentUser(null);
    setActiveTab("limousine");
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-between selection:bg-[#1b4332] selection:text-white" id="app_root">
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
      {(activeTab === "limousine" || activeTab === "combo") ? (
        <Hero
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onSearchLimousine={handleSearchLimousine}
          onSearchCombo={handleSearchCombo}
        />
      ) : null}

      {/* Main Tab Render Switcher */}
      <main className="flex-1">
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
            onDeductPoints={(deducted) => {
              if (!currentUser || !currentUser.id) return;
              const nextPoints = Math.max(0, currentUser.points - deducted);
              saveUserToFirebase(currentUser.id, { points: nextPoints });
            }}
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
            onDeductPoints={(deducted) => {
              if (!currentUser || !currentUser.id) return;
              const nextPoints = Math.max(0, currentUser.points - deducted);
              saveUserToFirebase(currentUser.id, { points: nextPoints });
            }}
          />
        )}

        {activeTab === "explore" && <ExploreMocChau destinations={destinations} />}
        {activeTab === "guide" && <TravelGuide articles={articles} />}
        {activeTab === "ai" && <AIPlanner />}

        {activeTab === "member" && currentUser && (
          <CustomerDashboard
            currentUser={currentUser}
            onUpdateUser={(updated) => {
              setCurrentUser(updated);
            }}
            bookings={bookings}
            onCancelBooking={handleCancelBooking}
            onSignOut={handleSignOut}
            onOpenPayment={setActivePaymentBooking}
            coupons={coupons}
          />
        )}

        {activeTab === "operator" && currentUser?.role === "operator" && (
          <OperatorPanel
            users={users}
            bookings={bookings}
            onUpdateBookingStatus={async (bookingId, status) => {
              const bk = bookings.find(b => b.id === bookingId);
              if (bk) await updateBookingStatusInFirebase(bookingId, { ...bk, status });
            }}
            onDeleteBooking={async (bookingId) => {
               // Firebase delete
               import("firebase/firestore").then(({ doc, deleteDoc }) => {
                 deleteDoc(doc(db, "bookings", bookingId)).catch(console.error);
               });
            }}
            onBulkDeleteBookings={async (bookingIds) => {
               import("firebase/firestore").then(({ doc, deleteDoc }) => {
                 bookingIds.forEach(id => {
                   deleteDoc(doc(db, "bookings", id)).catch(console.error);
                 });
               });
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
            onUpdateCombos={(updated) => { 
                console.log("Saving combos configuration to Firebase...");
                setCombos(updated); 
                saveConfigToFirebase("combos", updated); 
            }}
            accommodations={accommodations}
            onUpdateAccommodations={(updated) => { 
                setAccommodations(updated); 
                saveConfigToFirebase("accommodations", updated); 
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
            onUpdateCoupons={(updated) => { 
                setCoupons(updated); 
                saveConfigToFirebase("coupons", updated); 
            }}
            locations={locations}
            onUpdateLocations={(updated) => { 
              console.log("Updating Locations in App...", updated.length);
              setLocations(updated); 
              saveConfigToFirebase("locations", updated); 
            }}
            destinations={destinations}
            onUpdateDestinations={(updated) => { 
                setDestinations(updated); 
                saveConfigToFirebase("destinations", updated); 
            }}
            articles={articles}
            onUpdateArticles={(updated) => { 
                setArticles(updated); 
                saveConfigToFirebase("articles", updated); 
            }}
          />
        )}
      </main>

      {/* Platform Footer */}
      <Footer 
        setActiveTab={setActiveTab} 
        onSelectService={handleSelectService}
        onOpenMotorbike={() => setIsMotorbikeOpen(true)}
      />

      {/* Modal - Live Auth registration and logins */}
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

      {/* Modal - My Bookings Ticket list */}
      <BookingList
        bookings={bookings}
        isOpen={isBookingListOpen}
        onClose={() => setIsBookingListOpen(false)}
        onCancelBooking={handleCancelBooking}
      />

      {/* Modal - VietQR Payment gateway instruction */}
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

      {/* Floating fast support buttons */}
      <FloatingContact />

      {currentUser?.role === "operator" && (
        <NotificationCenter 
          notifications={notifications} 
          onMarkAsRead={markNotificationAsRead}
          onClearAll={clearAllNotifications}
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
                  <p className="text-[#1b4332] font-black text-sm mt-2">120.000đ <span className="text-[10px] text-stone-400 font-sans font-normal">/ngày</span></p>
                </div>

                <div className="border border-stone-200 rounded-2xl p-3 bg-stone-50 hover:border-emerald-600 transition-colors">
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-extrabold px-2 py-0.5 rounded-md uppercase">Dễ lái nhất</span>
                  <h4 className="font-bold text-stone-800 text-sm mt-1.5">Xe Ga (Vision / Air Blade)</h4>
                  <p className="text-[11px] text-stone-500 font-sans mt-0.5">Thời thượng, cốp rộng chứa đồ, đi êm ái nhẹ nhàng</p>
                  <p className="text-[#1b4332] font-black text-sm mt-2">150.000đ <span className="text-[10px] text-stone-400 font-sans font-normal">/ngày</span></p>
                </div>

                <div className="border border-stone-200 rounded-2xl p-3 bg-stone-50 hover:border-emerald-600 transition-colors col-span-2">
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-extrabold px-2 py-0.5 rounded-md uppercase">Phượt đèo chuyên nghiệp</span>
                  <div className="flex justify-between items-start mt-1.5">
                    <div>
                      <h4 className="font-bold text-stone-850 text-sm">Xe Côn Tay / XR150 Cào Cào</h4>
                      <p className="text-[11px] text-stone-500 font-sans mt-0.5">Siêu dã chiến, chinh phục Tà Xùa, Chiềng Khoa, Pha Luông</p>
                    </div>
                    <p className="text-[#1b4332] font-black text-sm whitespace-nowrap">250k - 350kđ <span className="text-[10px] text-stone-400 font-sans font-normal">/ngày</span></p>
                  </div>
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
    </div>
  );
}
