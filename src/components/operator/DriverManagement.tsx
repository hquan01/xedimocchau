import React, { useState } from "react";
import { Driver } from "../../types";
import { Plus, Trash2, Edit3, Car, Phone, Shield, Search, Check, X, AlertCircle, PhoneCall, Copy, UserCheck } from "lucide-react";

interface DriverManagementProps {
  drivers: Driver[];
  onUpdateDrivers: (updated: Driver[]) => void;
}

export default function DriverManagement({
  drivers = [],
  onUpdateDrivers,
}: DriverManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "busy" | "off">("all");
  
  // Modal state for Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formPlate, setFormPlate] = useState("");
  const [formCarType, setFormCarType] = useState("Limousine VIP 9 chỗ Dcar");
  const [formExperience, setFormExperience] = useState(5);
  const [formStatus, setFormStatus] = useState<"active" | "busy" | "off">("active");
  const [formNote, setFormNote] = useState("");
  const [formError, setFormError] = useState("");

  // Delete confirm state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [copySuccessPhone, setCopySuccessPhone] = useState<string | null>(null);

  // Open modal for new driver
  const handleOpenAddModal = () => {
    setEditingDriver(null);
    setFormName("");
    setFormPhone("");
    setFormPlate("");
    setFormCarType("Limousine VIP 9 chỗ Dcar");
    setFormExperience(5);
    setFormStatus("active");
    setFormNote("");
    setFormError("");
    setIsModalOpen(true);
  };

  // Open modal for editing driver
  const handleOpenEditModal = (driver: Driver) => {
    setEditingDriver(driver);
    setFormName(driver.name);
    setFormPhone(driver.phone);
    setFormPlate(driver.plate);
    setFormCarType(driver.carType || "Limousine VIP 9 chỗ Dcar");
    setFormExperience(driver.experienceYears || 5);
    setFormStatus(driver.status || "active");
    setFormNote(driver.note || "");
    setFormError("");
    setIsModalOpen(true);
  };

  // Submit Add / Edit
  const handleSaveDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError("Vui lòng nhập họ tên lái xe / tài xế");
      return;
    }
    if (!formPhone.trim()) {
      setFormError("Vui lòng nhập số điện thoại lái xe");
      return;
    }
    if (!formPlate.trim()) {
      setFormError("Vui lòng nhập biển số xe");
      return;
    }

    if (editingDriver) {
      // Edit existing
      const updated = drivers.map((dr) =>
        dr.id === editingDriver.id
          ? {
              ...dr,
              name: formName.trim(),
              phone: formPhone.trim(),
              plate: formPlate.trim().toUpperCase(),
              carType: formCarType.trim(),
              experienceYears: Number(formExperience) || 0,
              status: formStatus,
              note: formNote.trim(),
            }
          : dr
      );
      onUpdateDrivers(updated);
    } else {
      // Add new
      const newDriver: Driver = {
        id: `dr_${Date.now()}`,
        name: formName.trim(),
        phone: formPhone.trim(),
        plate: formPlate.trim().toUpperCase(),
        carType: formCarType.trim(),
        experienceYears: Number(formExperience) || 0,
        status: formStatus,
        note: formNote.trim(),
      };
      onUpdateDrivers([...drivers, newDriver]);
    }

    setIsModalOpen(false);
    setEditingDriver(null);
  };

  // Quick toggle status
  const handleQuickStatusChange = (driverId: string, nextStatus: "active" | "busy" | "off") => {
    const updated = drivers.map((dr) =>
      dr.id === driverId ? { ...dr, status: nextStatus } : dr
    );
    onUpdateDrivers(updated);
  };

  // Delete driver
  const handleDeleteDriver = (driverId: string) => {
    const updated = drivers.filter((dr) => dr.id !== driverId);
    onUpdateDrivers(updated);
    setDeleteConfirmId(null);
  };

  // Copy phone helper
  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopySuccessPhone(phone);
    setTimeout(() => setCopySuccessPhone(null), 2500);
  };

  // Filtered list
  const filteredDrivers = drivers.filter((dr) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      dr.name.toLowerCase().includes(term) ||
      dr.phone.includes(term) ||
      dr.plate.toLowerCase().includes(term) ||
      (dr.carType || "").toLowerCase().includes(term) ||
      (dr.note || "").toLowerCase().includes(term);

    const matchesStatus = statusFilter === "all" || (dr.status || "active") === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeCount = drivers.filter((dr) => (dr.status || "active") === "active").length;
  const busyCount = drivers.filter((dr) => dr.status === "busy").length;
  const offCount = drivers.filter((dr) => dr.status === "off").length;

  return (
    <div className="space-y-6 text-left animate-fade-in" id="driver_manager_section">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-blue-100 text-blue-900 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              ĐỘI XE & TÀI XẾ
            </span>
            <span className="text-stone-400 text-xs">• Limousine Mộc Châu</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-[#1b4332] mt-1">
            Quản Lý Danh Sách Lái Xe & Phương Tiện
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Thêm mới, sửa đổi thông tin hoặc xóa tài xế. Dữ liệu này sẽ tự động gợi ý khi điều hành gán lái xe cho các vé đặt và chuyến đi!
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md shadow-emerald-700/20 transition-all cursor-pointer shrink-0 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Lái Xe Mới</span>
        </button>
      </div>

      {/* Overview Stat Widgets */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
          <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider flex items-center justify-between">
            <span>Tổng đội xe</span>
            <Car className="w-4 h-4 text-stone-400" />
          </div>
          <p className="text-2xl font-black text-stone-900 mt-1 font-mono">{drivers.length} <span className="text-xs font-normal text-stone-500">tài xế</span></p>
        </div>

        <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200">
          <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center justify-between">
            <span>🟢 Sẵn sàng nhận chuyến</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-1 font-mono">{activeCount} <span className="text-xs font-normal text-emerald-600">xe</span></p>
        </div>

        <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200">
          <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center justify-between">
            <span>🟡 Đang chạy trên đường</span>
            <Car className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-700 mt-1 font-mono">{busyCount} <span className="text-xs font-normal text-amber-600">xe</span></p>
        </div>

        <div className="bg-stone-100 p-4 rounded-2xl border border-stone-200">
          <div className="text-[11px] font-bold text-stone-600 uppercase tracking-wider flex items-center justify-between">
            <span>⚪ Đang nghỉ phép</span>
            <Shield className="w-4 h-4 text-stone-400" />
          </div>
          <p className="text-2xl font-black text-stone-700 mt-1 font-mono">{offCount} <span className="text-xs font-normal text-stone-500">tài xế</span></p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên lái xe, số điện thoại, biển số xe, loại xe..."
            className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-800 focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider shrink-0 mr-1">Lọc:</span>
          {(["all", "active", "busy", "off"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                statusFilter === st
                  ? "bg-[#1b4332] text-white shadow-xs"
                  : "bg-stone-100 hover:bg-stone-200 text-stone-600"
              }`}
            >
              {st === "all" && `Tất cả (${drivers.length})`}
              {st === "active" && `🟢 Sẵn sàng (${activeCount})`}
              {st === "busy" && `🟡 Đang chạy (${busyCount})`}
              {st === "off" && `⚪ Tạm nghỉ (${offCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Driver Cards Grid */}
      {filteredDrivers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDrivers.map((driver) => {
            const status = driver.status || "active";
            return (
              <div
                key={driver.id}
                className="bg-white rounded-2xl border border-stone-200 hover:border-emerald-300 shadow-2xs hover:shadow-md transition-all p-5 flex flex-col justify-between group"
              >
                <div>
                  {/* Top Header of Card */}
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-stone-100">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                        {driver.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-base font-black text-stone-900 tracking-tight">
                            {driver.name}
                          </h4>
                          {driver.experienceYears ? (
                            <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-bold">
                              {driver.experienceYears} năm KN
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs text-stone-500 font-medium">
                          {driver.carType || "Limousine VIP 9 chỗ"}
                        </p>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div className="relative">
                      <select
                        value={status}
                        onChange={(e) => handleQuickStatusChange(driver.id, e.target.value as any)}
                        className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full border cursor-pointer focus:outline-none transition-colors ${
                          status === "active"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                            : status === "busy"
                            ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                            : "bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200"
                        }`}
                      >
                        <option value="active">🟢 Sẵn sàng</option>
                        <option value="busy">🟡 Đang chạy</option>
                        <option value="off">⚪ Tạm nghỉ</option>
                      </select>
                    </div>
                  </div>

                  {/* Body Details */}
                  <div className="py-3.5 space-y-2.5 text-xs">
                    {/* License plate */}
                    <div className="flex items-center justify-between bg-stone-50 px-3 py-2 rounded-xl border border-stone-200/80">
                      <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Biển số xe:</span>
                      <span className="font-mono font-black text-sm bg-white px-2 py-0.5 rounded-lg border border-stone-300 text-stone-900 shadow-2xs">
                        🚗 {driver.plate}
                      </span>
                    </div>

                    {/* Phone Number with Click to Call and Copy */}
                    <div className="flex items-center justify-between bg-blue-50/60 px-3 py-2 rounded-xl border border-blue-100">
                      <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">Số điện thoại:</span>
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`tel:${driver.phone}`}
                          className="font-mono font-black text-sm text-blue-700 hover:text-blue-900 hover:underline flex items-center gap-1"
                          title="Gọi trực tiếp cho tài xế"
                        >
                          <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
                          <span>{driver.phone}</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => handleCopyPhone(driver.phone)}
                          className="p-1 text-stone-400 hover:text-blue-600 rounded transition-colors"
                          title="Sao chép số điện thoại"
                        >
                          {copySuccessPhone === driver.phone ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Notes / Route info */}
                    {driver.note && (
                      <div className="text-[11px] text-stone-600 bg-stone-50/80 p-2.5 rounded-xl border border-stone-200/60 italic leading-relaxed">
                        <span className="font-bold text-stone-700 not-italic mr-1">📝 Ghi chú:</span>
                        {driver.note}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(driver)}
                    className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-stone-600" />
                    <span>Chỉnh sửa</span>
                  </button>

                  {deleteConfirmId === driver.id ? (
                    <div className="flex items-center gap-1 bg-red-100 border border-red-300 p-1 rounded-xl animate-fade-in">
                      <button
                        type="button"
                        onClick={() => handleDeleteDriver(driver.id)}
                        className="px-2 py-1 bg-red-700 hover:bg-red-800 text-white font-black rounded-lg text-[10px] uppercase shadow-xs transition-colors cursor-pointer"
                      >
                        Xóa thật
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-1.5 py-1 text-stone-600 hover:text-stone-900 text-[10px] font-bold cursor-pointer"
                      >
                        Hủy
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteConfirmId(driver.id);
                        setTimeout(() => {
                          setDeleteConfirmId((prev) => (prev === driver.id ? null : prev));
                        }, 5000);
                      }}
                      className="p-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/80 rounded-xl transition-colors cursor-pointer"
                      title="Xóa tài xế khỏi danh sách"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-stone-50 rounded-3xl p-12 text-center border border-dashed border-stone-300 space-y-3">
          <div className="w-12 h-12 bg-stone-200 text-stone-500 rounded-full flex items-center justify-center mx-auto">
            <Car className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-stone-800">Không tìm thấy lái xe nào phù hợp</h4>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            {searchTerm ? `Không có lái xe nào khớp với từ khóa "${searchTerm}".` : "Danh sách lái xe đang trống. Vui lòng bấm nút Thêm Lái Xe Mới để bổ sung vào đội xe."}
          </p>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Lái Xe Ngay</span>
          </button>
        </div>
      )}

      {/* ADD / EDIT DRIVER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[130] animate-fade-in text-left">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-stone-200 animate-scale-up">
            {/* Modal Header */}
            <div className="bg-[#1b4332] text-white p-5 relative">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold cursor-pointer transition-colors"
              >
                ✕
              </button>
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-emerald-400" />
                <span className="text-[10px] bg-emerald-400 text-stone-950 font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {editingDriver ? "CHỈNH SỬA LÁI XE" : "THÊM LÁI XE MỚI"}
                </span>
              </div>
              <h3 className="text-lg font-black tracking-tight mt-1.5 text-white">
                {editingDriver ? `Cập nhật: ${editingDriver.name}` : "Bổ sung tài xế vào đội xe"}
              </h3>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveDriver} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-black text-stone-700 uppercase tracking-wider block">
                  Họ tên lái xe / Tài xế <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Anh Hải, Anh Tuấn..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              {/* Phone & License Plate Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-stone-700 uppercase tracking-wider block">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: 0971050324"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono font-bold text-stone-900 focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black text-stone-700 uppercase tracking-wider block">
                    Biển số xe <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: 26F-008.88"
                    value={formPlate}
                    onChange={(e) => setFormPlate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono font-bold text-stone-900 uppercase focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>

              {/* Car Type & Preset Suggestions */}
              <div className="space-y-1">
                <label className="text-[11px] font-black text-stone-700 uppercase tracking-wider block">
                  Dòng xe & Số chỗ ngồi
                </label>
                <input
                  type="text"
                  placeholder="VD: Limousine VIP 9 chỗ Dcar, Xe Ghép 7 chỗ..."
                  value={formCarType}
                  onChange={(e) => setFormCarType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium text-stone-900 focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
                {/* Suggestions */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {[
                    "Limousine VIP 9 chỗ Dcar",
                    "Limousine VIP 9 chỗ Solati",
                    "Limousine VIP 9 chỗ Skybus",
                    "Xe Ghép 7 chỗ Xpander/Innova",
                    "Xe Hợp Đồng Riêng 4-7 chỗ",
                  ].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setFormCarType(sug)}
                      className="px-2 py-0.5 bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 text-stone-600 rounded text-[10px] font-semibold transition-colors cursor-pointer"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status & Experience */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-stone-700 uppercase tracking-wider block">
                    Trạng thái hoạt động
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:bg-white focus:outline-none focus:border-emerald-600"
                  >
                    <option value="active">🟢 Sẵn sàng nhận chuyến</option>
                    <option value="busy">🟡 Đang chạy trên đường</option>
                    <option value="off">⚪ Tạm nghỉ / Bảo dưỡng</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black text-stone-700 uppercase tracking-wider block">
                    Số năm kinh nghiệm
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={40}
                    value={formExperience}
                    onChange={(e) => setFormExperience(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Note / Route specializations */}
              <div className="space-y-1">
                <label className="text-[11px] font-black text-stone-700 uppercase tracking-wider block">
                  Ghi chú lái xe (Tuyến sở trường, điểm đón quen thuộc...)
                </label>
                <textarea
                  rows={3}
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="VD: Lái xe cẩn thận, chuyên đón trả tận nhà khu vực Cầu Giấy - Mộc Châu..."
                  className="w-full p-3 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium text-stone-900 focus:bg-white focus:outline-none focus:border-emerald-600"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-3 border-t border-stone-100">
                <button
                  type="submit"
                  className="flex-1 bg-[#1b4332] hover:bg-emerald-800 text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-md shadow-emerald-950/10 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingDriver ? "Lưu Thay Đổi" : "Thêm Lái Xe"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
