import React, { useState } from "react";
import { Destination } from "../../types";
import { Plus, Edit2, Trash2, X, Check, Image as ImageIcon, MapPin, Tag, Clock, Info, Upload, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { compressImage } from "../../lib/imageUtils";

interface DestinationManagementProps {
  destinations: Destination[];
  onUpdateDestinations: (updated: Destination[]) => void;
}

export default function DestinationManagement({ destinations, onUpdateDestinations }: DestinationManagementProps) {
  const [editingDest, setEditingDest] = useState<Destination | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !editingDest) return;

    setIsCompressing(true);
    try {
      for (const file of Array.from(files) as File[]) {
        const compressedBase64 = await compressImage(file, 800, 800, 0.6);
        setEditingDest(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            image: compressedBase64
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

  const handleSave = (updated: Destination) => {
    const exists = destinations.find(d => d.id === updated.id);
    const nextDests = exists 
      ? destinations.map(d => d.id === updated.id ? updated : d)
      : [...destinations, updated];
    onUpdateDestinations(nextDests);
    setEditingDest(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa địa danh này?")) {
      onUpdateDestinations(destinations.filter(d => d.id !== id));
    }
  };

  const startNew = () => {
    setEditingDest({
      id: `dest_${Date.now()}`,
      name: "",
      image: "",
      tag: "",
      distance: "",
      description: "",
      bestTime: "",
      tips: ""
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-black text-stone-800 uppercase tracking-tight">Danh sách địa danh Khám phá</h3>
        <button 
          onClick={startNew}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all cursor-pointer shadow-lg shadow-emerald-900/20"
        >
          <Plus className="w-4 h-4" />
          Thêm Địa Danh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {destinations.map(dest => (
          <div key={dest.id} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex gap-4">
                <img src={dest.image || null} alt={dest.name} className="w-24 h-24 rounded-lg object-cover" />
                <div>
                  <h4 className="font-bold text-stone-900">{dest.name}</h4>
                  <p className="text-stone-500 text-xs mt-1">{dest.tag}</p>
                  <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold mt-2">
                    <MapPin className="w-3 h-3" />
                    {dest.distance}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditingDest(dest)} className="p-2 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(dest.id)} className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {editingDest && (
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="px-8 py-6 border-b border-stone-100 flex justify-between items-center shrink-0">
                <h3 className="text-xl font-black text-stone-900">Chi tiết địa danh</h3>
                <button onClick={() => setEditingDest(null)} className="p-2 hover:bg-stone-100 rounded-full cursor-pointer transition-all">
                  <X className="w-5 h-5 text-stone-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Tên địa danh</label>
                    <input 
                      className="w-full mt-1 p-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                      value={editingDest.name} 
                      onChange={e => setEditingDest({...editingDest, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Tag hiển thị</label>
                    <input 
                      className="w-full mt-1 p-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                      value={editingDest.tag} 
                      onChange={e => setEditingDest({...editingDest, tag: e.target.value})}
                      placeholder="Miễn phí / Hot checkin..."
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Khoảng cách</label>
                    <input 
                      className="w-full mt-1 p-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                      value={editingDest.distance} 
                      onChange={e => setEditingDest({...editingDest, distance: e.target.value})}
                      placeholder="Cách trung tâm 5km"
                    />
                  </div>
                  <div className="col-span-2">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Link Ảnh bài viết</label>
                      <label className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-black cursor-pointer hover:bg-emerald-700 transition-all shadow-sm disabled:opacity-50">
                        {isCompressing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                        {isCompressing ? "ĐANG XỬ LÝ..." : "CHỌN ẢNH TỪ MÁY"}
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          disabled={isCompressing}
                          onChange={handleFileUpload}
                        />
                      </label>
                    </div>
                    <input 
                      className="w-full mt-1 p-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono" 
                      value={editingDest.image} 
                      onChange={e => setEditingDest({...editingDest, image: e.target.value})}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Mô tả ngắn</label>
                    <textarea 
                      className="w-full mt-1 p-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans" 
                      rows={3}
                      value={editingDest.description} 
                      onChange={e => setEditingDest({...editingDest, description: e.target.value})}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Thời gian lý tưởng</label>
                    <input 
                      className="w-full mt-1 p-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                      value={editingDest.bestTime} 
                      onChange={e => setEditingDest({...editingDest, bestTime: e.target.value})}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Mẹo du lịch</label>
                    <textarea 
                      className="w-full mt-1 p-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans" 
                      rows={3}
                      value={editingDest.tips} 
                      onChange={e => setEditingDest({...editingDest, tips: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-stone-100 flex gap-3 shrink-0 bg-stone-50/50">
                <button 
                  onClick={() => setEditingDest(null)}
                  className="flex-1 py-3 border border-stone-200 text-stone-600 rounded-xl text-sm font-bold hover:bg-stone-100 transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={() => handleSave(editingDest)}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/20 cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
