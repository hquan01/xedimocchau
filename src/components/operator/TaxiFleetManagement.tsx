import React, { useState, useEffect } from "react";
import { Car, Plus, Edit2, Trash2, Search, CheckCircle2, AlertCircle, Eye, EyeOff, MapPin, Phone, User, DollarSign, Filter } from "lucide-react";

export interface TaxiVehicle {
  id: string;
  plate: string;
  model: string; // e.g. "Toyota Vios", "Innova 7 chỗ", "Ford Transit 16 chỗ"
  seats: number; // e.g. 4, 5, 7, 9, 12, 16, 29, 45...
  provider: string; // Nhà xe / Tên lái xe đối tác
  phone: string;
  basePrice: number; // Giá km hoặc giá chuyến cố định Mộc Châu
  routeQuote?: string; // e.g. "TT. Mộc Châu ➔ Cầu Kính: 250.000đ"
  serviceArea: string; // e.g. "Trung tâm Mộc Châu & các bản du lịch"
  status: "available" | "busy" | "maintenance";
  isVisible: boolean;
}

export interface TaxiRequest {
  id: string;
  customerName: string;
  customerPhone: string;
  pickupPoint: string;
  dropoffPoint: string;
  seats: number;
  travelDate: string;
  departureTime: string;
  quotedPrice: number;
  assignedVehicleId?: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes?: string;
  createdAt: string;
}

const INITIAL_TAXI_FLEET: TaxiVehicle[] = [
  {
    id: "taxi-01",
    plate: "26A-123.45",
    model: "Toyota Vios 4 chỗ",
    seats: 4,
    provider: "Taxi Xanh Mộc Châu (Anh Hùng)",
    phone: "0971.050.324",
    basePrice: 200000,
    routeQuote: "Nội thành Mộc Châu: 12.000đ/km • Đi Đồi chè: 150.000đ/chuyến",
    serviceArea: "Toàn bộ huyện Mộc Châu & Vân Hồ",
    status: "available",
    isVisible: true
  },
  {
    id: "taxi-02",
    plate: "26B-088.99",
    model: "Toyota Innova 7 chỗ",
    seats: 7,
    provider: "Đội Xe Ghép Mộc Châu (Anh Nam)",
    phone: "0855.368.889",
    basePrice: 350000,
    routeQuote: "TT. Mộc Châu ➔ Thác Dải Yếm: 250.000đ",
    serviceArea: "Mộc Châu, Vân Hồ, Sơn La, Hà Nội",
    status: "available",
    isVisible: true
  },
  {
    id: "taxi-03",
    plate: "26F-009.12",
    model: "Hyundai Solati 16 chỗ",
    seats: 16,
    provider: "Xe Hợp Đồng QT Travel",
    phone: "0971.050.324",
    basePrice: 1500000,
    routeQuote: "Tour trọn gói Mộc Châu 1 ngày: 1.800.000đ",
    serviceArea: "Hà Nội - Mộc Châu - Điểm tham quan",
    status: "available",
    isVisible: true
  }
];

const INITIAL_REQUESTS: TaxiRequest[] = [
  {
    id: "tax-req-01",
    customerName: "Nguyễn Văn Hoàn",
    customerPhone: "0988.112.233",
    pickupPoint: "Khách sạn Muờng Thanh Mộc Châu",
    dropoffPoint: "Thung lũng mận Nà Ka",
    seats: 7,
    travelDate: "2026-11-05",
    departureTime: "08:30",
    quotedPrice: 350000,
    assignedVehicleId: "taxi-02",
    status: "confirmed",
    notes: "Khách gia đình 5 người, đưa đi hái mận",
    createdAt: "2026-11-03 09:00"
  }
];

export default function TaxiFleetManagement() {
  const [activeTab, setActiveTab] = useState<"fleet" | "requests">("fleet");
  
  const [fleet, setFleet] = useState<TaxiVehicle[]>(() => {
    try {
      const saved = localStorage.getItem("mocchau_admin_taxi_fleet");
      return saved ? JSON.parse(saved) : INITIAL_TAXI_FLEET;
    } catch {
      return INITIAL_TAXI_FLEET;
    }
  });

  const [requests, setRequests] = useState<TaxiRequest[]>(() => {
    try {
      const saved = localStorage.getItem("mocchau_admin_taxi_requests");
      return saved ? JSON.parse(saved) : INITIAL_REQUESTS;
    } catch {
      return INITIAL_REQUESTS;
    }
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [seatFilter, setSeatFilter] = useState<string>("all");

  // Form states for vehicle add/edit
  const [editingVehicle, setEditingVehicle] = useState<TaxiVehicle | null>(null);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);

  const [formPlate, setFormPlate] = useState("");
  const [formModel, setFormModel] = useState("");
  const [formSeats, setFormSeats] = useState<number>(7);
  const [formProvider, setFormProvider] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formBasePrice, setFormBasePrice] = useState(250000);
  const [formRouteQuote, setFormRouteQuote] = useState("");
  const [formServiceArea, setFormServiceArea] = useState("");
  const [formStatus, setFormStatus] = useState<TaxiVehicle["status"]>("available");

  // Save fleet to localStorage
  useEffect(() => {
    localStorage.setItem("mocchau_admin_taxi_fleet", JSON.stringify(fleet));
  }, [fleet]);

  // Save requests to localStorage
  useEffect(() => {
    localStorage.setItem("mocchau_admin_taxi_requests", JSON.stringify(requests));
  }, [requests]);

  const handleOpenVehicleModal = (veh?: TaxiVehicle) => {
    if (veh) {
      setEditingVehicle(veh);
      setFormPlate(veh.plate);
      setFormModel(veh.model);
      setFormSeats(veh.seats);
      setFormProvider(veh.provider);
      setFormPhone(veh.phone);
      setFormBasePrice(veh.basePrice);
      setFormRouteQuote(veh.routeQuote || "");
      setFormServiceArea(veh.serviceArea);
      setFormStatus(veh.status);
    } else {
      setEditingVehicle(null);
      setFormPlate("");
      setFormModel("");
      setFormSeats(7);
      setFormProvider("");
      setFormPhone("0971.050.324");
      setFormBasePrice(250000);
      setFormRouteQuote("");
      setFormServiceArea("Trung tâm Mộc Châu & các địa điểm du lịch");
      setFormStatus("available");
    }
    setIsVehicleModalOpen(true);
  };

  const handleSaveVehicle = async () => {
    if (!formPlate.trim() || !formModel.trim()) {
      alert("Vui lòng nhập biển số xe và tên dòng xe!");
      return;
    }

    let updatedFleet: TaxiVehicle[] = [];
    if (editingVehicle) {
      updatedFleet = fleet.map(v => v.id === editingVehicle.id ? {
        ...v,
        plate: formPlate.trim(),
        model: formModel.trim(),
        seats: formSeats,
        provider: formProvider.trim(),
        phone: formPhone.trim(),
        basePrice: Number(formBasePrice) || 0,
        routeQuote: formRouteQuote.trim(),
        serviceArea: formServiceArea.trim(),
        status: formStatus
      } : v);
    } else {
      const newVeh: TaxiVehicle = {
        id: `taxi-${Date.now()}`,
        plate: formPlate.trim(),
        model: formModel.trim(),
        seats: formSeats,
        provider: formProvider.trim() || "Nhà xe đối tác Mộc Châu",
        phone: formPhone.trim() || "0971.050.324",
        basePrice: Number(formBasePrice) || 0,
        routeQuote: formRouteQuote.trim(),
        serviceArea: formServiceArea.trim() || "Mộc Châu",
        status: formStatus,
        isVisible: true
      };
      updatedFleet = [newVeh, ...fleet];
    }

    // Update local state immediately for instant feedback
    setFleet(updatedFleet);
    setIsVehicleModalOpen(false);

    // Sync to Firebase in background
    try {
      const { saveCollectionItemsToFirebase } = await import("../../lib/firebaseUtils");
      await saveCollectionItemsToFirebase("taxi_fleet", updatedFleet);
    } catch (err: any) {
      console.warn("Background Firebase sync failed (saved locally):", err);
    }
  };

  const handleToggleVisible = async (id: string) => {
    const updated = fleet.map(v => v.id === id ? { ...v, isVisible: !v.isVisible } : v);
    setFleet(updated);
    try {
      const { saveCollectionItemsToFirebase } = await import("../../lib/firebaseUtils");
      await saveCollectionItemsToFirebase("taxi_fleet", updated);
    } catch (err: any) {
      console.warn("Background Firebase sync failed:", err);
    }
  };

  const handleDeleteVehicle = async (id: string) => {
      const updated = fleet.filter(v => v.id !== id);
      setFleet(updated);
      try {
        console.log("Attempting to delete vehicle ID:", id);
        const { deleteItemFromCollection } = await import("../../lib/firebaseUtils");
        await deleteItemFromCollection("taxi_fleet", id);
        console.log("Deletion successful.");
      } catch (err: any) {
        console.error("Deletion failed, check Firestore rules:", err);
        alert("Lỗi xóa: " + err.message);
      }
  };

  const handleUpdateRequestStatus = async (reqId: string, status: TaxiRequest["status"]) => {
    const updated = requests.map(r => r.id === reqId ? { ...r, status } : r);
    setRequests(updated);
    try {
      const { saveCollectionItemsToFirebase } = await import("../../lib/firebaseUtils");
      await saveCollectionItemsToFirebase("taxi_requests", updated);
    } catch (err: any) {
      console.warn("Background Firebase sync failed:", err);
    }
  };

  const filteredFleet = fleet.filter(v => {
    const matchSearch = v.plate.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        v.provider.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSeat = seatFilter === "all" || v.seats === Number(seatFilter);
    return matchSearch && matchSeat;
  });

  return (
    <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 sm:p-8 space-y-6 text-left" id="taxi_fleet_management_root">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-200 pb-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-xs font-extrabold text-emerald-800 uppercase tracking-wider mb-1">
            <Car className="w-3.5 h-3.5 text-emerald-600" />
            <span>Đội Xe Taxi & Xe Du Lịch 4 - 7 - 9 - 16 Chỗ</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900">
            Quản trị Taxi & Thuê Xe Du Lịch
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Quản lý danh sách phương tiện, báo giá tuyến đường cố định và tiếp nhận đơn đặt xe du lịch Mộc Châu.
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setActiveTab("fleet")}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === "fleet" ? "bg-[#1b4332] text-white shadow-sm" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            🚘 Danh Sách Đội Xe ({fleet.length})
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer relative ${
              activeTab === "requests" ? "bg-[#1b4332] text-white shadow-sm" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            📋 Đơn Đặt Xe ({requests.length})
          </button>
        </div>
      </div>

      {/* TAB 1: FLEET MANAGEMENT */}
      {activeTab === "fleet" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-stone-50 p-3 rounded-2xl border border-stone-200">
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Tìm theo biển số, dòng xe..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-600"
                />
              </div>

              <select
                value={seatFilter}
                onChange={(e) => setSeatFilter(e.target.value)}
                className="px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs font-bold focus:outline-none"
              >
                <option value="all">Tất cả số chỗ</option>
                <option value="4">Taxi 4 chỗ</option>
                <option value="7">Xe 7 chỗ</option>
                <option value="9">Xe VIP 9 chỗ</option>
                <option value="16">Xe 16 chỗ</option>
              </select>
            </div>

            <button
              onClick={() => handleOpenVehicleModal()}
              className="w-full sm:w-auto px-4 py-2 bg-[#1b4332] hover:bg-emerald-800 text-white rounded-xl text-xs font-extrabold shadow-sm transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Phương Tiện Mới</span>
            </button>
          </div>

          {/* Vehicles List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFleet.map((v) => (
              <div
                key={v.id}
                className={`border rounded-2xl p-4 transition-all relative flex flex-col justify-between ${
                  v.isVisible ? "bg-white border-stone-200 hover:border-emerald-500 shadow-2xs" : "bg-stone-100 border-stone-300 opacity-60"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                        {v.seats} CHỖ • {v.plate}
                      </span>
                      <h3 className="font-extrabold text-stone-900 text-sm mt-1">{v.model}</h3>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      v.status === "available" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                    }`}>
                      {v.status === "available" ? "✓ Sẵn sàng" : "⏳ Đang bận"}
                    </span>
                  </div>

                  <p className="text-xs text-stone-600 font-sans">
                    <strong>Đơn vị/Lái xe:</strong> {v.provider} ({v.phone})
                  </p>

                  <p className="text-xs text-stone-600 font-sans">
                    <strong>Giá tham khảo:</strong> <span className="font-mono font-bold text-emerald-800">{v.basePrice.toLocaleString()}đ</span>
                  </p>

                  {v.routeQuote && (
                    <div className="p-2 bg-stone-50 rounded-xl border border-stone-200 text-[11px] text-stone-700">
                      <strong>Tuyến cố định:</strong> {v.routeQuote}
                    </div>
                  )}

                  <p className="text-[10px] text-stone-400">Khu vực: {v.serviceArea}</p>
                </div>

                <div className="pt-3 mt-3 border-t border-stone-100 flex justify-between items-center text-xs">
                  <button
                    onClick={() => handleToggleVisible(v.id)}
                    className="flex items-center space-x-1 text-stone-500 hover:text-stone-800 font-bold"
                  >
                    {v.isVisible ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5 text-stone-400" />}
                    <span>{v.isVisible ? "Hiển thị" : "Đã ẩn"}</span>
                  </button>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleOpenVehicleModal(v)}
                      className="p-1.5 bg-stone-100 hover:bg-emerald-50 text-stone-600 hover:text-emerald-800 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteVehicle(v.id)}
                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: TAXI REQUESTS */}
      {activeTab === "requests" && (
        <div className="space-y-4">
          <div className="space-y-3">
            {requests.map((r) => (
              <div key={r.id} className="p-4 rounded-2xl border border-stone-200 bg-stone-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-xs text-stone-800">{r.id}</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded-full uppercase">
                      Taxi {r.seats} Chỗ
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-stone-900">
                    Khách: {r.customerName} - <a href={`tel:${r.customerPhone}`} className="text-emerald-700 font-mono font-bold">{r.customerPhone}</a>
                  </h4>
                  <p className="text-xs text-stone-600">
                    Đón: {r.pickupPoint} ➜ Trả: {r.dropoffPoint} ({r.travelDate} lúc {r.departureTime})
                  </p>
                  {r.notes && <p className="text-[11px] text-stone-500 italic">Ghi chú: "{r.notes}"</p>}
                </div>

                <div className="flex flex-col sm:items-end gap-2 shrink-0">
                  <span className="font-mono font-black text-sm text-emerald-900">{r.quotedPrice.toLocaleString()} VNĐ</span>
                  <div className="flex gap-2">
                    {r.status === "pending" && (
                      <button
                        onClick={() => handleUpdateRequestStatus(r.id, "confirmed")}
                        className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs transition-colors cursor-pointer"
                      >
                        Duyệt Đơn
                      </button>
                    )}
                    {r.status === "confirmed" && (
                      <button
                        onClick={() => handleUpdateRequestStatus(r.id, "completed")}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition-colors cursor-pointer"
                      >
                        Hoàn Thành
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL VEHICLE FORM */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[120] text-left">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-stone-900">
              {editingVehicle ? "Chỉnh sửa phương tiện" : "Thêm phương tiện mới"}
            </h3>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Biển số xe</label>
                  <input
                    type="text"
                    value={formPlate}
                    onChange={(e) => setFormPlate(e.target.value)}
                    placeholder="VD: 26A-123.45"
                    className="w-full p-2 border border-stone-200 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Số chỗ ngồi (tùy chỉnh)</label>
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => setFormSeats(prev => Math.max(1, prev - 1))}
                      className="w-8 h-8 bg-stone-100 hover:bg-emerald-100 text-stone-800 rounded-lg flex items-center justify-center font-bold text-sm border border-stone-200 cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={formSeats}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val) && val > 0) setFormSeats(val);
                      }}
                      placeholder="Nhập số chỗ..."
                      className="w-full text-center p-2 border border-stone-200 rounded-xl font-mono font-bold text-xs bg-white text-stone-900 focus:outline-none focus:border-emerald-600"
                    />
                    <button
                      type="button"
                      onClick={() => setFormSeats(prev => prev + 1)}
                      className="w-8 h-8 bg-stone-100 hover:bg-emerald-100 text-stone-800 rounded-lg flex items-center justify-center font-bold text-sm border border-stone-200 cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {[4, 5, 7, 9, 12, 16, 29, 45].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setFormSeats(preset)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                          formSeats === preset
                            ? "bg-[#1b4332] text-white border-[#1b4332]"
                            : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100"
                        }`}
                      >
                        {preset} chỗ
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Dòng xe & Mô tả</label>
                <input
                  type="text"
                  value={formModel}
                  onChange={(e) => setFormModel(e.target.value)}
                  placeholder="VD: Toyota Vios 2024 mới êm ái"
                  className="w-full p-2 border border-stone-200 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Nhà xe / Lái xe đối tác</label>
                  <input
                    type="text"
                    value={formProvider}
                    onChange={(e) => setFormProvider(e.target.value)}
                    placeholder="Tên đơn vị"
                    className="w-full p-2 border border-stone-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="0971..."
                    className="w-full p-2 border border-stone-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Giá tham khảo (VNĐ)</label>
                <input
                  type="number"
                  step="50000"
                  value={formBasePrice}
                  onChange={(e) => setFormBasePrice(Number(e.target.value) || 0)}
                  className="w-full p-2 border border-stone-200 rounded-xl font-mono font-bold text-emerald-800"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Báo giá tuyến cố định</label>
                <input
                  type="text"
                  value={formRouteQuote}
                  onChange={(e) => setFormRouteQuote(e.target.value)}
                  placeholder="VD: Đi Cầu kính 250k, Đồi chè 150k"
                  className="w-full p-2 border border-stone-200 rounded-xl"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSaveVehicle}
                className="flex-1 py-2.5 bg-[#1b4332] text-white rounded-xl text-xs font-bold hover:bg-emerald-800 cursor-pointer"
              >
                Lưu Phương Tiện
              </button>
              <button
                onClick={() => setIsVehicleModalOpen(false)}
                className="px-4 py-2.5 bg-stone-100 text-stone-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
