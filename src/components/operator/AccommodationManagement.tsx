import React, { useState } from "react";
import { Accommodation } from "../../types";
import { Plus, Edit2, Save, X, Building, Star, MapPin, Trash2, Upload, Loader2 } from "lucide-react";
import { compressImage } from "../../lib/imageUtils";

interface AccommodationManagementProps {
  accommodations: Accommodation[];
  onUpdateAccommodations: (updated: Accommodation[]) => void;
}

export default function AccommodationManagement({ accommodations, onUpdateAccommodations }: AccommodationManagementProps) {
  const [editingAcc, setEditingAcc] = useState<Accommodation | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const handleDelete = (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa khách sạn này?")) {
      const nextAccs = accommodations.filter(a => a.id !== id);
      onUpdateAccommodations(nextAccs);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !editingAcc) return;

    setIsCompressing(true);
    try {
      for (const file of Array.from(files) as File[]) {
        const compressedBase64 = await compressImage(file, 800, 800, 0.6);
        setEditingAcc(prev => {
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

  const handleSave = (updated: Accommodation) => {
    // Clean up empty lines from arrays
    const cleaned: Accommodation = {
      ...updated,
      images: updated.images.filter(img => img.trim()),
      amenities: updated.amenities.filter(a => a.trim())
    };

    const exists = accommodations.find(a => a.id === cleaned.id);
    const nextAccs = exists 
      ? accommodations.map(a => a.id === cleaned.id ? cleaned : a)
      : [...accommodations, cleaned];
    onUpdateAccommodations(nextAccs);
    setEditingAcc(null);
  };

  const handleAddNew = () => {
    setEditingAcc({
      id: `acc_${Date.now()}`,
      name: "",
      rating: 5,
      type: "Khách Sạn",
      description: "",
      images: [],
      location: "",
      amenities: [],
      roomTypes: []
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-black text-[#1b4332]">Quản lý Khách sạn & Resort (Mộc Châu)</h3>
        <button 
          onClick={handleAddNew}
          className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4" /> Thêm Khách sạn Mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {accommodations.map(acc => (
          <div key={acc.id} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex gap-4">
                <div className="relative group">
                  <img src={acc.images?.[0] || "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=cover&w=400&q=80"} alt={acc.name} className="w-24 h-24 rounded-lg object-cover" />
                  {acc.images?.length > 1 && (
                    <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md">
                      +{acc.images.length - 1} ảnh
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-stone-900 leading-tight">{acc.name}</h4>
                  <div className="flex items-center gap-1 text-amber-500">
                    {acc.rating === 0 ? (
                      <span className="bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded text-[9px] font-black border border-stone-200">TIÊU CHUẨN</span>
                    ) : acc.rating === 1 ? (
                      <span className="bg-stone-50 text-stone-500 px-1.5 py-0.5 rounded text-[9px] font-black border border-stone-200">0 SAO</span>
                    ) : (
                      Array.from({ length: acc.rating - 1 }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-current" />
                      ))
                    )}
                  </div>
                  <p className="text-stone-500 text-xs font-medium">{acc.type}</p>
                  <p className="text-stone-400 text-[10px] flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {acc.location}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => setEditingAcc(acc)}
                  className="p-2 text-stone-400 hover:text-emerald-600 cursor-pointer"
                  title="Chỉnh sửa"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(acc.id)}
                  className="p-2 text-stone-400 hover:text-rose-600 cursor-pointer"
                  title="Xóa"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-1.5">
              {acc.amenities.map((amen, i) => (
                <span key={i} className="text-[9px] px-2 py-0.5 bg-stone-50 border border-stone-200 text-stone-500 rounded-lg">
                  {amen}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {editingAcc && (
        <div className="fixed inset-0 bg-stone-900/50 flex items-center justify-center p-4 backdrop-blur-sm z-50">
          <div className="bg-white p-6 sm:p-8 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-lg text-[#1b4332]">Chỉnh sửa Khách sạn</h3>
              <button onClick={() => setEditingAcc(null)} className="p-2 hover:bg-stone-100 rounded-full">
                <X className="w-5 h-5 text-stone-400" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Tên Khách sạn / Resort</label>
                <input 
                  className="w-full mt-1 p-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                  value={editingAcc.name} 
                  onChange={e => setEditingAcc({...editingAcc, name: e.target.value})}
                />
              </div>
              
              <div>
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Loại hình</label>
                <select 
                  className="w-full mt-1 p-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  value={editingAcc.type}
                  onChange={e => setEditingAcc({...editingAcc, type: e.target.value})}
                >
                  <option value="Khách Sạn">Khách Sạn</option>
                  <option value="Resort">Resort</option>
                  <option value="Homestay">Homestay</option>
                  <option value="Nhà Nghỉ">Nhà Nghỉ</option>
                  <option value="Căn Hộ">Căn Hộ</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                  Xếp hạng / Tiêu chuẩn
                </label>
                <select 
                  className="w-full mt-1 p-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  value={editingAcc.rating}
                  onChange={e => setEditingAcc({...editingAcc, rating: Number(e.target.value)})}
                >
                  <option value={0}>Tiêu Chuẩn</option>
                  <option value={1}>0 Sao</option>
                  <option value={2}>1 Sao</option>
                  <option value={3}>2 Sao</option>
                  <option value={4}>3 Sao</option>
                  <option value={5}>4 Sao</option>
                  <option value={6}>5 Sao</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Địa chỉ chi tiết</label>
                <input 
                  className="w-full mt-1 p-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                  value={editingAcc.location} 
                  onChange={e => setEditingAcc({...editingAcc, location: e.target.value})}
                />
              </div>

              <div className="sm:col-span-2">
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
                  value={editingAcc.images.join('\n')} 
                  onChange={e => setEditingAcc({...editingAcc, images: e.target.value.split('\n')})}
                  placeholder="Link ảnh 1&#10;Link ảnh 2"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Mô tả ngắn</label>
                <textarea 
                  className="w-full mt-1 p-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                  rows={3}
                  value={editingAcc.description} 
                  onChange={e => setEditingAcc({...editingAcc, description: e.target.value})}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Điểm nổi bật (Mỗi dòng 1 ý - Hiển thị Tag)</label>
                <textarea 
                  className="w-full mt-1 p-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                  rows={4}
                  value={editingAcc.amenities.join('\n')} 
                  onChange={e => setEditingAcc({...editingAcc, amenities: e.target.value.split('\n')})}
                  placeholder="Hồ bơi nước ấm&#10;Buffet sáng sang trọng&#10;Phòng Gym"
                />
              </div>
            </div>

            <div className="pt-6 flex gap-3 border-t border-stone-100">
              <button 
                onClick={() => handleSave(editingAcc)} 
                className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-900/10 hover:bg-emerald-700 transition-colors"
              >
                Lưu Khách sạn
              </button>
              <button 
                onClick={() => setEditingAcc(null)} 
                className="px-6 py-3 bg-stone-100 text-stone-600 rounded-xl text-sm font-bold hover:bg-stone-200 transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
