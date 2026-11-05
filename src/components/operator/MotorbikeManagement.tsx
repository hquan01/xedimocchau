import React, { useState, useEffect } from "react";
import { Bike, Plus, Edit2, Trash2, Search, Eye, EyeOff, CheckCircle2, MapPin, Phone, Clock, FileText } from "lucide-react";

export interface MotorbikeVehicle {
  id: string;
  plate: string;
  model: string; // e.g. "Wave Alpha 110", "Vision 2024", "Air Blade 125"
  type: "manual" | "scooter"; // Xe số / Xe tay ga
  totalQuantity: number;
  availableQuantity: number;
  dailyPrice: number; // e.g. 150000đ / ngày
  pickupLocations: string[]; // e.g. ["Bến xe Mộc Châu", "Giao tận nơi Homestay"]
  rentalRequirements: string; // e.g. "CCCD / Hộ chiếu bản gốc + Cọc 500k"
  status: "available" | "full" | "maintenance";
  isVisible: boolean;
}

export interface MotorbikeBookingRequest {
  id: string;
  customerName: string;
  customerPhone: string;
  bikeType: "Xe Số (Wave/RSX)" | "Xe Tay Ga (Vision/AirBlade)";
  quantity: number;
  startDate: string;
  endDate: string;
  deliveryLocation: string;
  totalAmount: number;
  depositStatus: "chua_coc" | "da_coc" | "hoan_tat";
  status: "pending" | "confirmed" | "completed" | "cancelled";
  createdAt: string;
}

const INITIAL_MOTORBIKES: MotorbikeVehicle[] = [
  {
    id: "mb-01",
    plate: "26B1-123.45",
    model: "Honda Wave Alpha / RSX 110cc",
    type: "manual",
    totalQuantity: 15,
    availableQuantity: 12,
    dailyPrice: 150000,
    pickupLocations: ["Bến xe Limousine Mộc Châu", "Giao tận Homestay/Khách sạn miễn phí"],
    rentalRequirements: "Ảnh CCCD chính chủ hoặc Bằng lái xe. Tặng kèm 2 mũ bảo hiểm + 1 áo mưa.",
    status: "available",
    isVisible: true
  },
  {
    id: "mb-02",
    plate: "26B1-888.99",
    model: "Honda Vision / Air Blade 125cc",
    type: "scooter",
    totalQuantity: 10,
    availableQuantity: 8,
    dailyPrice: 200000,
    pickupLocations: ["Bến xe Limousine Mộc Châu", "Giao tận Homestay/Khách sạn miễn phí"],
    rentalRequirements: "CCCD / Hộ chiếu + Cọc 300k. Tặng kèm 2 mũ bảo hiểm đạt chuẩn + bản đồ du lịch.",
    status: "available",
    isVisible: true
  }
];

const INITIAL_RENTAL_REQUESTS: MotorbikeBookingRequest[] = [
  {
    id: "mb-req-01",
    customerName: "Trần Đức Nam",
    customerPhone: "0978.555.666",
    bikeType: "Xe Số (Wave/RSX)",
    quantity: 2,
    startDate: "2026-11-06",
    endDate: "2026-11-08",
    deliveryLocation: "Nhà Ta Homestay Mộc Châu",
    totalAmount: 600000,
    depositStatus: "da_coc",
    status: "confirmed",
    createdAt: "2026-11-03 10:00"
  }
];

export default function MotorbikeManagement() {
  const [activeTab, setActiveTab] = useState<"fleet" | "requests">("fleet");

  const [fleet, setFleet] = useState<MotorbikeVehicle[]>(() => {
    try {
      const saved = localStorage.getItem("mocchau_admin_motorbike_fleet");
      return saved ? JSON.parse(saved) : INITIAL_MOTORBIKES;
    } catch {
      return INITIAL_MOTORBIKES;
    }
  });

  const [requests, setRequests] = useState<MotorbikeBookingRequest[]>(() => {
    try {
      const saved = localStorage.getItem("mocchau_admin_motorbike_requests");
      return saved ? JSON.parse(saved) : INITIAL_RENTAL_REQUESTS;
    } catch {
      return INITIAL_RENTAL_REQUESTS;
    }
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const [editingBike, setEditingBike] = useState<MotorbikeVehicle | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [formPlate, setFormPlate] = useState("");
  const [formModel, setFormModel] = useState("");
  const [formType, setFormType] = useState<"manual" | "scooter">("manual");
  const [formTotalQty, setFormTotalQty] = useState(10);
  const [formAvailableQty, setFormAvailableQty] = useState(8);
  const [formPrice, setFormPrice] = useState(150000);
  const [formLocations, setFormLocations] = useState("Giao tận nơi Homestay / Bến xe");
  const [formRequirements, setFormRequirements] = useState("CCCD / Bằng lái xe + Mũ bảo hiểm miễn phí");

  useEffect(() => {
    localStorage.setItem("mocchau_admin_motorbike_fleet", JSON.stringify(fleet));
  }, [fleet]);

  useEffect(() => {
    localStorage.setItem("mocchau_admin_motorbike_requests", JSON.stringify(requests));
  }, [requests]);

  const handleOpenModal = (bike?: MotorbikeVehicle) => {
    if (bike) {
      setEditingBike(bike);
      setFormPlate(bike.plate);
      setFormModel(bike.model);
      setFormType(bike.type);
      setFormTotalQty(bike.totalQuantity);
      setFormAvailableQty(bike.availableQuantity);
      setFormPrice(bike.dailyPrice);
      setFormLocations(bike.pickupLocations.join(", "));
      setFormRequirements(bike.rentalRequirements);
    } else {
      setEditingBike(null);
      setFormPlate("");
      setFormModel("");
      setFormType("manual");
      setFormTotalQty(10);
      setFormAvailableQty(8);
      setFormPrice(150000);
      setFormLocations("Giao tận nơi Homestay Mộc Châu / Bến xe Limousine");
      setFormRequirements("CCCD / Hộ chiếu chính chủ + Tặng 2 mũ bảo hiểm đạt chuẩn");
    }
    setIsModalOpen(true);
  };

  const handleSaveBike = async () => {
    if (!formModel.trim()) {
      alert("Vui lòng nhập tên dòng xe!");
      return;
    }

    let updatedFleet: MotorbikeVehicle[] = [];
    if (editingBike) {
      updatedFleet = fleet.map(b => b.id === editingBike.id ? {
        ...b,
        plate: formPlate.trim(),
        model: formModel.trim(),
        type: formType,
        totalQuantity: Number(formTotalQty) || 1,
        availableQuantity: Number(formAvailableQty) || 0,
        dailyPrice: Number(formPrice) || 150000,
        pickupLocations: formLocations.split(",").map(s => s.trim()).filter(Boolean),
        rentalRequirements: formRequirements.trim()
      } : b);
    } else {
      const newBike: MotorbikeVehicle = {
        id: `mb-${Date.now()}`,
        plate: formPlate.trim() || "26B1-000.00",
        model: formModel.trim(),
        type: formType,
        totalQuantity: Number(formTotalQty) || 1,
        availableQuantity: Number(formAvailableQty) || 1,
        dailyPrice: Number(formPrice) || 150000,
        pickupLocations: formLocations.split(",").map(s => s.trim()).filter(Boolean),
        rentalRequirements: formRequirements.trim(),
        status: "available",
        isVisible: true
      };
      updatedFleet = [newBike, ...fleet];
    }

    setFleet(updatedFleet);
    setIsModalOpen(false);

    try {
      const { saveCollectionItemsToLocalAndFirebase } = await import("../../lib/firebaseUtils");
      await saveCollectionItemsToLocalAndFirebase("motorbike_fleet", "mocchau_admin_motorbike_fleet", updatedFleet);
    } catch (err: any) {
      console.warn("Background Firebase sync failed (saved locally):", err);
    }
  };

  const handleToggleVisible = async (id: string) => {
    const updated = fleet.map(b => b.id === id ? { ...b, isVisible: !b.isVisible } : b);
    setFleet(updated);
    try {
      const { saveCollectionItemsToLocalAndFirebase } = await import("../../lib/firebaseUtils");
      await saveCollectionItemsToLocalAndFirebase("motorbike_fleet", "mocchau_admin_motorbike_fleet", updated);
    } catch (err: any) {
      console.warn("Background Firebase sync failed:", err);
    }
  };

  const handleDeleteBike = async (id: string) => {
    alert("Nút xóa đã được bấm!");
    if (confirm("Xóa dòng xe máy này khỏi danh sách quản lý?")) {
      const updated = fleet.filter(b => b.id !== id);
      setFleet(updated);
      try {
        console.log("Attempting to delete bike:", id);
        const { deleteItemFromCollection } = await import("../../lib/firebaseUtils");
        await deleteItemFromCollection("motorbike_fleet", id);
        console.log("Deletion successful.");
      } catch (err: any) {
        console.error("Deletion failed, check Firestore rules:", err);
      }
    }
  };

  const handleUpdateRequestStatus = async (reqId: string, status: MotorbikeBookingRequest["status"]) => {
    const updated = requests.map(r => r.id === reqId ? { ...r, status } : r);
    setRequests(updated);
    try {
      const { saveCollectionItemsToLocalAndFirebase } = await import("../../lib/firebaseUtils");
      await saveCollectionItemsToLocalAndFirebase("motorbike_requests", "mocchau_admin_motorbike_requests", updated);
    } catch (err: any) {
      console.warn("Background Firebase sync failed:", err);
    }
  };

  const filteredFleet = fleet.filter(b => {
    const matchSearch = b.model.toLowerCase().includes(searchTerm.toLowerCase()) || b.plate.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = typeFilter === "all" || b.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 sm:p-8 space-y-6 text-left" id="motorbike_management_root">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-200 pb-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-xs font-extrabold text-emerald-800 uppercase tracking-wider mb-1">
            <span>🛵 Dịch Vụ Cho Thuê Xe Máy Mộc Châu</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900">
            Quản trị Cho Thuê Xe Số & Xe Ga
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Cấu hình số lượng xe số, xe ga, bảng giá thuê theo ngày và xử lý yêu cầu giao xe tận nơi.
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setActiveTab("fleet")}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === "fleet" ? "bg-[#1b4332] text-white shadow-sm" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            🛵 Đội Xe Máy ({fleet.length})
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === "requests" ? "bg-[#1b4332] text-white shadow-sm" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            📋 Đơn Đặt Thuê ({requests.length})
          </button>
        </div>
      </div>

      {/* TAB 1: MOTORBIKE FLEET */}
      {activeTab === "fleet" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-stone-50 p-3 rounded-2xl border border-stone-200">
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Tìm dòng xe, biển số..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-600"
                />
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs font-bold focus:outline-none"
              >
                <option value="all">Tất cả loại xe</option>
                <option value="manual">Xe Số (Wave/RSX)</option>
                <option value="scooter">Xe Tay Ga (Vision/AB)</option>
              </select>
            </div>

            <button
              onClick={() => handleOpenModal()}
              className="w-full sm:w-auto px-4 py-2 bg-[#1b4332] hover:bg-emerald-800 text-white rounded-xl text-xs font-extrabold shadow-sm transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Dòng Xe Máy Mới</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFleet.map((b) => (
              <div
                key={b.id}
                className={`border rounded-2xl p-5 transition-all flex flex-col justify-between ${
                  b.isVisible ? "bg-white border-stone-200 shadow-2xs hover:border-emerald-500" : "bg-stone-100 border-stone-300 opacity-60"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        b.type === "manual" ? "bg-emerald-100 text-emerald-800" : "bg-sky-100 text-sky-800"
                      }`}>
                        {b.type === "manual" ? "XE SỐ" : "XE TAY GA"} • {b.plate}
                      </span>
                      <h3 className="font-extrabold text-stone-900 text-base mt-1">{b.model}</h3>
                    </div>
                    <span className="font-mono font-black text-emerald-900 text-base">
                      {b.dailyPrice.toLocaleString()}đ <span className="text-[10px] text-stone-400 font-normal">/ngày</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                    <div>
                      <span className="text-stone-400 text-[10px] uppercase font-bold block">Tổng số xe</span>
                      <span className="font-bold text-stone-800">{b.totalQuantity} chiếc</span>
                    </div>
                    <div>
                      <span className="text-stone-400 text-[10px] uppercase font-bold block">Xe trống sẵn</span>
                      <span className="font-bold text-emerald-800 font-mono">{b.availableQuantity} chiếc</span>
                    </div>
                  </div>

                  <div className="text-xs space-y-1">
                    <p className="text-stone-700"><strong>Điểm nhận/trả:</strong> {b.pickupLocations.join("; ")}</p>
                    <p className="text-stone-500 text-[11px]"><strong>Điều kiện thuê:</strong> {b.rentalRequirements}</p>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-stone-100 flex justify-between items-center text-xs">
                  <button
                    onClick={() => handleToggleVisible(b.id)}
                    className="flex items-center space-x-1 text-stone-500 hover:text-stone-800 font-bold"
                  >
                    {b.isVisible ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5 text-stone-400" />}
                    <span>{b.isVisible ? "Đang xuất bản" : "Đã ẩn"}</span>
                  </button>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleOpenModal(b)}
                      className="p-1.5 bg-stone-100 hover:bg-emerald-50 text-stone-600 hover:text-emerald-800 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteBike(b.id)}
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

      {/* TAB 2: RENTAL REQUESTS */}
      {activeTab === "requests" && (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="p-4 rounded-2xl border border-stone-200 bg-stone-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-xs text-stone-800">{r.id}</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded-full uppercase">
                    {r.bikeType} x {r.quantity} xe
                  </span>
                </div>
                <h4 className="font-bold text-sm text-stone-900">
                  Khách: {r.customerName} - <a href={`tel:${r.customerPhone}`} className="text-emerald-700 font-mono font-bold">{r.customerPhone}</a>
                </h4>
                <p className="text-xs text-stone-600">
                  Địa điểm giao: {r.deliveryLocation} (Từ {r.startDate} đến {r.endDate})
                </p>
              </div>

              <div className="flex flex-col sm:items-end gap-2 shrink-0">
                <span className="font-mono font-black text-sm text-emerald-900">{r.totalAmount.toLocaleString()} VNĐ</span>
                <div className="flex gap-2">
                  {r.status === "pending" && (
                    <button
                      onClick={() => handleUpdateRequestStatus(r.id, "confirmed")}
                      className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs cursor-pointer"
                    >
                      Duyệt Đơn Giao Xe
                    </button>
                  )}
                  {r.status === "confirmed" && (
                    <button
                      onClick={() => handleUpdateRequestStatus(r.id, "completed")}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs cursor-pointer"
                    >
                      Hoàn Thành Đơn
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[120] text-left">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-stone-900">
              {editingBike ? "Chỉnh sửa thông tin xe máy" : "Thêm loại xe máy mới"}
            </h3>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Loại xe</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full p-2 border border-stone-200 rounded-xl font-bold"
                  >
                    <option value="manual">Xe Số (Wave/RSX)</option>
                    <option value="scooter">Xe Tay Ga (Vision/AB)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Biển số đại diện</label>
                  <input
                    type="text"
                    value={formPlate}
                    onChange={(e) => setFormPlate(e.target.value)}
                    placeholder="26B1-123.45"
                    className="w-full p-2 border border-stone-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Tên dòng xe</label>
                <input
                  type="text"
                  value={formModel}
                  onChange={(e) => setFormModel(e.target.value)}
                  placeholder="VD: Honda Wave Alpha 110cc mới"
                  className="w-full p-2 border border-stone-200 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Tổng xe</label>
                  <input
                    type="number"
                    value={formTotalQty}
                    onChange={(e) => setFormTotalQty(Number(e.target.value) || 1)}
                    className="w-full p-2 border border-stone-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Xe trống</label>
                  <input
                    type="number"
                    value={formAvailableQty}
                    onChange={(e) => setFormAvailableQty(Number(e.target.value) || 0)}
                    className="w-full p-2 border border-stone-200 rounded-xl font-bold text-emerald-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Giá/ngày (đ)</label>
                  <input
                    type="number"
                    step="10000"
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value) || 0)}
                    className="w-full p-2 border border-stone-200 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Địa điểm giao nhận</label>
                <input
                  type="text"
                  value={formLocations}
                  onChange={(e) => setFormLocations(e.target.value)}
                  placeholder="Bến xe, Homestay..."
                  className="w-full p-2 border border-stone-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Điều kiện thuê xe</label>
                <textarea
                  rows={2}
                  value={formRequirements}
                  onChange={(e) => setFormRequirements(e.target.value)}
                  placeholder="Giấy tờ yêu cầu..."
                  className="w-full p-2 border border-stone-200 rounded-xl"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSaveBike}
                className="flex-1 py-2.5 bg-[#1b4332] text-white rounded-xl text-xs font-bold hover:bg-emerald-800 cursor-pointer"
              >
                Lưu Dòng Xe Máy
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
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
