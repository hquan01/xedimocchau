import React, { useState, useEffect } from "react";
import { Shield, Lock, Key, Download, Upload, CheckCircle2, AlertTriangle, Clock, UserCheck, RefreshCw } from "lucide-react";

interface AuditLog {
  id: string;
  time: string;
  user: string;
  action: string;
  target: string;
  status: "success" | "warning";
}

const INITIAL_LOGS: AuditLog[] = [
  {
    id: "log-01",
    time: "03/11/2026 09:15",
    user: "hquansl001@gmail.com (Admin)",
    action: "Cập nhật dữ liệu thời tiết live",
    target: "dubaothoitiet.edu.vn/son-la/moc-chau",
    status: "success"
  },
  {
    id: "log-02",
    time: "03/11/2026 08:30",
    user: "hquansl001@gmail.com (Admin)",
    action: "Khóa ghế offline",
    target: "Ghế VIP A3 - Chuyến 07:00",
    status: "success"
  },
  {
    id: "log-03",
    time: "02/11/2026 17:45",
    user: "hquansl001@gmail.com (Admin)",
    action: "Xác nhận cọc vé xe Limousine",
    target: "Mã đơn #QT-88219 (500.000đ)",
    status: "success"
  }
];

export default function SecurityConfigManagement() {
  const [adminPin, setAdminPin] = useState(() => {
    return localStorage.getItem("mocchau_operator_quick_pin") || "2025";
  });
  const [newPin, setNewPin] = useState("");
  const [pinChangeMsg, setPinChangeMsg] = useState<string | null>(null);

  const [logs] = useState<AuditLog[]>(INITIAL_LOGS);

  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length < 4) {
      setPinChangeMsg("Mã PIN phải có ít nhất 4 ký tự.");
      return;
    }
    localStorage.setItem("mocchau_operator_quick_pin", newPin);
    setAdminPin(newPin);
    setNewPin("");
    setPinChangeMsg("Đã cập nhật mã PIN bảo mật nhanh thành công!");
    setTimeout(() => setPinChangeMsg(null), 3000);
  };

  const handleExportFullBackup = () => {
    const backupData: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("mocchau_")) {
        try {
          backupData[key] = JSON.parse(localStorage.getItem(key) || "null");
        } catch {
          backupData[key] = localStorage.getItem(key);
        }
      }
    }
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `MocChau_Travel_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-emerald-700" />
            <h3 className="text-base font-black text-stone-900">Cấu Hình Bảo Mật & Nhật Ký Hệ Thống</h3>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Quản lý mã PIN thao tác nhanh trên mobile, giám sát nhật ký audit logs và xuất bản sao lưu dữ liệu toàn diện.
          </p>
        </div>

        <button
          onClick={handleExportFullBackup}
          className="px-4 py-2.5 bg-[#1b4332] hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Sao Lưu Toàn Bộ Dữ Liệu (JSON)</span>
        </button>
      </div>

      {/* Grid: Quick PIN & Admin Account */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mobile Quick PIN Card */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 text-stone-900">
            <Lock className="w-4 h-4 text-emerald-700" />
            <h4 className="font-black text-sm">Mã PIN Thao Tác Nhanh Trên Điện Thoại</h4>
          </div>
          <p className="text-xs text-stone-500 font-sans">
            Mã PIN dùng để xác thực nhanh quyền quản trị viên khi điều hành xe trên điện thoại di động mà không cần liên tục đăng nhập lại Google.
          </p>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs">
            <span className="text-stone-600 font-medium">Mã PIN hiện tại:</span>
            <span className="font-mono font-black text-emerald-800 tracking-widest text-sm">
              •••• ({adminPin.replace(/./g, "•")})
            </span>
          </div>

          <form onSubmit={handleUpdatePin} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">Thiết lập mã PIN mới (4 - 6 số)</label>
              <input
                type="password"
                maxLength={6}
                value={newPin}
                onChange={e => setNewPin(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="Nhập 4-6 chữ số..."
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono font-bold tracking-widest focus:outline-none focus:border-emerald-600"
              />
            </div>

            {pinChangeMsg && (
              <p className="text-xs text-emerald-700 font-bold">{pinChangeMsg}</p>
            )}

            <button
              type="submit"
              className="px-4 py-2 bg-[#1b4332] text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition-colors cursor-pointer"
            >
              Cập Nhật Mã PIN
            </button>
          </form>
        </div>

        {/* Security & Access Info Card */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 text-stone-900">
            <Key className="w-4 h-4 text-emerald-700" />
            <h4 className="font-black text-sm">Tài Khoản & Quyền Quản Trị</h4>
          </div>
          <p className="text-xs text-stone-500 font-sans">
            Hệ thống xác thực qua Firebase Authentication & Firestore Security Rules.
          </p>

          <div className="space-y-2 text-xs font-sans">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
              <span className="text-[10px] text-emerald-700 font-bold uppercase block">Email Quản Trị Chính</span>
              <strong className="text-emerald-950 font-mono text-sm">hquansl001@gmail.com</strong>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-stone-600">
              <span className="text-[10px] text-stone-400 font-bold uppercase block">Cơ sở dữ liệu Firestore</span>
              <span className="font-mono text-stone-800">ai-studio-5da02826-b6e0-4147-97f8-45e1ee86da73</span>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-emerald-700" />
          <h4 className="font-black text-stone-900 text-sm">Nhật Ký Thao Tác Quản Trị (Audit Logs)</h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 text-[10px] uppercase font-bold">
              <tr>
                <th className="p-3">Thời gian</th>
                <th className="p-3">Tài khoản</th>
                <th className="p-3">Hành động</th>
                <th className="p-3">Đối tượng</th>
                <th className="p-3 text-right">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-sans">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-stone-50/50">
                  <td className="p-3 font-mono text-stone-500">{log.time}</td>
                  <td className="p-3 font-medium text-stone-800">{log.user}</td>
                  <td className="p-3 font-bold text-stone-900">{log.action}</td>
                  <td className="p-3 font-mono text-emerald-800">{log.target}</td>
                  <td className="p-3 text-right">
                    <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Thành công
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
