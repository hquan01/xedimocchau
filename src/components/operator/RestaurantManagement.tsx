import React, { useState, useEffect } from "react";
import { Search, Plus, Edit2, Trash2, CheckCircle, Clock, MapPin, Phone, DollarSign, UtensilsCrossed, AlertCircle, RefreshCw } from "lucide-react";

export interface RestaurantItem {
  id: string;
  name: string;
  category: "dac_san" | "quan_an" | "cafe_view" | "lau_nuong";
  address: string;
  phone: string;
  priceRange: string;
  openHours: string;
  specialties: string[];
  isPartner: boolean;
  commissionRate: number; // % hoa hồng
  status: "active" | "hidden";
  rating: number;
}

const INITIAL_RESTAURANTS: RestaurantItem[] = [
  {
    id: "rest-01",
    name: "Nhà hàng Bê Chao 64 Mộc Châu",
    category: "dac_san",
    address: "Tiểu khu Chiềng Đi, TT. Nông Trường Mộc Châu",
    phone: "0969.811.666",
    priceRange: "150.000đ - 300.000đ / người",
    openHours: "07:00 - 22:00",
    specialties: ["Bê chao nóng giòn chấm tương gừng", "Cá suối chiên", "Rau cải mèo xào tỏi"],
    isPartner: true,
    commissionRate: 10,
    status: "active",
    rating: 4.9
  },
  {
    id: "rest-02",
    name: "Nhà hàng Cá Hồi & Cá Tầm Vườn Đào",
    category: "dac_san",
    address: "Tiểu khu Vườn Đào, TT. Nông Trường Mộc Châu",
    phone: "0982.592.592",
    priceRange: "200.000đ - 400.000đ / người",
    openHours: "08:00 - 22:00",
    specialties: ["Gỏi cá hồi tươi", "Lẩu cá tầm măng cay", "Cháo cá hồi"],
    isPartner: true,
    commissionRate: 10,
    status: "active",
    rating: 4.8
  },
  {
    id: "rest-03",
    name: "Nhà hàng Nam Mèo - Ẩm thực Tây Bắc",
    category: "dac_san",
    address: "Ngã 3 Rừng Thông Bản Áng, Đông Sang, Mộc Châu",
    phone: "0971.050.324",
    priceRange: "120.000đ - 250.000đ / người",
    openHours: "09:00 - 22:30",
    specialties: ["Lẩu gà đồi lá é", "Lợn bản nướng mắc khén", "Cơm lam nếp nương"],
    isPartner: true,
    commissionRate: 8,
    status: "active",
    rating: 4.7
  },
  {
    id: "rest-04",
    name: "Tiệm Cà Phê Đồi Gió Mộc Châu",
    category: "cafe_view",
    address: "Đỉnh đồi chè Trái Tim, TT. Nông Trường",
    phone: "0945.123.789",
    priceRange: "35.000đ - 65.000đ",
    openHours: "06:30 - 18:30",
    specialties: ["Cà phê muối Bản Áng", "Trà ô long sữa tươi Mộc Châu", "Sữa chua nếp cẩm"],
    isPartner: false,
    commissionRate: 0,
    status: "active",
    rating: 4.9
  }
];

export default function RestaurantManagement() {
  const [restaurants, setRestaurants] = useState<RestaurantItem[]>(() => {
    try {
      const saved = localStorage.getItem("mocchau_operator_restaurants");
      return saved ? JSON.parse(saved) : INITIAL_RESTAURANTS;
    } catch {
      return INITIAL_RESTAURANTS;
    }
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [editingItem, setEditingItem] = useState<RestaurantItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState<RestaurantItem["category"]>("dac_san");
  const [formAddress, setFormAddress] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formPriceRange, setFormPriceRange] = useState("");
  const [formOpenHours, setFormOpenHours] = useState("");
  const [formSpecialties, setFormSpecialties] = useState("");
  const [formIsPartner, setFormIsPartner] = useState(false);
  const [formCommission, setFormCommission] = useState(10);

  useEffect(() => {
    try {
      localStorage.setItem("mocchau_operator_restaurants", JSON.stringify(restaurants));
    } catch (e) {
      console.warn("Could not save restaurants to localStorage", e);
    }
  }, [restaurants]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormName("");
    setFormCategory("dac_san");
    setFormAddress("");
    setFormPhone("");
    setFormPriceRange("150.000đ - 300.000đ / người");
    setFormOpenHours("08:00 - 22:00");
    setFormSpecialties("");
    setFormIsPartner(true);
    setFormCommission(10);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: RestaurantItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormAddress(item.address);
    setFormPhone(item.phone);
    setFormPriceRange(item.priceRange);
    setFormOpenHours(item.openHours);
    setFormSpecialties(item.specialties.join(", "));
    setFormIsPartner(item.isPartner);
    setFormCommission(item.commissionRate);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const specs = formSpecialties
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    if (editingItem) {
      setRestaurants(prev =>
        prev.map(r =>
          r.id === editingItem.id
            ? {
                ...r,
                name: formName.trim(),
                category: formCategory,
                address: formAddress.trim(),
                phone: formPhone.trim(),
                priceRange: formPriceRange.trim(),
                openHours: formOpenHours.trim(),
                specialties: specs.length > 0 ? specs : r.specialties,
                isPartner: formIsPartner,
                commissionRate: Number(formCommission) || 0
              }
            : r
        )
      );
    } else {
      const newItem: RestaurantItem = {
        id: `rest_${Date.now()}`,
        name: formName.trim(),
        category: formCategory,
        address: formAddress.trim() || "Thị trấn Mộc Châu, Sơn La",
        phone: formPhone.trim() || "0971.050.324",
        priceRange: formPriceRange.trim() || "150.000đ - 300.000đ",
        openHours: formOpenHours.trim() || "08:00 - 22:00",
        specialties: specs.length > 0 ? specs : ["Đặc sản Tây Bắc"],
        isPartner: formIsPartner,
        commissionRate: Number(formCommission) || 10,
        status: "active",
        rating: 5.0
      };
      setRestaurants(prev => [newItem, ...prev]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa cơ sở ẩm thực này?")) {
      setRestaurants(prev => prev.filter(r => r.id !== id));
    }
  };

  const handleToggleStatus = (id: string) => {
    setRestaurants(prev =>
      prev.map(r => (r.id === id ? { ...r, status: r.status === "active" ? "hidden" : "active" } : r))
    );
  };

  const filtered = restaurants.filter(r => {
    const matchSearch =
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchCat = categoryFilter === "all" || r.category === categoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <UtensilsCrossed className="w-5 h-5 text-emerald-700" />
            <h3 className="text-base font-black text-stone-900">Quản Lý Nhà Hàng & Ẩm Thực Mộc Châu</h3>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Tổng cộng: <strong className="text-stone-800 font-mono">{restaurants.length}</strong> cơ sở • {restaurants.filter(r => r.isPartner).length} đối tác liên kết
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-[#1b4332] hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Nhà Hàng / Quán Ăn Mới</span>
        </button>
      </div>

      {/* Filter & Search controls */}
      <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên nhà hàng, món đặc sản (bê chao, cá hồi...), địa chỉ..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-600"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-700 focus:outline-none cursor-pointer"
          >
            <option value="all">Tất cả phân loại</option>
            <option value="dac_san">Đặc sản Mộc Châu</option>
            <option value="lau_nuong">Lẩu & Nướng than hồng</option>
            <option value="cafe_view">Quán Cafe view đẹp</option>
            <option value="quan_an">Quán ăn gia đình</option>
          </select>
        </div>
      </div>

      {/* Grid of restaurants */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(item => (
          <div
            key={item.id}
            className={`bg-white p-5 rounded-2xl border transition-all ${
              item.status === "active" ? "border-stone-200 shadow-xs" : "border-stone-200 opacity-60 bg-stone-50"
            }`}
          >
            <div className="flex justify-between items-start gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-black text-stone-900 text-sm">{item.name}</h4>
                  {item.isPartner && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full border border-emerald-300">
                      Đối tác (+{item.commissionRate}%)
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-500 flex items-center space-x-1 mt-1 font-sans">
                  <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span className="line-clamp-1">{item.address}</span>
                </p>
              </div>

              <span
                onClick={() => handleToggleStatus(item.id)}
                className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg cursor-pointer ${
                  item.status === "active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-stone-200 text-stone-600"
                }`}
                title="Bấm để ẩn/hiện"
              >
                {item.status === "active" ? "Xuất bản" : "Đang ẩn"}
              </span>
            </div>

            {/* Specialties tag chips */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {item.specialties.map((s, idx) => (
                <span key={idx} className="text-[10px] font-medium bg-amber-50 text-amber-900 px-2 py-0.5 rounded-md border border-amber-200">
                  {s}
                </span>
              ))}
            </div>

            {/* Details row */}
            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-stone-100 text-xs text-stone-600 font-sans">
              <div>
                <span className="text-[10px] text-stone-400 block font-bold uppercase">Giờ phục vụ</span>
                <span className="font-mono font-bold text-stone-800">{item.openHours}</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 block font-bold uppercase">Khoảng giá</span>
                <span className="font-mono font-bold text-emerald-800">{item.priceRange}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
              <a
                href={`tel:${item.phone.replace(/[^0-9]/g, "")}`}
                className="text-xs font-bold text-stone-700 hover:text-emerald-700 inline-flex items-center space-x-1"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>{item.phone}</span>
              </a>

              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => handleOpenEdit(item)}
                  className="p-1.5 text-stone-600 hover:text-emerald-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                  title="Chỉnh sửa"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Xóa"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-stone-100 pb-3">
              <h3 className="font-black text-stone-900 text-base">
                {editingItem ? "Chỉnh sửa nhà hàng" : "Thêm nhà hàng / quán ăn mới"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-left text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Tên cơ sở ẩm thực *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Ví dụ: Nhà hàng Bê Chao 64 Mộc Châu"
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Phân loại</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600 font-medium"
                  >
                    <option value="dac_san">Đặc sản Mộc Châu</option>
                    <option value="lau_nuong">Lẩu & Nướng than</option>
                    <option value="cafe_view">Cafe view đồi</option>
                    <option value="quan_an">Quán ăn dân dã</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Số điện thoại liên hệ</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    placeholder="0971.050.324"
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Địa chỉ chi tiết</label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={e => setFormAddress(e.target.value)}
                  placeholder="Ví dụ: Tiểu khu Chiềng Đi, TT. Nông Trường Mộc Châu"
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Khoảng giá tham khảo</label>
                  <input
                    type="text"
                    value={formPriceRange}
                    onChange={e => setFormPriceRange(e.target.value)}
                    placeholder="150.000đ - 300.000đ / người"
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Giờ mở cửa</label>
                  <input
                    type="text"
                    value={formOpenHours}
                    onChange={e => setFormOpenHours(e.target.value)}
                    placeholder="08:00 - 22:00"
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Món ăn đặc sản (ngăn cách bằng dấu phẩy)</label>
                <input
                  type="text"
                  value={formSpecialties}
                  onChange={e => setFormSpecialties(e.target.value)}
                  placeholder="Bê chao nóng giòn, Cá suối nướng, Rau cải mèo..."
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-stone-800 block">Cơ sở Đối tác liên kết</span>
                  <span className="text-[11px] text-stone-500">Được gợi ý ưu tiên cho khách đặt xe QT Limousine</span>
                </div>
                <input
                  type="checkbox"
                  checked={formIsPartner}
                  onChange={e => setFormIsPartner(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                />
              </div>

              {formIsPartner && (
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Tỷ lệ hoa hồng thỏa thuận (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={formCommission}
                    onChange={e => setFormCommission(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600 font-mono"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-stone-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 rounded-xl text-stone-600 hover:bg-stone-50 font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1b4332] hover:bg-emerald-800 text-white rounded-xl font-bold cursor-pointer shadow-sm"
                >
                  Lưu Thông Tin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
