import React, { useState } from "react";
import { TourCombo, Accommodation } from "../../types";
import { Plus, Edit2, Save, X, Image as ImageIcon, Building, Trash2, Upload, Loader2 } from "lucide-react";
import { compressImage } from "../../lib/imageUtils";

interface ComboManagementProps {
  combos: TourCombo[];
  onUpdateCombos: (updated: TourCombo[]) => void;
  accommodations: Accommodation[];
}

export default function ComboManagement({ combos, onUpdateCombos, accommodations }: ComboManagementProps) {
  const [editingCombo, setEditingCombo] = useState<TourCombo | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const handleDelete = (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa combo này?")) {
      const nextCombos = combos.filter(c => c.id !== id);
      onUpdateCombos(nextCombos);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !editingCombo) return;

    setIsCompressing(true);
    try {
      for (const file of Array.from(files) as File[]) {
        const compressedBase64 = await compressImage(file, 500, 500, 0.4);
        setEditingCombo(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            images: [...prev.images, compressedBase64]
          };
        });
      }
    } catch (error) {
      console.error("Compression error:", error);
      alert("Lỗi khi xử lý ảnh.");
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSave = (updated: TourCombo) => {
    // Clean up empty lines from arrays
    const cleaned: TourCombo = {
      ...updated,
      images: (updated.images || []).filter(img => img && img.trim()),
      highlights: (updated.highlights || []).filter(h => h && h.trim()),
      itinerary: updated.itinerary 
        ? updated.itinerary.filter(i => i.title.trim() || i.content.trim())
        : undefined
    };

    const exists = combos.find(c => c.id === cleaned.id);
    const nextCombos = exists 
      ? combos.map(c => c.id === cleaned.id ? cleaned : c)
      : [...combos, cleaned];
    onUpdateCombos(nextCombos);
    setEditingCombo(null);
  };

  const handleAddNew = () => {
    setEditingCombo({
      id: `combo_${Date.now()}`,
      name: "",
      accommodationId: "",
      images: [],
      slug: `combo-${Date.now()}`,
      tag: "Mới",
      durationText: "2 Ngày 1 Đêm",
      highlights: [],
      description: "",
      pricePerPerson: 0,
      priceWeekday: 0,
      priceWeekend: 0,
      originalPrice: 0,
      itinerary: [
        { day: 1, title: "Hà Nội - Mộc Châu", content: "Di chuyển và nhận phòng" },
        { day: 2, title: "Mộc Châu - Hà Nội", content: "Tham quan và trở về" }
      ]
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-black text-[#1b4332]">Quản lý Combo Xe và Phòng</h3>
        <button 
          onClick={handleAddNew}
          className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4" /> Thêm Combo Mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {combos.map(combo => (
          <div key={combo.id} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex gap-4">
                <img 
                  src={combo.images?.[0] || "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=cover&w=400&q=80"} 
                  alt={combo.name} 
                  className="w-20 h-20 rounded-lg object-cover bg-stone-100" 
                />
                <div>
                  <h4 className="font-bold text-stone-900 line-clamp-1">{combo.name}</h4>
                  <div className="flex flex-col mt-1">
                    <p className="text-emerald-700 text-[10px] font-bold">Thường: {combo.priceWeekday?.toLocaleString() || combo.pricePerPerson.toLocaleString()} đ</p>
                    <p className="text-orange-600 text-[10px] font-bold">Cuối tuần: {combo.priceWeekend?.toLocaleString() || combo.pricePerPerson.toLocaleString()} đ</p>
                  </div>
                  <p className="text-[10px] text-stone-400 mt-1 uppercase tracking-wider font-bold">{combo.durationText || "Lịch trình tùy chọn"}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => setEditingCombo(combo)}
                  className="p-2 text-stone-400 hover:text-emerald-600 cursor-pointer"
                  title="Chỉnh sửa"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(combo.id)}
                  className="p-2 text-stone-400 hover:text-rose-600 cursor-pointer"
                  title="Xóa"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editingCombo && (
        <div className="fixed inset-0 bg-stone-900/50 flex items-center justify-center p-4 backdrop-blur-sm z-50">
          <div className="bg-white p-8 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-xl text-[#1b4332]">
                {combos.find(c => c.id === editingCombo.id) ? `Chỉnh sửa: ${editingCombo.name}` : "Thêm Combo Mới"}
              </h3>
              <button onClick={() => setEditingCombo(null)} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-stone-400" />
              </button>
            </div>
            {/* Simple form for fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Tên Combo</label>
                <input 
                  className="w-full mt-1 p-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                  value={editingCombo.name} 
                  onChange={e => setEditingCombo({...editingCombo, name: e.target.value})}
                />
              </div>

              <div className="col-span-2">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Khách sạn liên kết</label>
                <select 
                  className="w-full mt-1 p-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  value={editingCombo.accommodationId}
                  onChange={e => setEditingCombo({...editingCombo, accommodationId: e.target.value})}
                >
                  <option value="">-- Chọn khách sạn --</option>
                  {accommodations.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Giá Ngày Thường (T2-T5)</label>
                <input 
                  type="number"
                  className="w-full mt-1 p-2.5 border border-emerald-100 bg-emerald-50/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono" 
                  value={editingCombo.priceWeekday || editingCombo.pricePerPerson} 
                  onChange={e => setEditingCombo({...editingCombo, priceWeekday: Number(e.target.value) || 0, pricePerPerson: Number(e.target.value) || 0})}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">Giá Cuối Tuần (T6-CN)</label>
                <input 
                  type="number"
                  className="w-full mt-1 p-2.5 border border-orange-100 bg-orange-50/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono" 
                  value={editingCombo.priceWeekend || editingCombo.pricePerPerson} 
                  onChange={e => setEditingCombo({...editingCombo, priceWeekend: Number(e.target.value) || 0})}
                />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Giá gốc chưa giảm (đ)</label>
                <input 
                  type="number"
                  className="w-full mt-1 p-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono" 
                  value={editingCombo.originalPrice} 
                  onChange={e => setEditingCombo({...editingCombo, originalPrice: Number(e.target.value) || 0})}
                />
              </div>
              <div className="col-span-2">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Danh sách Ảnh (Mỗi link 1 dòng)</label>
                  <label className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-black cursor-pointer hover:bg-emerald-700 transition-all shadow-sm disabled:opacity-50">
                    {isCompressing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                    {isCompressing ? "ĐANG XỬ LÝ..." : "TẢI ẢNH TỪ MÁY TÍNH"}
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      multiple
                      disabled={isCompressing}
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
                <textarea 
                  className="w-full mt-1 p-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono" 
                  rows={4}
                  value={(editingCombo.images || []).join('\n')} 
                  onChange={e => setEditingCombo({...editingCombo, images: e.target.value.split('\n')})}
                  placeholder="Link ảnh 1&#10;Link ảnh 2"
                />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Mô tả Combo</label>
                <textarea 
                  className="w-full mt-1 p-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                  rows={3}
                  value={editingCombo.description} 
                  onChange={e => setEditingCombo({...editingCombo, description: e.target.value})}
                />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Nội dung bao gồm (Mỗi dòng 1 ý)</label>
                <textarea 
                  className="w-full mt-1 p-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                  rows={4}
                  value={(editingCombo.highlights || []).join('\n')} 
                  onChange={e => setEditingCombo({...editingCombo, highlights: e.target.value.split('\n')})}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Thời gian (VD: 2N1Đ)</label>
                <input 
                  className="w-full mt-1 p-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                  value={editingCombo.durationText} 
                  onChange={e => setEditingCombo({...editingCombo, durationText: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Nhãn (Tag)</label>
                <input 
                  className="w-full mt-1 p-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                  value={editingCombo.tag} 
                  onChange={e => setEditingCombo({...editingCombo, tag: e.target.value})}
                />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Lịch trình chi tiết (Ngày | Tiêu đề | Nội dung - Mỗi dòng 1 ngày)</label>
                <textarea 
                  className="w-full mt-1 p-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans" 
                  rows={4}
                  value={editingCombo.itinerary?.map(i => `${i.day} | ${i.title} | ${i.content}`).join('\n') || ""} 
                  onChange={e => {
                    const str = e.target.value;
                    const lines = str.split('\n');
                    const nextItinerary = lines.map(l => {
                      const [day, title, content] = l.split('|').map(s => s.trim());
                      return { day: parseInt(day) || 1, title: title || "", content: content || "" };
                    });
                    setEditingCombo({...editingCombo, itinerary: nextItinerary});
                  }}
                  placeholder="1 | Hà Nội - Mộc Châu | Đón khách tại Hà Nội, check-in khách sạn...&#10;2 | Khám phá Mộc Châu | Tham quan Đồi Chè, Cầu Kính..."
                />
              </div>
            </div>
            {/* Add more fields here */}
            <div className="pt-4 flex gap-3">
              <button onClick={() => handleSave(editingCombo)} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold">Lưu thay đổi</button>
              <button onClick={() => setEditingCombo(null)} className="px-4 py-2 bg-stone-100 text-stone-600 rounded-xl text-xs font-bold cursor-pointer">Hủy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
