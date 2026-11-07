import React, { useState, useEffect } from "react";
import { Booking, User, Coupon } from "../types";
import {
  Award,
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Ticket,
  Calendar,
  ChevronRight,
  Sparkles,
  History,
  UserCheck,
  LogOut,
  Gift,
  ArrowUpRight,
  CheckCircle,
  Zap,
  Copy,
  Edit,
  Save,
  Compass,
  Star,
  Trash2,
  Hotel,
  Car,
  Tag,
  FileText,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { updatePassword, updateProfile, updateEmail } from "firebase/auth";

import { INITIAL_COMBOS } from "../data/combos";
import {POINT_VALUE_VND, creditedPointsForBooking, eligibleForNextBookingReward, previousConfirmedBookings} from "../lib/loyalty";
import {couponDecision,couponAudienceLabel,memberAge} from "../lib/couponEligibility";
import {normalizeVietnamPhone,rememberPhoneEmail} from "../lib/simpleAuth";

interface CustomerDashboardProps {
  currentUser: User;
  onUpdateUser: (updated: User) => void;
  bookings: Booking[];
  onCancelBooking: (id: string) => void;
  onDeleteBooking?: (id: string) => void;
  onSignOut: () => void;
  onOpenPayment: (booking: Booking) => void;
  coupons?: Coupon[];
}

interface PointTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "plus" | "minus";
}

export default function CustomerDashboard({
  currentUser,
  onUpdateUser,
  bookings,
  onCancelBooking,
  onDeleteBooking,
  onSignOut,
  onOpenPayment,
  coupons = [],
}: CustomerDashboardProps) {
  const [activeSubTab, setActiveSubTab] = useState<
    "profile" | "bookings" | "wallet" | "benefits"
  >("profile");

  // Profile form states
  const [profileName, setProfileName] = useState(currentUser.name);
  const [profileEmail, setProfileEmail] = useState(currentUser.email || "");
  const [profilePhone,setProfilePhone] = useState(currentUser.phone || "");
  const [profileGender,setProfileGender] = useState<User['gender']>(currentUser.gender || 'undisclosed');
  const [profileBirthDate,setProfileBirthDate] = useState(currentUser.birthDate || "");
  const [profileAvatar,setProfileAvatar] = useState(currentUser.avatarDataUrl || "");
  const [savingProfile,setSavingProfile] = useState(false);
  const [profileAddress, setProfileAddress] = useState("");
  const [profileFavPickup, setProfileFavPickup] = useState("");
  const [profileFavDropoff, setProfileFavDropoff] = useState("");

  // Password edit parameters
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Notice notification state
  const [toastMsg, setToastMsg] = useState("");
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Load custom extended profile details from Firebase (injected via currentUser)
  useEffect(() => {
    setProfileName(currentUser.name || "");
    setProfileEmail(currentUser.email || "");
    setProfilePhone(currentUser.phone || "");
    setProfileGender(currentUser.gender || 'undisclosed');
    setProfileBirthDate(currentUser.birthDate || "");
    setProfileAvatar(currentUser.avatarDataUrl || "");
    setProfileAddress(currentUser.address || "");
    setProfileFavPickup(currentUser.favPickup || "");
    setProfileFavDropoff(currentUser.favDropoff || "");
  }, [currentUser]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg("");
    }, 2500);
  };

  const handleAvatarFile = async (file:File|undefined) => {
    if(!file)return;
    if(!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size>3*1024*1024){
      showToast('Chỉ dùng ảnh JPG/PNG/WebP nhỏ hơn 3MB.');return;
    }
    try{
      const url=URL.createObjectURL(file);
      try{
        const img=new Image();
        await new Promise<void>((resolve,reject)=>{
          img.onload=()=>resolve();img.onerror=()=>reject(new Error('Ảnh không hợp lệ'));img.src=url;
        });
        const canvas=document.createElement('canvas');
        canvas.width=180;canvas.height=180;
        const ctx=canvas.getContext('2d');
        if(!ctx)throw new Error('Không thể xử lý ảnh');
        const size=Math.min(img.naturalWidth,img.naturalHeight);
        ctx.drawImage(img,(img.naturalWidth-size)/2,(img.naturalHeight-size)/2,size,size,0,0,180,180);
        const result=canvas.toDataURL('image/jpeg',0.72);
        if(result.length>85_000)throw new Error('Ảnh quá lớn sau khi nén.');
        setProfileAvatar(result);
      }finally{URL.revokeObjectURL(url);}
    }catch(error:any){showToast(error.message||'Không đọc được ảnh đại diện.');}
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if(savingProfile)return;
    if(!profileName.trim()){showToast('Vui lòng nhập họ tên.');return;}
    if(profilePhone.trim() && !normalizeVietnamPhone(profilePhone.trim())){
      showToast('Số điện thoại liên hệ chưa đúng định dạng Việt Nam.');return;
    }
    if(profileBirthDate){
      const date=Date.parse(profileBirthDate);
      const age=memberAge({birthDate:profileBirthDate});
      if(!Number.isFinite(date)||age===null){
        showToast('Vui lòng kiểm tra ngày sinh hợp lệ.');return;
      }
    }
    if(newPassword && (newPassword.length<8 || newPassword!==confirmPassword)){
      showToast('Mật khẩu mới cần ít nhất 8 ký tự và nhập lại trùng khớp.');return;
    }
    if(!auth.currentUser || auth.currentUser.uid!==currentUser.id){
      showToast('Vui lòng đăng nhập Firebase để cập nhật hồ sơ.');return;
    }

    setSavingProfile(true);
    const account=auth.currentUser;
    const updatedFields:Partial<User>={
      name:profileName.trim(),phone:profilePhone.trim(),
      gender:profileGender,birthDate:profileBirthDate,
      avatarDataUrl:profileAvatar,
      address:profileAddress.trim(),
      favPickup:profileFavPickup.trim(),favDropoff:profileFavDropoff.trim()
    };
    try{
      // Never send balance, earned points, roles or password to this profile
      // editor. Only change allowlisted fields to avoid overwriting wallet state.
      await setDoc(doc(db,'users',currentUser.id),updatedFields,{merge:true});
      if(profileName.trim()!==account.displayName)
        await updateProfile(account,{displayName:profileName.trim()});
      if(profileEmail!==account.email && profileEmail)
        await updateEmail(account,profileEmail);
      if(newPassword)await updatePassword(account,newPassword);
      if(profilePhone.trim() && account.emailVerified && account.email)
        rememberPhoneEmail(profilePhone.trim(),account.email);
      onUpdateUser({...currentUser,...updatedFields,email:account.email||currentUser.email});
      setNewPassword('');setConfirmPassword('');
      showToast('Đã lưu hồ sơ thành viên lên hệ thống.');
    }catch(error:any){
      console.error('Profile update failed:',error);
      showToast('Không lưu được đầy đủ: '+(error?.message||'Vui lòng thử lại.'));
    }finally{setSavingProfile(false);}
  };

  // Show only bonuses actually credited in Firestore. Welcome +10 is
  // displayed only when the one-time transaction marker is present.
  const getPointsHistory = (): PointTransaction[] => {
    const history: PointTransaction[] = [];
    if (currentUser.welcomeBonusGranted && currentUser.welcomeBonusPoints) {
      history.push({
        id: 'welcome_' + currentUser.id,
        date: currentUser.welcomeBonusAt?.slice(0,10) || '—',
        description: 'Quà chào mừng thành viên mới',
        amount: currentUser.welcomeBonusPoints,
        type: 'plus'
      });
    }
    const rewarded = Array.isArray(currentUser.rewardedBookingIds)
      ? currentUser.rewardedBookingIds : [];
    rewarded.forEach(id => {
      const b = bookings.find(booking => booking.id === id);
      history.push({
        id:"tx_earn_"+id,date:b?.bookingDate || "—",
        description:(b ? "Điểm thưởng ghế đã xác nhận #" : "Điểm thưởng vé đã xác nhận #")+id.toUpperCase(),
        amount:creditedPointsForBooking(b),type:"plus"
      });
    });
    bookings.forEach(b => {
      if (b.pointsDeducted && b.pointsDeducted>0 && !b.pointsRefunded &&
          b.userId === currentUser.id && b.status!=="cancelled") {
        history.push({
          id:"tx_spend_"+b.id,date:b.bookingDate||"—",
          description:"Giảm giá khi đặt vé #"+b.id.toUpperCase(),
          amount:b.pointsDeducted,type:"minus"
        });
      }
    });
    return history;
  };
  const pointsHistory = getPointsHistory();
  const confirmedOrders = previousConfirmedBookings(currentUser);
  const voucherUnlocked = eligibleForNextBookingReward(currentUser);

  // Tier parameters calculations
  const totalEarnedPoints = currentUser.points;
  let tierName = "Thành viên Đồng (Bronze)";
  let tierColor = "text-amber-700 bg-amber-50 border-amber-200";
  let tierBadge = "🥉 Bronze";
  let nextTierPoints = 150;
  let percentProgress = Math.min(
    100,
    Math.round((totalEarnedPoints / 150) * 100),
  );

  if (totalEarnedPoints >= 1000) {
    tierName = "Đẳng cấp Kim Cương (Diamond)";
    tierColor = "text-sky-850 bg-sky-50 border-sky-300";
    tierBadge = "💎 Diamond VIP";
    percentProgress = 100;
  } else if (totalEarnedPoints >= 350) {
    tierName = "Thành viên Vàng (Gold)";
    tierColor = "text-amber-600 bg-amber-50/80 border-amber-300";
    tierBadge = "🥇 Gold Member";
    nextTierPoints = 1000;
    percentProgress = Math.min(
      100,
      Math.round(((totalEarnedPoints - 350) / 650) * 100),
    );
  } else if (totalEarnedPoints >= 150) {
    tierName = "Thành viên Bạc (Silver)";
    tierColor = "text-slate-600 bg-slate-50 border-slate-200";
    tierBadge = "🥈 Silver Member";
    nextTierPoints = 350;
    percentProgress = Math.min(
      100,
      Math.round(((totalEarnedPoints - 150) / 200) * 100),
    );
  }

  // Filter local user bookings
  const userBookings = bookings.filter(b =>
    b.userId === currentUser.id ||
    (Boolean(currentUser.phone) && b.passengerPhone === currentUser.phone)
  );

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => {
      setCopiedCoupon(null);
    }, 2000);
  };

  // Published coupons from system
  const activeCoupons = coupons.filter(c =>
    couponDecision(c,currentUser,{checkOrder:false}).eligible
  );

  return (
    <div
      className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in"
      id="customer_dashboard_container"
    >
      {/* Dynamic Toast Message */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-stone-900 border border-emerald-500 rounded-2xl shadow-xl flex items-center space-x-2.5 text-xs text-white"
          >
            <CheckCircle className="w-4.5 h-4.5 text-emerald-400" />
            <span className="font-bold">{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column info overview & navigation switches */}
        <div className="lg:col-span-4 space-y-5">
          {/* User profile Summary widget card */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
            {/* Background design accents */}
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800" />

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1b4332] to-[#40916c] flex items-center justify-center text-stone-100 shadow-md mt-4 relative">
              <UserIcon className="w-8 h-8" />
              <div
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center text-[10px] text-white font-extrabold shadow"
                title={tierName}
              >
                ★
              </div>
            </div>

            <h2 className="text-base font-black text-stone-900 mt-4 leading-none">
              {currentUser.name}
            </h2>
            <p className="text-[11px] font-mono text-stone-500 mt-1.5">
              {currentUser.phone}
            </p>

            {(currentUser.avatarDataUrl || auth.currentUser?.photoURL) && (
              <img src={currentUser.avatarDataUrl || auth.currentUser?.photoURL || undefined}
                alt="Ảnh đại diện hội viên" className="w-20 h-20 rounded-full object-cover border-2 border-emerald-200 mx-auto mt-3"/>
            )}
            {/* Membership Tier badge */}
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide mt-3 border ${tierColor}`}
            >
              <Award className="w-3.5 h-3.5 fill-current" />
              <span>{tierBadge}</span>
            </span>

            {/* Loyalty points dashboard details */}
            <div className="w-full grid grid-cols-2 gap-4 mt-6 border-t border-b border-stone-100 py-4">
              <div className="text-center">
                <span className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                  Ví điểm của tôi
                </span>
                <span className="block text-lg font-black font-mono text-emerald-700 mt-1">
                  {currentUser.points} P
                </span>
              </div>
              <div className="text-center border-l border-stone-100">
                <span className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                  Quy đổi tiền mặt
                </span>
                <span className="block text-sm font-black text-[#1b4332] mt-1.5">
                  {(currentUser.points * POINT_VALUE_VND).toLocaleString()}đ
                </span>
              </div>
            </div>

            {currentUser.welcomeBonusGranted && (
              <p className="text-[11px] text-emerald-800 font-bold mt-2">
                🎁 Đã tặng 10 điểm chào mừng khi gia nhập hội viên
              </p>
            )}

            {/* Level requirements progress bar indicator */}
            <div className="w-full mt-4 text-left">
              <div className="flex justify-between items-center text-[10px] font-bold text-stone-500">
                <span>Hạng tiếp theo:</span>
                <span>
                  {totalEarnedPoints} / {nextTierPoints} P
                </span>
              </div>
              <div className="w-full h-2 bg-stone-200 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-600 to-emerald-800 transition-all duration-1000"
                  style={{ width: `${percentProgress}%` }}
                />
              </div>
            </div>

            <button
              onClick={onSignOut}
              className="mt-6 text-xs text-red-600 font-bold hover:text-red-800 hover:underline flex items-center space-x-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Đăng xuất tài khoản</span>
            </button>
          </div>

          {/* Account Sub Navigation tab Buttons list */}
          <div className="bg-white rounded-3xl p-3 border border-stone-200 shadow-sm space-y-1">
            <button
              onClick={() => setActiveSubTab("profile")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                activeSubTab === "profile"
                  ? "bg-emerald-50 text-[#1b4332]"
                  : "text-stone-600 hover:bg-stone-50"
              }`}
            >
              <span className="flex items-center space-x-2.5">
                <UserIcon className="w-4 h-4 text-emerald-600" />
                <span>Hồ sơ khách hành</span>
              </span>
              <ChevronRight className="w-4 h-4 opacity-55" />
            </button>
            <button
              onClick={() => setActiveSubTab("bookings")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                activeSubTab === "bookings"
                  ? "bg-emerald-50 text-[#1b4332]"
                  : "text-stone-600 hover:bg-stone-50"
              }`}
            >
              <span className="flex items-center space-x-2.5">
                <Ticket className="w-4 h-4 text-emerald-600" />
                <span>Vé xe & Combo của tôi</span>
              </span>
              <div className="flex items-center space-x-1.5">
                {userBookings.length > 0 && (
                  <span className="bg-[#1b4332] text-white text-[9px] font-black rounded-full px-1.5 py-0.5 min-w-[16px] text-center">
                    {userBookings.length}
                  </span>
                )}
                <ChevronRight className="w-4 h-4 opacity-55" />
              </div>
            </button>
            <button
              onClick={() => setActiveSubTab("wallet")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                activeSubTab === "wallet"
                  ? "bg-emerald-50 text-[#1b4332]"
                  : "text-stone-600 hover:bg-stone-50"
              }`}
            >
              <span className="flex items-center space-x-2.5">
                <History className="w-4 h-4 text-emerald-600" />
                <span>Ví điểm tích lũy & Ưu đãi</span>
              </span>
              <ChevronRight className="w-4 h-4 opacity-55" />
            </button>
            <button
              onClick={() => setActiveSubTab("benefits")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                activeSubTab === "benefits"
                  ? "bg-emerald-50 text-[#1b4332]"
                  : "text-stone-600 hover:bg-stone-50"
              }`}
            >
              <span className="flex items-center space-x-2.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Đặc quyền Thăng hạng</span>
              </span>
              <ChevronRight className="w-4 h-4 opacity-55" />
            </button>
          </div>
        </div>

        {/* Right column: Tab Display screens content */}
        <div className="lg:col-span-8 bg-white border border-stone-200 rounded-3xl p-6 shadow-sm min-h-[450px]">
          {activeSubTab === "profile" && (
            <div className="space-y-6">
              <div className="border-b border-stone-100 pb-4">
                <h3 className="text-base font-extrabold text-[#1b4332] flex items-center space-x-2">
                  <UserCheck className="w-5.5 h-5.5 text-emerald-600" />
                  <span>Hồ Sơ Thành Viên Xe Đi Mộc Châu</span>
                </h3>
                <p className="text-stone-400 text-[11px] mt-0.5">
                  Cập nhật thông tin nhận vé điện tử, địa chỉ điểm đón trả yêu
                  thích để tối ưu hóa quá trình đặt xe.
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-extrabold text-[#1b4332] uppercase tracking-wide">
                      Họ và tên khách hàng{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500 text-stone-800"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      required
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-extrabold text-[#1b4332] uppercase tracking-wide">
                      Số điện thoại liên hệ
                    </label>
                    <input type="tel" inputMode="tel" autoComplete="tel"
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                      value={profilePhone} onChange={e=>setProfilePhone(e.target.value)}
                      placeholder="09xxxxxxxx" maxLength={18}/>
                    <p className="text-[10px] text-stone-500">Đổi SĐT liên hệ không xác minh quyền sở hữu. Đăng nhập SĐT trên thiết bị mới cần liên kết email.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-extrabold text-[#1b4332] uppercase tracking-wide">
                      Thư điện tử (Email nhận vé)
                    </label>
                    <input
                      type="email"
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500 text-stone-800"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      placeholder="account.member@gmail.com"
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-extrabold text-[#1b4332] uppercase tracking-wide">
                      Địa chỉ nhà riêng
                    </label>
                    <input
                      type="text"
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500 text-stone-800"
                      value={profileAddress}
                      onChange={(e) => setProfileAddress(e.target.value)}
                      placeholder="Số 123, Đường Láng, Hà Nội"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 space-y-3">
                  <h4 className="text-sm font-black text-[#1b4332]">Ảnh đại diện & thông tin cá nhân</h4>
                  <div className="flex flex-wrap items-center gap-4">
                    {profileAvatar || auth.currentUser?.photoURL ? (
                      <img src={profileAvatar || auth.currentUser?.photoURL || undefined}
                        alt="Ảnh đại diện đang chọn" className="w-20 h-20 rounded-full object-cover border-2 border-emerald-200"/>
                    ) : <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center"><UserIcon className="w-9 h-9 text-emerald-700"/></div>}
                    <div className="flex flex-col gap-2">
                      <label className="inline-flex items-center rounded-xl bg-white border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-900 cursor-pointer">
                        Chọn ảnh đại diện
                        <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only"
                          onChange={e=>{void handleAvatarFile(e.target.files?.[0]);e.target.value='';}}/>
                      </label>
                      <button type="button" className="text-xs text-red-600 text-left" onClick={()=>setProfileAvatar('')}>Xóa ảnh đã tải lên</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="text-xs font-bold text-stone-800">Giới tính (không bắt buộc)
                      <select value={profileGender} onChange={e=>setProfileGender(e.target.value as User['gender'])}
                        className="block w-full mt-1 p-3 rounded-xl border border-stone-200 bg-white">
                        <option value="undisclosed">Không muốn cung cấp</option>
                        <option value="male">Nam</option>
                        <option value="female">Nữ</option>
                        <option value="other">Khác</option>
                      </select>
                    </label>
                    <label className="text-xs font-bold text-stone-800">Ngày tháng năm sinh (không bắt buộc)
                      <input type="date" value={profileBirthDate} max={new Date().toISOString().slice(0,10)}
                        onChange={e=>setProfileBirthDate(e.target.value)}
                        className="block w-full mt-1 p-3 rounded-xl border border-stone-200 bg-white"/>
                    </label>
                  </div>
                  <p className="text-xs text-stone-600">Tuổi: {memberAge({birthDate:profileBirthDate})??'Chưa cập nhật'}. Ngày sinh được dùng để xét voucher sinh nhật; giới tính là thông tin tự khai, chỉ dùng để lọc chương trình ưu đãi.</p>
                </div>
                <div className="h-px bg-stone-100 my-2" />

                <div className="border border-dashed border-emerald-200 bg-emerald-50/20 p-4 rounded-2xl space-y-3">
                  <h4 className="text-xs font-extrabold text-[#1b4332] flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>Tùy Chọn Đón Trả Ghi Nhớ Sẵn (Khuyên dùng)</span>
                  </h4>
                  <p className="text-[10px] text-stone-500">
                    * Các tùy chọn này giúp hệ thống tự động điền nhanh điểm đón
                    đưa khi bạn truy cập Đặt xe mới.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5 text-left">
                      <label className="block text-[11px] font-bold text-stone-700">
                        Nơi đón yêu thích tại Hà Nội:
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500 text-stone-800"
                        value={profileFavPickup}
                        onChange={(e) => setProfileFavPickup(e.target.value)}
                        placeholder="Ví dụ: Đại học Bách Khoa Hà Nội"
                      />
                    </div>
                    <div className="space-y-1.5 text-left">
                      <label className="block text-[11px] font-bold text-stone-700">
                        Khách sạn/Homestay lưu trú tại Mộc Châu:
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500 text-stone-800"
                        value={profileFavDropoff}
                        onChange={(e) => setProfileFavDropoff(e.target.value)}
                        placeholder="Ví dụ: Phố Núi Homestay Bản Áng"
                      />
                    </div>
                  </div>
                </div>

                {/* Change Password Input Blocks */}
                <div className="border border-dashed border-stone-200 bg-stone-50/50 p-4 rounded-2xl space-y-3 mt-4">
                  <h4 className="text-xs font-extrabold text-[#1b4332] flex items-center gap-1.5">
                    <Save className="w-4 h-4 text-emerald-600 animate-pulse" />
                    <span>Thay Đổi Mật Khẩu Đăng Nhập (Bảo mật)</span>
                  </h4>
                  <p className="text-[10px] text-stone-500">
                    * Chỉ điền vào các thông tin dưới đây nếu quý khách mong
                    muốn thiết lập lại mật khẩu đăng nhập mới.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5 text-left">
                      <label className="block text-[11px] font-bold text-stone-700">
                        Mật khẩu mới (tối thiểu 6 ký tự):
                      </label>
                      <input
                        type="password"
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500 text-stone-850"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="space-y-1.5 text-left">
                      <label className="block text-[11px] font-bold text-stone-700">
                        Xác nhận lại mật khẩu mới:
                      </label>
                      <input
                        type="password"
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500 text-stone-850"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit" disabled={savingProfile}
                    className="px-5 py-2.5 bg-[#1b4332] hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center space-x-1 shadow transition-all disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingProfile?'Đang lưu...':'Lưu thông tin thành viên'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeSubTab === "bookings" && (
            <div className="space-y-5 text-left">
              <div className="border-b border-stone-100 pb-4">
                <h3 className="text-base font-extrabold text-[#1b4332] flex items-center space-x-2">
                  <Ticket className="w-5.5 h-5.5 text-emerald-600" />
                  <span>Vé Xe & Combo Của Bạn</span>
                </h3>
                <p className="text-stone-400 text-[11px] mt-0.5">
                  Lịch sử hành trình di chuyển thực hiện bởi tài khoản SĐT{" "}
                  <span className="font-mono font-bold text-stone-700">
                    {currentUser.phone}
                  </span>
                  .
                </p>
              </div>

              {userBookings.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-stone-200 rounded-2xl bg-stone-50/50">
                  <Ticket className="w-10 h-10 text-stone-300 mx-auto stroke-1" />
                  <p className="text-xs text-stone-500 font-medium mt-2">
                    Bạn chưa có đặt chỗ nào bằng SĐT này trên hệ thống.
                  </p>
                  <p className="text-[10px] text-stone-400 mt-1">
                    Sử dụng form đặt xe limousine đầu trang để khởi tạo hành
                    trình đầu tiên của bạn!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userBookings.map((bk, idx) => {
                    const isLimo = bk.type === "limousine";
                    const isPastOrInactive = bk.status === "cancelled" || bk.status === "completed" || (() => {
                      try {
                        if (bk.travelDate && typeof bk.travelDate === "string") {
                          let parts: string[] = [];
                          if (bk.travelDate.includes("/")) parts = bk.travelDate.split("/");
                          else if (bk.travelDate.includes("-")) parts = bk.travelDate.split("-");
                          if (parts.length === 3) {
                            const dateObj = parts[0].length === 4 
                              ? new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
                              : new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                            if (dateObj && !isNaN(dateObj.getTime())) {
                              const today = new Date();
                              today.setHours(0,0,0,0);
                              return dateObj < today;
                            }
                          }
                        }
                      } catch(e) {}
                      return false;
                    })();
                    return (
                      <div
                        key={bk.id || `user_bk_${idx}`}
                        className="border border-stone-200 rounded-xl overflow-hidden shadow-xs hover:border-emerald-300 transition-colors"
                      >
                        <div
                          className={`px-4 py-2 text-white font-bold text-[10px] sm:text-xs flex justify-between items-center ${
                            bk.type === "limousine" ? "bg-gradient-to-r from-[#1b4332] to-emerald-800" :
                            bk.type === "shared_car" ? "bg-gradient-to-r from-sky-600 to-sky-700" :
                            "bg-gradient-to-r from-amber-600 to-amber-700"
                          }`}
                        >
                          <span>
                            {bk.type === "limousine" ? "VÉ XE LIMOUSINE VIP" :
                             bk.type === "shared_car" ? "VÉ XE GHÉP 7 CHỖ" :
                             "VOUCHER COMBO XE + PHÒNG"}
                          </span>
                          <span className="font-mono">
                            Mã GD: #
                            {(bk.id || "").substring(0, 8).toUpperCase()}
                          </span>
                        </div>
                        <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                          <div className="md:col-span-3 space-y-2 text-xs">
                            <div className="flex items-center space-x-2 font-black text-stone-850">
                              <Calendar className="w-4 h-4 text-emerald-600 animate-pulse" />
                              <span>
                                {bk.travelDate}{" "}
                                {bk.departureTime && `lúc ${bk.departureTime}`}
                              </span>
                            </div>

                            <div className="space-y-1 text-stone-600 text-[11px] sm:text-xs">
                              <p>
                                <b>Điểm đón:</b> {bk.pickupPoint}
                              </p>
                              <p>
                                <b>Điểm trả:</b> {bk.dropoffPoint}
                              </p>
                              
                              {bk.type === "limousine" && (
                                <p>
                                  <b>Vị trí ghế VIP đã chọn:</b>{" "}
                                  <span className="font-extrabold text-emerald-700 font-mono text-sm">
                                    {bk.seatNumbers?.join(", ")}
                                  </span>
                                </p>
                              )}
                              
                              {bk.type === "shared_car" && (
                                <p>
                                  <b>Số ghế đặt xe ghép:</b>{" "}
                                  <span className="font-extrabold text-sky-700 text-sm">
                                    {bk.seatCount} ghế
                                  </span>
                                </p>
                              )}

                              {bk.type === "combo" && (
                                <div className="mt-2.5 bg-amber-50/50 rounded-xl p-3 border border-amber-100/60 space-y-2 text-stone-700">
                                  {(() => {
                                    const matchedCombo = INITIAL_COMBOS.find((c) => c.id === bk.comboId);
                                    return (
                                      <>
                                        <div className="flex items-center space-x-1.5 text-amber-900 font-extrabold text-[11px] sm:text-xs">
                                          <Gift className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                          <span>Gói Combo: {matchedCombo ? matchedCombo.name : "Voucher Combo Xe Limousine + Phòng Khách Sạn"}</span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] sm:text-[11px] pt-1.5 border-t border-amber-200/30">
                                          <div className="flex items-start space-x-1.5">
                                            <Hotel className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                                            <span>
                                              <b>Resort/Khách sạn:</b> <span className="text-stone-900 font-bold">{bk.accommodationName || "Mường Thanh Luxury / Phoenix Resort"}</span>
                                            </span>
                                          </div>
                                          <div className="flex items-start space-x-1.5">
                                            <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                                            <span>
                                              <b>Phòng lưu trú:</b> <span className="text-stone-950 font-semibold">{bk.roomQuantity}x {bk.roomTypeName} ({bk.nights} Đêm)</span>
                                            </span>
                                          </div>
                                        </div>

                                        <div className="pt-1.5 border-t border-amber-200/30 space-y-1 text-[10px] sm:text-[11px]">
                                          <div className="flex items-start space-x-1.5">
                                            <Car className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                                            <span>
                                              <b>Xe đưa đón khứ hồi:</b> Limousine VIP thương gia Hà Nội <span className="text-stone-400 font-light">⇄</span> Mộc Châu
                                            </span>
                                          </div>
                                          {bk.seatNumbers && bk.seatNumbers.length > 0 && (
                                            <div className="pl-5 flex flex-wrap gap-1">
                                              <span className="font-bold text-stone-500">Mã ghế:</span>
                                              {bk.seatNumbers.map((seat, sIdx) => (
                                                <span key={sIdx} className="bg-emerald-50 text-emerald-800 px-1 py-0.2 rounded font-medium text-[9px] border border-emerald-100">
                                                  {seat}
                                                </span>
                                              ))}
                                            </div>
                                          )}
                                        </div>

                                        {(bk.couponCode || bk.discountAmount || bk.pointsDeducted) && (
                                          <div className="pt-1.5 border-t border-amber-200/30 flex flex-wrap gap-x-3 gap-y-1 text-[9px] text-stone-500">
                                            <span className="flex items-center space-x-1">
                                              <Tag className="w-3.5 h-3.5 text-indigo-500" />
                                              <span><b>Mã:</b> <span className="font-mono text-indigo-700 bg-indigo-50 px-1 rounded font-bold">{bk.couponCode}</span></span>
                                            </span>
                                            {bk.discountAmount && bk.discountAmount > 0 && (
                                              <span><b>Khuyến mại:</b> <span className="text-emerald-700 font-bold font-sans">-{bk.discountAmount.toLocaleString()}đ</span></span>
                                            )}
                                            {bk.pointsDeducted && bk.pointsDeducted > 0 && (
                                              <span><b>Điểm ví:</b> <span className="text-amber-700 font-bold">-{bk.pointsDeducted} P</span></span>
                                            )}
                                          </div>
                                        )}

                                        {bk.notes && (
                                          <div className="pt-1.5 border-t border-amber-200/30 flex items-start space-x-1.5 text-[9px] text-stone-500">
                                            <FileText className="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5" />
                                            <span>
                                              <b>Ghi chú:</b> <span className="italic font-sans text-stone-600">"{bk.notes}"</span>
                                            </span>
                                          </div>
                                        )}
                                      </>
                                    );
                                  })()}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="md:col-span-1 md:border-l border-stone-100 pl-0 md:pl-4 text-center md:text-right space-y-2">
                            <div>
                              <span className="block text-[9px] uppercase font-bold text-stone-400">
                                Thanh toán
                              </span>
                              <span className="block font-mono font-black text-[#1b4332] text-sm sm:text-base">
                                {bk.totalPrice.toLocaleString()}đ
                              </span>
                            </div>

                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                bk.status === "success"
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                  : bk.status === "completed"
                                    ? "bg-blue-50 text-blue-800 border border-blue-200"
                                    : bk.status === "pending"
                                      ? "bg-amber-50 text-amber-800 border border-amber-200"
                                      : "bg-red-50 text-red-800 border border-red-200"
                              }`}
                            >
                              <span>
                                {bk.status === "success"
                                  ? "Đã Xác Nhận"
                                  : bk.status === "completed"
                                    ? "Đã Hoàn Thành"
                                    : bk.status === "pending"
                                      ? "Chờ Thanh Toán"
                                      : "Đã Hủy"}
                              </span>
                            </span>

                            {bk.status === "pending" && (
                              <button
                                onClick={() => onOpenPayment(bk)}
                                className="w-full mt-2 py-1.5 bg-emerald-600 hover:bg-[#1b4332] text-white text-[10px] font-black rounded-lg uppercase tracking-wide transition-colors"
                              >
                                Thanh toán ngay
                              </button>
                            )}

                            {bk.status !== "cancelled" &&
                              bk.status !== "completed" && (
                                <button
                                  onClick={() => {
                                    if (confirmCancelId === bk.id) {
                                      onCancelBooking(bk.id);
                                      showToast(
                                        "Yêu cầu hủy đơn đã gửi tới hệ thống! 🕒",
                                      );
                                      setConfirmCancelId(null);
                                    } else {
                                      setConfirmCancelId(bk.id);
                                      setTimeout(
                                        () => setConfirmCancelId(null),
                                        4000,
                                      );
                                    }
                                  }}
                                  className={`w-full block text-center text-[10px] font-bold pt-2 border-t border-stone-100 mt-2 transition-colors cursor-pointer ${
                                    confirmCancelId === bk.id
                                      ? "text-white bg-red-600 hover:bg-red-700 py-1 rounded-md"
                                      : "text-red-600 hover:text-red-850 hover:underline"
                                  }`}
                                >
                                  {confirmCancelId === bk.id
                                    ? "⚠️ Bấm thêm lần nữa để Hủy vé"
                                    : "Yêu cầu hủy vé"}
                                </button>
                              )}

                            {isPastOrInactive && onDeleteBooking && (
                              <button
                                onClick={() => {
                                  if (confirmDeleteId === bk.id) {
                                    onDeleteBooking(bk.id);
                                    showToast(
                                      "Đã xóa vĩnh viễn vé khỏi lịch sử thành công! 🗑️",
                                    );
                                    setConfirmDeleteId(null);
                                  } else {
                                    setConfirmDeleteId(bk.id);
                                    setTimeout(
                                      () => setConfirmDeleteId(null),
                                      4000,
                                    );
                                  }
                                }}
                                className={`w-full block text-center text-[10px] font-bold pt-2 border-t border-stone-100 mt-2 transition-colors cursor-pointer ${
                                  confirmDeleteId === bk.id
                                    ? "text-white bg-red-650 hover:bg-red-750 py-1 rounded-md"
                                    : "text-red-650 hover:text-red-850 hover:underline"
                                }`}
                              >
                                {confirmDeleteId === bk.id
                                  ? "⚠️ Bấm thêm lần nữa để Xóa"
                                  : "Xóa vé khỏi lịch sử"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeSubTab === "wallet" && (
            <div className="space-y-6 text-left">
              <div className="border-b border-stone-100 pb-4">
                <h3 className="text-base font-extrabold text-[#1b4332] flex items-center space-x-2">
                  <History className="w-5.5 h-5.5 text-emerald-600" />
                  <span>Ví Điểm Tích Lũy & Thẻ Quà Tặng</span>
                </h3>
                <p className="text-stone-400 text-[11px] mt-0.5">
                  Mỗi ghế xe hợp lệ được nhà xe xác nhận sẽ cộng 1 điểm (10 ghế = 10 điểm).
                  Dùng điểm và voucher từ đơn thứ hai, sau khi đơn đầu đã được xác nhận.
                </p>
              </div>

              {/* Point highlights Card bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-[#1b4332] to-[#40916c] p-4 rounded-2xl text-white relative overflow-hidden shadow-sm">
                  <div className="absolute right-3 top-3 opacity-15">
                    <Gift className="w-16 h-16" />
                  </div>
                  <span className="text-[10px] uppercase font-bold text-stone-200 tracking-wider">
                    Số dư khả dụng
                  </span>
                  <div className="flex items-baseline space-x-2 mt-1">
                    <span className="text-2xl font-black font-mono">
                      {currentUser.points}
                    </span>
                    <span className="text-xs font-semibold">điểm VIP</span>
                  </div>
                  <p className="text-[10px] text-stone-100 mt-2 leading-tight">
                    Tương ứng quy đổi:{" "}
                    <strong className="font-mono text-amber-300 font-bold text-xs">
                      {(currentUser.points * POINT_VALUE_VND).toLocaleString()}đ
                    </strong>{" "}
                    khi thanh toán vé trực tuyến.
                  </p>
                </div>

                <div className="bg-emerald-50/50 border border-emerald-200 p-4 rounded-2xl text-stone-700 leading-normal text-xs space-y-2">
                  <span className="font-extrabold text-[#1b4332] flex items-center gap-1">
                    <Zap className="w-4 h-4 text-emerald-600" />
                    Cơ chế hoạt động điểm thưởng:
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-[12px] text-stone-700">
                    <li><b>Thành viên mới:</b> Tặng 10 điểm một lần khi đăng ký hoặc đăng nhập Google lần đầu.</li>
                    <li><b>Lần đặt vé đầu:</b> Giữ điểm chào mừng trong ví; chưa áp mã voucher hay trừ điểm.</li>
                    <li><b>Admin xác nhận đơn:</b> +1 điểm cho mỗi ghế Limousine, xe ghép hoặc combo hợp lệ; đơn 10 ghế được +10 điểm, không cộng trùng.</li>
                    <li><b>Từ lần đặt vé thứ hai:</b> Có thể dùng số điểm đã tích lũy hoặc voucher đang được công bố.</li>
                    <li><b>Quy đổi:</b> 1 điểm = 1.000đ giảm trực tiếp vào vé. Đơn bị hủy hoặc chuyển về chờ xác nhận sẽ thu hồi điểm đã thưởng.</li>
                  </ul>
                  <p className="text-[11px] font-bold text-emerald-800 mt-2">
                    Đơn đã xác nhận: {confirmedOrders} · {voucherUnlocked?"Đã mở quyền dùng voucher":"Voucher sẽ mở sau khi vé đầu tiên được xác nhận"}.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-[#1b4332] uppercase tracking-wider flex items-center gap-1">
                  <Gift className="w-4.5 h-4.5 text-emerald-600" />
                  Danh mục Mã Giảm Giá Công Bố
                </h4>

                {activeCoupons.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-stone-200 rounded-2xl bg-stone-50/50 text-[11px] text-stone-500">
                    Hiện chưa có mã giảm giá nào được công bố.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {activeCoupons.map((cp) => {
                      return (
                        <div
                          key={cp.code}
                          className="border border-emerald-200 hover:border-emerald-500 hover:shadow-sm p-3.5 rounded-2xl flex flex-col justify-between space-y-3 bg-white"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-black text-xs text-[#1b4332] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                {cp.code}
                              </span>
                            </div>
                            <p className="text-[11px] text-stone-600 mt-2 font-bold leading-relaxed whitespace-pre-wrap">
                              Giảm ngay {cp.discountPercentage}% giá trị hóa
                              đơn.
                            </p>
                          </div>

                          <div className="pt-2 flex items-center justify-end">
                            <button
                              onClick={() => { if(voucherUnlocked) handleCopy(cp.code); }}
                              disabled={!voucherUnlocked}
                              title={!voucherUnlocked?"Voucher mở từ đơn thứ hai sau khi vé đầu xác nhận":undefined}
                              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Copy className="w-3.5 h-3.5" /> Sao chép mã
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {copiedCoupon && (
                  <p className="text-[9px] text-emerald-600 text-right font-black mt-2">
                    ✓ Đã copy mã: {copiedCoupon} vào Clipboard của bạn!
                  </p>
                )}
              </div>

              {/* Transactions list history table block */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-extrabold text-[#1b4332] uppercase tracking-wider">
                  Lịch sử giao dịch điểm tích lũy
                </h4>
                <div className="border border-stone-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 text-stone-500 font-extrabold border-b border-stone-200">
                      <tr>
                        <th className="p-3">Ngày</th>
                        <th className="p-3">Nội dung</th>
                        <th className="p-3 text-right">Biến động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {pointsHistory.length===0 && <tr><td colSpan={3} className="p-4 text-center text-stone-500">Chưa có giao dịch điểm thưởng nào được ghi nhận.</td></tr>}
                      {pointsHistory.map((tx) => (
                        <tr key={tx.id} className="hover:bg-stone-50/50">
                          <td className="p-3 font-mono text-stone-500 text-[11px] whitespace-nowrap">
                            {tx.date}
                          </td>
                          <td className="p-3 text-stone-700 leading-normal">
                            {tx.description}
                          </td>
                          <td
                            className={`p-3 text-right font-bold whitespace-nowrap ${
                              tx.type === "plus"
                                ? "text-emerald-700"
                                : "text-red-600"
                            }`}
                          >
                            {tx.type === "plus"
                              ? `+${tx.amount}`
                              : `-${tx.amount}`}{" "}
                            P
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === "benefits" && (
            <div className="space-y-6 text-left">
              <div className="border-b border-stone-100 pb-4">
                <h3 className="text-base font-extrabold text-[#1b4332] flex items-center space-x-2">
                  <Sparkles className="w-5.5 h-5.5 text-emerald-600" />
                  <span>Đặc Quyền Thành Viên Cao Cấp</span>
                </h3>
                <p className="text-stone-400 text-[11px] mt-0.5">
                  Tích cực đặt vé xe đi Mộc Châu càng nhiều, cấp bậc hội viên
                  càng tăng cao, bùng nổ các quà tặng và sự phục vụ chu đáo
                  nhất.
                </p>
              </div>

              {/* Visual Grid representing detailed tiers descriptions */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Bronze */}
                <div className="border border-stone-200 rounded-2xl p-4 bg-white relative">
                  <div className="text-amber-700 font-bold mb-1.5 flex items-center justify-between text-xs">
                    <span>🥉 BRONZE</span>
                    {totalEarnedPoints < 150 && (
                      <Star className="w-3.5 h-3.5 fill-[#1b4332] text-[#1b4332] shrink-0" />
                    )}
                  </div>
                  <span className="text-[10px] text-stone-400">
                    Yêu cầu: 0-149 P
                  </span>
                  <div className="h-px bg-stone-100 my-2" />
                  <ul className="space-y-1.5 text-[10px] text-stone-600 list-disc list-inside">
                    <li>+1 điểm cho mỗi ghế xe sau khi nhà xe xác nhận đơn.</li>
                    <li>Hội viên mới được tặng 10 điểm chào mừng một lần.</li>
                    <li>Từ lần đặt vé thứ hai: 1 điểm giảm 1.000đ.</li>
                  </ul>
                </div>

                {/* Silver */}
                <div
                  className={`border rounded-2xl p-4 bg-white relative ${
                    totalEarnedPoints >= 150 && totalEarnedPoints < 350
                      ? "border-emerald-500 ring-1 ring-emerald-500"
                      : "border-stone-200"
                  }`}
                >
                  <div className="text-slate-600 font-bold mb-1.5 flex items-center justify-between text-xs">
                    <span>🥈 SILVER</span>
                    {totalEarnedPoints >= 150 && totalEarnedPoints < 350 && (
                      <Star className="w-3.5 h-3.5 fill-[#1b4332] text-[#1b4332] shrink-0" />
                    )}
                  </div>
                  <span className="text-[10px] text-stone-400">
                    Yêu cầu: 150-349 P
                  </span>
                  <div className="h-px bg-stone-100 my-2" />
                  <ul className="space-y-1.5 text-[10px] text-stone-600 list-disc list-inside">
                    <li>Tất cả đặc quyền Đồng.</li>
                    <li>
                      Ưu tiên chọn ghế VIP mong muốn miễn phí khi đặt sớm.
                    </li>
                    <li>Voucher chỉ áp dụng nếu có chương trình được công bố.</li>
                  </ul>
                </div>

                {/* Gold */}
                <div
                  className={`border rounded-2xl p-4 bg-white relative ${
                    totalEarnedPoints >= 350 && totalEarnedPoints < 1000
                      ? "border-emerald-500 ring-1 ring-emerald-500"
                      : "border-stone-200"
                  }`}
                >
                  <div className="text-amber-500 font-bold mb-1.5 flex items-center justify-between text-xs">
                    <span>🥇 GOLD</span>
                    {totalEarnedPoints >= 350 && totalEarnedPoints < 1000 && (
                      <Star className="w-3.5 h-3.5 fill-[#1b4332] text-[#1b4332] shrink-0" />
                    )}
                  </div>
                  <span className="text-[10px] text-stone-400">
                    Yêu cầu: 350-999 P
                  </span>
                  <div className="h-px bg-stone-100 my-2" />
                  <ul className="space-y-1.5 text-[10px] text-stone-600 list-disc list-inside">
                    <li>Đặc quyền hội viên Bạc.</li>
                    <li>
                      Miễn phí khăn lạnh, đồ ăn nhẹ cao cấp trên xe limousine.
                    </li>
                    <li>Ưu đãi lưu trú sẽ được thông báo riêng khi có chương trình.</li>
                    <li>Đưa đón tận nơi vượt bán kính 5Km tại Mộc Châu.</li>
                  </ul>
                </div>

                {/* Platinum */}
                <div
                  className={`border rounded-2xl p-4 bg-white relative ${
                    totalEarnedPoints >= 1000
                      ? "border-emerald-500 ring-1 ring-emerald-500"
                      : "border-stone-200"
                  }`}
                >
                  <div className="text-stone-800 font-bold mb-1.5 flex items-center justify-between text-xs">
                    <span>💎 DIAMOND VIP</span>
                    {totalEarnedPoints >= 1000 && (
                      <Star className="w-3.5 h-3.5 fill-[#1b4332] text-[#1b4332] shrink-0" />
                    )}
                  </div>
                  <span className="text-[10px] text-stone-400">
                    Yêu cầu: 1000+ P
                  </span>
                  <div className="h-px bg-stone-100 my-2" />
                  <ul className="space-y-1.5 text-[10px] text-stone-600 list-disc list-inside">
                    <li>Tích điểm theo đúng lịch sử đặt xe đã xác nhận.</li>
                    <li>
                      Hỗ trợ đổi chuyến, lịch khởi hành muộn/sớm MIỄN PHÍ trước
                      12 giờ.
                    </li>
                    <li>Phục vụ đón trả không phụ thu tại trung tâm Hà Nội.</li>
                    <li>Ưu đãi theo từng chương trình được công bố.</li>
                  </ul>
                </div>
              </div>

              {/* Informational reassurance banner details */}
              <div className="bg-stone-50 border border-stone-200 p-4 rounded-2xl text-xs text-stone-500 leading-normal flex items-start gap-3">
                <span className="text-lg">📢</span>
                <span>
                  <b>Lưu ý nâng hạng thành viên:</b> Điểm tích lũy thăng hạng
                  được tính dựa trên số điểm thực tế bạn kiếm được từ việc hoàn
                  thành các chuyến đi đặt trực tuyến bằng Số điện thoại đã liên
                  kết. Hết niên khóa chu kỳ 12 tháng, hạng thành viên sẽ tự động
                  duy trì dựa trên tích lũy tích lũy tối thiểu.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
