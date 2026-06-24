import React, { useState } from "react";
import { X, Phone, Lock, User as UserIcon, Mail, Eye, EyeOff } from "lucide-react";
import { motion } from "motion/react";
import { User } from "../types";
import { auth, db, handleFirestoreError, OperationType } from "../firebase";
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  users?: User[];
}

export default function AuthModal({ isOpen, onClose, onLoginSuccess, users = [] }: AuthModalProps) {
  const [authMode, setAuthMode] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOfflineFallback, setShowOfflineFallback] = useState(false);

  if (!isOpen) return null;

  const handleToggleRegister = (mode: "login" | "register" | "forgot") => {
    setAuthMode(mode);
    setEmail("");
    setPassword("");
    setName("");
    setPhone("");
    setErrorMsg("");
    setSuccessMsg("");
    setShowOfflineFallback(false);
  };

  const handleOfflineLogin = () => {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    
    // Determine details
    const isDefaultAdmin = (email.trim() === "0971050324" || email.trim() === "nhaxe@mocchau.vn") && password === "Duyanh18@";
    
    const mockUser: User = isDefaultAdmin ? {
      id: "mock-operator-session-id",
      email: "nhaxe@mocchau.vn",
      name: "Duy Anh (Quản lý Nhà Xe)",
      phone: "0971050324",
      role: "operator",
      points: 9999,
    } : {
      id: "mock-customer-" + Math.random().toString(36).substr(2, 9),
      email: email.trim() || `${phone.trim() || 'khach'}@xedimocchau.vn`,
      name: name.trim() || "Khách Hàng Thử Nghiệm",
      phone: phone.trim() || "0912345678",
      role: "customer",
      points: 20
    };

    localStorage.setItem("mock_admin_session", JSON.stringify(mockUser));
    setSuccessMsg(`[Thử Nghiệm Ngoại Tuyến] Chào mừng ${mockUser.name} đã đăng nhập!`);
    
    setTimeout(() => {
      onLoginSuccess(mockUser);
      onClose();
      // Dispatch update event
      window.dispatchEvent(new Event("xedimocchau_db_update"));
    }, 1200);
  };

  const syncUserToFirestore = async (firebaseUser: any, addPoints: boolean, customName?: string, customPhone?: string) => {
    try {
      const userRef = doc(db, "users", firebaseUser.uid);
      const userSnap = await getDoc(userRef);
      
      let userData: User;
      
      if (userSnap.exists()) {
        userData = userSnap.data() as User;
      } else {
        // Initialize new user metadata
        // For admin auto-grant
        const isOperator = 
          firebaseUser.email === "hquansl001@gmail.com" || 
          firebaseUser.email === "nhaxe@mocchau.vn" || 
          customPhone === "0971050324" || 
          firebaseUser.phoneNumber === "0971050324";
        
        userData = {
          id: firebaseUser.uid,
          email: firebaseUser.email || "",
          name: customName || (firebaseUser.email === "nhaxe@mocchau.vn" ? "Duy Anh (Quản lý Nhà Xe)" : (firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Khách hàng")),
          phone: customPhone || (firebaseUser.email === "nhaxe@mocchau.vn" ? "0971050324" : (firebaseUser.phoneNumber || "")),
          role: isOperator ? "operator" : "customer",
          points: addPoints ? 10 : 0, 
        };
        await setDoc(userRef, userData);
      }
      return userData;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, "users");
      throw error;
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const userData = await syncUserToFirestore(result.user, true);
      
      setSuccessMsg(`Chào mừng ${userData.name} đã đăng nhập!`);
      setTimeout(() => {
        onLoginSuccess(userData);
        onClose();
      }, 1000);
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || "Đăng nhập Google thất bại!");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      if (authMode === "forgot") {
        const inputVal = email.trim();
        if (!inputVal) {
          setErrorMsg("Vui lòng nhập Số điện thoại hoặc Email để tiếp tục.");
          setLoading(false);
          return;
        }

        const { getLocalList, saveUserToFirebase } = await import("../lib/firebaseUtils");
        const localUsersList = getLocalList<User>("users", []);
        const allUsers = [...users, ...localUsersList];
        
        let targetUser = allUsers.find(
          u => u.phone === inputVal || (u.email && u.email.toLowerCase() === inputVal.toLowerCase())
        );

        if (!targetUser) {
          // Create a dynamic user placeholder to allow testing resets immediately even for unsaved accounts
          const isEmail = inputVal.includes("@");
          const phoneVal = isEmail ? "" : inputVal;
          const emailVal = isEmail ? inputVal : `${inputVal}@xedimocchau.vn`;
          
          targetUser = {
            id: "reset-" + Math.random().toString(36).substr(2, 9),
            phone: phoneVal,
            email: emailVal,
            name: "Thành viên " + (phoneVal || inputVal),
            role: "customer",
            points: 20,
            passwordResetToDefault: true,
          };
        } else {
          targetUser = {
            ...targetUser,
            passwordResetToDefault: true,
          };
        }

        // Save user record
        await saveUserToFirebase(targetUser.id, targetUser);

        // If it's a valid email, also request real email reset as premium background fallback
        if (inputVal.includes("@")) {
          try {
            await sendPasswordResetEmail(auth, inputVal);
          } catch (authErr) {
            console.warn("Real email reset not sent (expected if offline/mock configurations exist):", authErr);
          }
        }

        setSuccessMsg(`Khôi phục thành công! Mật khẩu cho tài khoản "${inputVal}" đã được đặt lại thành mặc định: "123456789". Quý khách vui lòng bấm "Quay lại Đăng nhập" bên dưới, sử dụng mật khẩu này, sau đó vào trang cá nhân để đổi mật khẩu mới!`);
        setLoading(false);
        return;
      }

      if (authMode === "login") {
        let loginEmail = email.trim();
        const isDefaultAdmin = (loginEmail === "0971050324" || loginEmail === "nhaxe@mocchau.vn") && password === "Duyanh18@";

        if (isDefaultAdmin) {
          const userData: User = {
            id: "mock-operator-session-id",
            email: "nhaxe@mocchau.vn",
            name: "Duy Anh (Quản lý Nhà Xe)",
            phone: "0971050324",
            role: "operator",
            points: 9999,
          };
          localStorage.setItem("mock_admin_session", JSON.stringify(userData));
          
          import("firebase/firestore").then(({ doc, setDoc }) => {
             setDoc(doc(db, "users", userData.id), userData).catch(console.warn);
          });

          setSuccessMsg("Chào mừng Duy Anh đã đăng nhập thành công quyền Quản Trị Viên!");
          setTimeout(() => {
            onLoginSuccess(userData);
            onClose();
          }, 1000);
          return;
        }

        // Phone bypass authentication
        const { getLocalList } = await import("../lib/firebaseUtils");
        const localUsersList = getLocalList<User>("users", []);
        const allUsers = [...users, ...localUsersList];
        
        const matchedUser = allUsers.find(
          u => u.phone === loginEmail || (u.email && u.email.toLowerCase() === loginEmail.toLowerCase())
        );

        if (matchedUser) {
          const isDefaultResetPassword = password === "123456789" && matchedUser.passwordResetToDefault;
          const isSavedCustomPassword = matchedUser.customPassword && password === matchedUser.customPassword;

          if (isDefaultResetPassword || isSavedCustomPassword) {
            localStorage.setItem("mock_admin_session", JSON.stringify(matchedUser));
            setSuccessMsg(`Chào mừng ${matchedUser.name} đã đăng nhập thành công!`);
            setTimeout(() => {
              onLoginSuccess(matchedUser);
              onClose();
              window.dispatchEvent(new Event("xedimocchau_db_update"));
            }, 1000);
            return;
          } else {
            setErrorMsg("Mật khẩu không chính xác. Vui lòng thử lại!");
            setLoading(false);
            return;
          }
        } else {
          setErrorMsg("Số điện thoại hoặc tài khoản chưa được đăng ký trong hệ thống!");
          setLoading(false);
          return;
        }
      } else {
        const trimmedName = name.trim();
        let regPhone = phone.trim();
        let regEmail = email.trim();

        if (!trimmedName) {
          setErrorMsg("Vui lòng điền Họ tên của bạn.");
          setLoading(false);
          return;
        }

        // If email looks like a phone number (user entered their phone in the email field)
        const isDigitsOnly = /^[0-9+ \(\)-]+$/.test(regEmail);
        if (regEmail && isDigitsOnly) {
          if (!regPhone) {
            regPhone = regEmail;
          }
          regEmail = "";
        }

        if (!regPhone) {
          setErrorMsg("Vui lòng nhập Số điện thoại để đăng ký.");
          setLoading(false);
          return;
        }
        
        if (!regEmail) {
          regEmail = `${regPhone}@xedimocchau.vn`;
        }

        const { getLocalList, saveUserToFirebase } = await import("../lib/firebaseUtils");
        const localUsersList = getLocalList<User>("users", []);
        const allUsers = [...users, ...localUsersList];
        
        // Check if user already exists
        const exists = allUsers.find(
          u => (regPhone && u.phone === regPhone) || (regEmail && u.email && u.email.toLowerCase() === regEmail.toLowerCase())
        );

        if (exists) {
          setErrorMsg("Tài khoản với Số điện thoại này đã tồn tại trong hệ thống. Vui lòng đăng nhập.");
          setLoading(false);
          return;
        }

        const uniqueId = "customer-" + Math.random().toString(36).substr(2, 9);
        const userData: User = {
          id: uniqueId,
          email: regEmail,
          name: trimmedName,
          phone: regPhone,
          role: "customer",
          points: 10,
          customPassword: password, // Store custom secret locally for bypass login
        };
        
        // Write directly to local users storage and sync to Firebase Firestore
        await saveUserToFirebase(uniqueId, userData);

        localStorage.setItem("mock_admin_session", JSON.stringify(userData));
        setSuccessMsg(`Đăng ký thành viên thành công! Tặng bạn 10 điểm (10.000đ) tích lũy.`);
        setTimeout(() => {
          onLoginSuccess(userData);
          onClose();
          window.dispatchEvent(new Event("xedimocchau_db_update"));
        }, 1500);
      }
    } catch (error: any) {
      console.error(error);
      if (error.code === "auth/operation-not-allowed" || error.message?.includes("operation-not-allowed")) {
        setErrorMsg(
          "Lỗi cấu hình Firebase: Phương thức xác thực Email/Password hoặc Đăng nhập ẩn danh hiện chưa được bật trong Firebase Console hệ thống."
        );
        setShowOfflineFallback(true);
      } else {
        setErrorMsg(error.message || "Xác thực thất bại, vui lòng kiểm tra lại thông tin!");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs font-sans">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-100 overflow-hidden"
      >
        <div className="bg-[#1b4332] text-white px-6 py-5 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold">
              {authMode === "register" ? "Đăng Ký Thành Viên" : authMode === "forgot" ? "Khôi Phục Mật Khẩu" : "Đăng Nhập Thành Viên"}
            </h3>
            <p className="text-stone-300 text-xs mt-0.5">
              {authMode === "forgot" ? "Đặt lại mật khẩu mặc định thành 123456789" : "Tích điểm đổi vé, Quản lý chuyến đi"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-600 space-y-3">
              <p className="font-bold leading-normal">{errorMsg}</p>
              {showOfflineFallback && (
                <div className="pt-2.5 border-t border-red-100 flex flex-col gap-2 font-normal text-stone-600 leading-relaxed">
                  <p>
                    <strong>Để sửa lỗi cấu hình vĩnh viễn:</strong>
                  </p>
                  <ol className="list-decimal pl-4 space-y-1 text-stone-500">
                    <li>Mở <a href="https://console.firebase.google.com/project/dappled-loop-b6tp2/authentication/providers" target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline font-semibold">Firebase Console</a></li>
                    <li>Tìm mục <strong>Authentication</strong>, chọn tab <strong>Sign-in method</strong></li>
                    <li>Tìm phương thức <strong>Email/Password</strong>, bật <strong>Enable</strong> và nhấn <strong>Save</strong></li>
                    <li>Nếu cần đăng nhập Quản Trị bằng tài khoản điện thoại mặc định, hãy bật thêm cả <strong>Anonymous Auth</strong> (Đăng nhập ẩn danh)</li>
                  </ol>
                  
                  <div className="pt-2 flex flex-col gap-2">
                    <p className="font-semibold text-stone-700">Hoặc bỏ qua và tiếp tục thử nghiệm ứng dụng ngay dạng Ngoại tuyến (Khuyên dùng):</p>
                    <button
                      type="button"
                      onClick={handleOfflineLogin}
                      className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition-colors shadow-sm cursor-pointer text-center text-xs uppercase tracking-wider"
                    >
                      ⚡ Đăng Nhập Ở Chế Độ Ngoại Tuyến
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-700 leading-relaxed">
              {successMsg}
            </div>
          )}

          {authMode === "login" && (
            <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex justify-between items-center">
              <div>
                <p className="font-extrabold flex items-center gap-1 text-amber-800">
                  🔑 Tài khoản Quản lý nhà xe:
                </p>
                <p className="font-mono mt-0.5 text-stone-600">
                  SĐT: <span className="font-bold text-amber-950">0971050324</span> | Pass: <span className="font-bold text-amber-950">Duyanh18@</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEmail("0971050324");
                  setPassword("Duyanh18@");
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer uppercase shrink-0"
              >
                Nhập nhanh
              </button>
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-4" autoComplete="off">
            {authMode === "register" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs text-stone-700 font-bold block">Họ và tên *</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      type="text"
                      required
                      placeholder="Nguyễn Văn A"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-medium text-stone-800"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-stone-700 font-bold block">Số điện thoại</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      type="tel"
                      placeholder="0912xxxxxx (bắt buộc nếu không điền Email)"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-medium text-stone-800"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className="text-xs text-stone-700 font-bold block">
                {authMode === "register" ? "Email liên hệ" : "Số điện thoại hoặc Email *"}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  required={authMode !== "register"}
                  placeholder={authMode === "register" ? "name@example.com (bắt buộc nếu không điền SĐT)" : "0912xxxxxx hoặc email..."}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-medium text-stone-800"
                />
              </div>
              {authMode === "register" && (
                <p className="text-[10px] text-stone-500 font-semibold leading-normal pt-0.5">
                  (*) Quý khách chỉ cần điền ít nhất Số điện thoại hoặc Email. Hệ thống sẽ hỗ trợ tạo tài khoản ngay lập tức.
                </p>
              )}
            </div>

            {authMode !== "forgot" && (
              <div className="space-y-1.5">
                <label className="text-xs text-stone-700 font-bold block">Mật khẩu *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Mật khẩu của bạn..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    className="w-full pl-9 pr-10 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-medium text-stone-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {authMode === "login" && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => handleToggleRegister("forgot")}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-bold hover:underline cursor-pointer"
                >
                  Quên mật khẩu?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 text-white font-bold rounded-xl transition-colors uppercase text-xs mt-2 ${loading ? 'bg-stone-400' : 'bg-[#1b4332] hover:bg-emerald-800'}`}
            >
              {authMode === "login" ? "Đăng nhập" : authMode === "forgot" ? "Đặt lại mật khẩu mặc định" : "Đăng ký thành viên"}
            </button>
            
            {authMode !== "forgot" && (
              <>
                <div className="py-2 flex items-center text-xs text-stone-400">
                  <div className="flex-1 border-t border-stone-200"></div>
                  <span className="px-2">HOẶC DÙNG</span>
                  <div className="flex-1 border-t border-stone-200"></div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full py-2.5 bg-white border border-stone-200 text-stone-700 font-bold rounded-xl hover:bg-stone-50 transition-colors uppercase text-xs flex justify-center items-center gap-2 cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 0 24 24" width="16">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-1 7.28-2.69l-3.57-2.77c-.99.66-2.26 1.05-3.71 1.05-2.85 0-5.27-1.93-6.14-4.52H2.18v2.86C4.01 20.61 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.86 14.07c-.22-.66-.35-1.37-.35-2.07s.13-1.41.35-2.07V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.83-.64z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.07.56 4.22 1.65l3.17-3.17C17.45 2.09 14.97 1 12 1 7.7 1 4.01 3.39 2.18 7.07l3.68 2.86c.87-2.59 3.29-4.55 6.14-4.55z" fill="#EA4335"/>
                  </svg>
                  Google
                </button>
              </>
            )}

            <div className="text-center text-xs text-stone-500 mt-4 space-y-1">
              {authMode === "forgot" ? (
                <p>
                  <button
                    type="button"
                    onClick={() => handleToggleRegister("login")}
                    className="text-emerald-600 font-bold hover:underline cursor-pointer"
                  >
                    ← Quay lại Đăng nhập
                  </button>
                </p>
              ) : authMode === "login" ? (
                <p>
                  Chưa có tài khoản?{" "}
                  <button
                    type="button"
                    onClick={() => handleToggleRegister("register")}
                    className="text-emerald-600 font-bold hover:underline cursor-pointer"
                  >
                    Đăng ký miễn phí
                  </button>
                </p>
              ) : (
                <p>
                  Đã có tài khoản?{" "}
                  <button
                    type="button"
                    onClick={() => handleToggleRegister("login")}
                    className="text-emerald-600 font-bold hover:underline cursor-pointer"
                  >
                    Đăng nhập ngay
                  </button>
                </p>
              )}
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

