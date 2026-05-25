import React, { useState } from "react";
import { TourCombo, Accommodation } from "../../types";
import { Plus, Edit2, Save, X, Image as ImageIcon, Building, Trash2, Upload } from "lucide-react";

interface ComboManagementProps {
  combos: TourCombo[];
  onUpdateCombos: (updated: TourCombo[]) => void;
  accommodations: Accommodation[];
}

export default function ComboManagement({ combos, onUpdateCombos, accommodations }: ComboManagementProps) {
  const [editingCombo, setEditingCombo] = useState<TourCombo | null>(null);

  const handleDelete = (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa combo này?")) {
      const nextCombos = combos.filter(c => c.id !== id);
      onUpdateCombos(nextCombos);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !editingCombo) return;

    (Array.from(files) as File[]).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setEditingCombo(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            images: [...prev.images, base64String]
          };
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSave = (updated: TourCombo) => {
    // Clean up empty lines from arrays
    const cleaned: TourCombo = {
      ...updated,
      images: updated.images.filter(img => img.trim()),
      highlights: updated.highlights.filter(h => h.trim()),
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
      slug: "",
      tag: "",
      durationText: "",
      highlights: [],
      description: "",
      pricePerPerson: 0,
      originalPrice: 0
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
                  <p className="text-stone-500 text-xs mt-1">{combo.pricePerPerson.toLocaleString()} đ / người</p>
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
            <h3 className="font-black text-lg">Chỉnh sửa: {editingCombo.name}</h3>
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
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Giá bán mỗi người (đ)</label>
                <input 
                  type="number"
                  className="w-full mt-1 p-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono" 
                  value={editingCombo.pricePerPerson} 
                  onChange={e => setEditingCombo({...editingCombo, pricePerPerson: Number(e.target.value) || 0})}
                />
              </div>
              <div>
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
                  <label className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[9px] font-black cursor-pointer hover:bg-emerald-100 transition-colors">
                    <Upload className="w-3 h-3" />
                    TẢI ẢNH TỪ MÁY
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
                <textarea 
                  className="w-full mt-1 p-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono" 
                  rows={4}
                  value={editingCombo.images.join('\n')} 
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
                  value={editingCombo.highlights.join('\n')} 
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
