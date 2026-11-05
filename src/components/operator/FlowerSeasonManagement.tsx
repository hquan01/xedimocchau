import React, { useState, useEffect } from "react";
import { CalendarDays, Plus, Edit2, Trash2, MapPin, CheckCircle2, Clock, Sparkles, AlertTriangle, Eye, EyeOff } from "lucide-react";

export interface FlowerSeasonItem {
  id: string;
  name: string;
  timeRange: string;
  location: string;
  status: "dang_no" | "sap_no" | "da_qua" | "thu_hoach";
  verificationDate: string;
  verifier: string;
  description: string;
  bestTimeOfDay: string;
  checkInTips: string;
  published: boolean;
}

const INITIAL_SEASONS: FlowerSeasonItem[] = [
  {
    id: "flower-01",
    name: "Mùa Hoa Mận Trắng Tinh Khôi",
    timeRange: "Tháng 1 - Tháng 2",
    location: "Thung lũng mận Nà Ka, Thung lũng Mu Náu, Bản Pa Phách",
    status: "sap_no",
    verificationDate: "03/11/2026",
    verifier: "Ban QL Du lịch & Kiểm lâm Mộc Châu",
    description: "Cả thung lũng Nà Ka khoác lên mình màu áo trắng muốt như tuyết. Hoa nở rộ trắng trời tạo nên khung cảnh tiên cảnh độc nhất vô nhị vùng Tây Bắc.",
    bestTimeOfDay: "08:00 - 10:30 sáng (khi nắng sớm rọi qua màn sương mỏng)",
    checkInTips: "Nên mang trang phục màu nổi (đỏ, vàng, cam hoặc váy thổ cẩm) để có những khung hình nổi bật nhất.",
    published: true
  },
  {
    id: "flower-02",
    name: "Mùa Mận Hậu Chín Đỏ",
    timeRange: "Tháng 4 - Tháng 6",
    location: "Vườn mận Nà Ka, Phiêng Cành, Bản Pa Phách",
    status: "da_qua",
    verificationDate: "01/11/2026",
    verifier: "Hợp tác xã Nông nghiệp Mộc Châu",
    description: "Du khách tự tay hái những trái mận hậu chín căng mọng phủ phấn trắng, chấm cùng muối ớt mắc khén cay nồng tại gốc.",
    bestTimeOfDay: "Buổi sáng mát trời",
    checkInTips: "Nên đi giày thể thao có độ bám tốt để leo đồi mận an toàn.",
    published: true
  },
  {
    id: "flower-03",
    name: "Mùa Hoa Cải Trắng & Hoa Dã Quỳ",
    timeRange: "Tháng 11 - Tháng 12",
    location: "Rừng thông Bản Áng, Thung lũng Ba Phách, Bản Áng 2",
    status: "dang_no",
    verificationDate: "03/11/2026",
    verifier: "Trạm Khảo sát Du lịch Cao nguyên",
    description: "Cánh đồng hoa cải trắng bạt ngàn mênh mông, điểm xuyết những vạt hoa dã quỳ vàng rực rỡ dọc cung đường đèo.",
    bestTimeOfDay: "14:30 - 17:00 chiều đón hoàng hôn",
    checkInTips: "Giá vé vào chụp ảnh tại các vườn cải khoảng 20.000đ - 30.000đ/người.",
    published: true
  },
  {
    id: "flower-04",
    name: "Săn Mây Đỉnh Pha Luông & Tà Xùa Mộc Châu",
    timeRange: "Quanh năm (đẹp nhất Tháng 10 - Tháng 3)",
    location: "Đỉnh Pha Luông, Bản Hang Kia, Xã Chiềng Sơn",
    status: "dang_no",
    verificationDate: "02/11/2026",
    verifier: "Hướng dẫn viên bản địa",
    description: "Biển mây bồng bềnh cuồn cuộn dưới chân núi cao 2.000m. Không khí se lạnh tinh khôi lúc bình minh.",
    bestTimeOfDay: "05:30 - 07:30 sáng",
    checkInTips: "Bắt buộc có áo ấm dày, giày trekking và theo dõi dự báo thời tiết trước khi leo núi.",
    published: true
  }
];

export default function FlowerSeasonManagement() {
  const [seasons, setSeasons] = useState<FlowerSeasonItem[]>(() => {
    try {
      const saved = localStorage.getItem("mocchau_operator_flower_seasons");
      return saved ? JSON.parse(saved) : INITIAL_SEASONS;
    } catch {
      return INITIAL_SEASONS;
    }
  });

  const [editingItem, setEditingItem] = useState<FlowerSeasonItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [formName, setFormName] = useState("");
  const [formTimeRange, setFormTimeRange] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formStatus, setFormStatus] = useState<FlowerSeasonItem["status"]>("dang_no");
  const [formDescription, setFormDescription] = useState("");
  const [formBestTime, setFormBestTime] = useState("");
  const [formTips, setFormTips] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem("mocchau_operator_flower_seasons", JSON.stringify(seasons));
    } catch (e) {
      console.warn("Could not save flower seasons", e);
    }
  }, [seasons]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormName("");
    setFormTimeRange("Tháng 11 - Tháng 12");
    setFormLocation("Bản Áng, Thung lũng Nà Ka");
    setFormStatus("dang_no");
    setFormDescription("");
    setFormBestTime("08:00 - 10:30 sáng");
    setFormTips("Trang phục màu sáng chụp ảnh đẹp");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: FlowerSeasonItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormTimeRange(item.timeRange);
    setFormLocation(item.location);
    setFormStatus(item.status);
    setFormDescription(item.description);
    setFormBestTime(item.bestTimeOfDay);
    setFormTips(item.checkInTips);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const todayStr = new Date().toLocaleDateString("vi-VN");
    let updated: FlowerSeasonItem[] = [];

    if (editingItem) {
      updated = seasons.map(s =>
        s.id === editingItem.id
          ? {
              ...s,
              name: formName.trim(),
              timeRange: formTimeRange.trim(),
              location: formLocation.trim(),
              status: formStatus,
              verificationDate: todayStr,
              description: formDescription.trim(),
              bestTimeOfDay: formBestTime.trim(),
              checkInTips: formTips.trim()
            }
          : s
      );
    } else {
      const newItem: FlowerSeasonItem = {
        id: `flower_${Date.now()}`,
        name: formName.trim(),
        timeRange: formTimeRange.trim() || "Tháng 1 - Tháng 2",
        location: formLocation.trim() || "Mộc Châu",
        status: formStatus,
        verificationDate: todayStr,
        verifier: "Điều hành Mộc Châu Travel",
        description: formDescription.trim() || "Thông tin mùa hoa đang cập nhật.",
        bestTimeOfDay: formBestTime.trim() || "08:00 - 10:00",
        checkInTips: formTips.trim() || "Mang giày thể thao đi lại thuận tiện.",
        published: true
      };
      updated = [newItem, ...seasons];
    }

    try {
      const { saveCollectionItemsToFirebase } = await import("../../lib/firebaseUtils");
      await saveCollectionItemsToFirebase("flower_seasons", updated);
      setSeasons(updated);
      setIsModalOpen(false);
    } catch (err: any) {
      alert("Chưa thể lưu thông tin mùa hoa lên máy chủ: " + (err?.message || "Lỗi kết nối"));
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa mùa hoa này?")) {
      const updated = seasons.filter(s => s.id !== id);
      try {
        const { saveCollectionItemsToFirebase } = await import("../../lib/firebaseUtils");
        await saveCollectionItemsToFirebase("flower_seasons", updated);
        setSeasons(updated);
      } catch (err: any) {
        alert("Chưa thể xóa mùa hoa trên máy chủ: " + (err?.message || "Lỗi kết nối"));
      }
    }
  };

  const handleTogglePublish = async (id: string) => {
    const updated = seasons.map(s => (s.id === id ? { ...s, published: !s.published } : s));
    try {
      const { saveCollectionItemsToFirebase } = await import("../../lib/firebaseUtils");
      await saveCollectionItemsToFirebase("flower_seasons", updated);
      setSeasons(updated);
    } catch (err: any) {
      alert("Chưa thể cập nhật hiển thị trên máy chủ: " + (err?.message || "Lỗi kết nối"));
    }
  };

  const getStatusBadge = (status: FlowerSeasonItem["status"]) => {
    switch (status) {
      case "dang_no":
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-black px-2.5 py-0.5 rounded-full">🌸 Đang nở rộ đẹp nhất</span>;
      case "sap_no":
        return <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-full">🌱 Sắp vào mùa</span>;
      case "thu_hoach":
        return <span className="bg-purple-100 text-purple-800 border border-purple-300 text-[10px] font-black px-2.5 py-0.5 rounded-full">🍇 Đang vào vụ thu hoạch</span>;
      case "da_qua":
        return <span className="bg-stone-100 text-stone-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Đã qua mùa</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <CalendarDays className="w-5 h-5 text-emerald-700" />
            <h3 className="text-base font-black text-stone-900">Quản Lý Tình Trạng Mùa Hoa & Trải Nghiệm Mộc Châu</h3>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Dữ liệu được đồng bộ trực tiếp ra mục <strong>"Mộc Châu hôm nay có gì?"</strong> để khách du lịch nắm bắt tình trạng thực tế trước khi đặt xe.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-[#1b4332] hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Cập Nhật Mùa Hoa Mới</span>
        </button>
      </div>

      {/* Cards list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {seasons.map(item => (
          <div
            key={item.id}
            className={`bg-white p-5 rounded-2xl border transition-all ${
              item.published ? "border-stone-200 shadow-xs" : "border-stone-200 opacity-60 bg-stone-50"
            }`}
          >
            <div className="flex justify-between items-start gap-3">
              <div>
                <h4 className="font-black text-stone-900 text-base">{item.name}</h4>
                <div className="mt-1 flex items-center space-x-2">
                  {getStatusBadge(item.status)}
                  <span className="text-[11px] text-stone-400 font-mono font-medium">({item.timeRange})</span>
                </div>
              </div>

              <button
                onClick={() => handleTogglePublish(item.id)}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  item.published
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-stone-100 text-stone-500 border-stone-200"
                }`}
                title={item.published ? "Đang hiển thị trên website" : "Đang ẩn khỏi website"}
              >
                {item.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>

            <p className="text-xs text-stone-600 mt-3 leading-relaxed font-sans">{item.description}</p>

            <div className="mt-3 pt-3 border-t border-stone-100 space-y-1.5 text-xs text-stone-600 font-sans">
              <div className="flex items-start space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                <span className="font-semibold text-stone-800">{item.location}</span>
              </div>
              <div className="flex items-start space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span>Giờ chụp đẹp: <strong>{item.bestTimeOfDay}</strong></span>
              </div>
              <div className="flex items-start space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-[11px] text-stone-500">{item.checkInTips}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
              <span className="font-sans">Xác minh: {item.verificationDate} bởi {item.verifier}</span>

              <div className="flex items-center space-x-1">
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

      {/* Edit/Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-left text-xs">
            <div className="flex justify-between items-center border-b border-stone-100 pb-3">
              <h3 className="font-black text-stone-900 text-base">
                {editingItem ? "Chỉnh sửa mùa hoa / trải nghiệm" : "Thêm mùa hoa / trải nghiệm mới"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-stone-700 font-bold p-1 cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Tên mùa hoa / trải nghiệm *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Ví dụ: Mùa hoa mận trắng Nà Ka"
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Thời gian thường nở</label>
                  <input
                    type="text"
                    value={formTimeRange}
                    onChange={e => setFormTimeRange(e.target.value)}
                    placeholder="Tháng 1 - Tháng 2"
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600 font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Trạng thái thực tế</label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600 font-medium"
                  >
                    <option value="dang_no">🌸 Đang nở rộ</option>
                    <option value="sap_no">🌱 Sắp nở</option>
                    <option value="thu_hoach">🍇 Đang thu hoạch</option>
                    <option value="da_qua">Đã qua mùa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Địa điểm ngắm hoa đẹp nhất</label>
                <input
                  type="text"
                  value={formLocation}
                  onChange={e => setFormLocation(e.target.value)}
                  placeholder="Thung lũng Nà Ka, Thung lũng Mu Náu, Bản Pa Phách..."
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Mô tả chi tiết & Cảm nhận thực tế</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="Mô tả mật độ hoa, cảnh quan thung lũng..."
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Thời điểm chụp đẹp trong ngày</label>
                  <input
                    type="text"
                    value={formBestTime}
                    onChange={e => setFormBestTime(e.target.value)}
                    placeholder="08:00 - 10:30 sáng"
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Mẹo check-in / Trang phục</label>
                  <input
                    type="text"
                    value={formTips}
                    onChange={e => setFormTips(e.target.value)}
                    placeholder="Mặc váy nổi bật, giày thể thao..."
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

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
                  Lưu & Xuất Bản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
